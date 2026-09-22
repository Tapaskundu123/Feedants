import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import * as competitionService from '../services/competitionService';
import Competition from '../models/Competition';

// GET /api/competitions
export const listCompetitions = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    const competitions = await Competition.find({ status: 'active' })
      .select('title category type prizePool entryFee totalSpots bookedSpots dates.registrationClose status')
      .lean({ virtuals: true })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: competitions });
  }
);

// GET /api/competitions/:id
export const getCompetition = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const userId = req.userId;

    const result = await competitionService.getCompetitionWithState(id, userId);

    res.json({ success: true, data: result });
  }
);

// POST /api/competitions/:id/register
export const registerForCompetition = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const userId = req.userId!;
    const { paymentId, referralCode } = req.body;

    const result = await competitionService.registerForCompetition(
      id,
      userId,
      paymentId,
      referralCode
    );

    res.status(201).json({
      success: true,
      message: 'Successfully registered!',
      data: result,
    });
  }
);

// POST /api/competitions/:id/submit
export const submitEntry = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const userId = req.userId!;
    const { submissionUrl } = req.body;

    if (!submissionUrl) {
      res.status(400).json({ success: false, message: 'submissionUrl is required' });
      return;
    }

    const reg = await competitionService.submitCompetitionEntry(id, userId, submissionUrl);

    res.json({ success: true, message: 'Submission received!', data: reg });
  }
);

// GET /api/competitions/:id/referral
export const getReferral = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = String(req.params.id);
    const userId = req.userId!;

    const info = await competitionService.getReferralInfo(id, userId);
    res.json({ success: true, data: info });
  }
);
