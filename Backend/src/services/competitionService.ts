import Competition, { ICompetition } from '../models/Competition';
import Registration from '../models/Registration';
import User from '../models/User';
import { createError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

// ─── Determine computed status for frontend state machine ─────
export const computeCompetitionState = (
  competition: ICompetition,
  registrationStatus: string | null
): string => {
  const now = new Date();
  const { registrationClose, submissionStart, submissionEnd } = competition.dates;

  if (competition.status === 'completed') return 'COMPLETED';
  if (competition.status === 'upcoming') return 'UPCOMING';
  if (competition.status === 'closed' || now > submissionEnd) return 'CLOSED';

  if (registrationStatus === 'submitted') return 'SUBMITTED';
  if (registrationStatus === 'registered') {
    // Check if submission window is open
    if (now >= submissionStart && now <= submissionEnd) return 'REGISTERED_SUBMISSION_OPEN';
    return 'REGISTERED';
  }

  // Not registered
  if (now > registrationClose) return 'REGISTRATION_CLOSED';
  if (competition.bookedSpots >= competition.totalSpots) return 'OPEN_FULL';
  return 'OPEN';
};

// ─── Get single competition with user state ─────────────────
export const getCompetitionWithState = async (
  competitionId: string,
  userId?: string
) => {
  if (!mongoose.Types.ObjectId.isValid(competitionId)) {
    throw createError('Invalid competition ID', 400);
  }

  const competition = await Competition.findById(competitionId).lean();
  if (!competition) throw createError('Competition not found', 404);

  // Explicitly compute virtuals — .lean() does not reliably serialize them via JSON
  const remainingSpots = Math.max(0, competition.totalSpots - competition.bookedSpots);
  const isFull = competition.bookedSpots >= competition.totalSpots;

  let registrationStatus: string | null = null;
  let registrationId: string | null = null;

  if (userId) {
    const reg = await Registration.findOne({
      competitionId,
      userId,
    }).lean();
    if (reg) {
      registrationStatus = reg.status;
      registrationId = (reg._id as mongoose.Types.ObjectId).toString();
    }
  }

  const competitionState = computeCompetitionState(
    competition as unknown as ICompetition,
    registrationStatus
  );

  return {
    competition: { ...competition, remainingSpots, isFull },
    registrationStatus,
    registrationId,
    competitionState,
  };
};

// ─── Atomic spot booking with optimistic concurrency ─────────
export const registerForCompetition = async (
  competitionId: string,
  userId: string,
  paymentId: string = 'mock_payment_success',
  referralCode: string = ''
) => {
  if (!mongoose.Types.ObjectId.isValid(competitionId)) {
    throw createError('Invalid competition ID', 400);
  }

  // Check for duplicate in one atomic op
  const existing = await Registration.findOne({ competitionId, userId });
  if (existing) throw createError('Already registered for this competition', 409);

  // Atomic: increment bookedSpots only if spots available and registration open
  const now = new Date();
  const updated = await Competition.findOneAndUpdate(
    {
      _id: competitionId,
      status: 'active',
      'dates.registrationClose': { $gt: now },
      $expr: { $lt: ['$bookedSpots', '$totalSpots'] },
    },
    { $inc: { bookedSpots: 1 } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    // Diagnose why it failed
    const comp = await Competition.findById(competitionId);
    if (!comp) throw createError('Competition not found', 404);
    if (comp.status !== 'active') throw createError('Competition is not active', 422);
    if (now > comp.dates.registrationClose)
      throw createError('Registration is closed', 422);
    if (comp.bookedSpots >= comp.totalSpots)
      throw createError('No spots remaining', 422);
    throw createError('Registration failed, please try again', 500);
  }

  // Create registration record
  const registration = await Registration.create({
    competitionId,
    userId,
    status: 'registered',
    paymentId,
    referralCode,
    registeredAt: now,
  });

  // Credit referral earnings if valid referral code
  if (referralCode) {
    await User.findOneAndUpdate(
      { referralCode },
      { $inc: { referralEarnings: 10 } }
    );
  }

  return { registration, competition: updated };
};

// ─── Submit competition entry ─────────────────────────────────
export const submitCompetitionEntry = async (
  competitionId: string,
  userId: string,
  submissionUrl: string
) => {
  const now = new Date();
  const comp = await Competition.findById(competitionId);
  if (!comp) throw createError('Competition not found', 404);

  if (now < comp.dates.submissionStart)
    throw createError('Submission window has not opened yet', 422);
  if (now > comp.dates.submissionEnd)
    throw createError('Submission window has closed', 422);

  const reg = await Registration.findOneAndUpdate(
    { competitionId, userId, status: 'registered' },
    { status: 'submitted', submissionUrl, submittedAt: now },
    { new: true }
  );

  if (!reg) throw createError('Registration not found or already submitted', 404);
  return reg;
};

// ─── Get or generate referral link for a user/competition ─────
export const getReferralInfo = async (competitionId: string, userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw createError('User not found', 404);

  const comp = await Competition.findById(competitionId, 'referralBaseUrl title');
  if (!comp) throw createError('Competition not found', 404);

  const referralLink = `${comp.referralBaseUrl}/${user.referralCode}`;
  return {
    referralLink,
    referralCode: user.referralCode,
    earningPerSignup: 10,
    totalEarnings: user.referralEarnings,
  };
};
