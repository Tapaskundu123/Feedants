import mongoose, { Document, Schema } from 'mongoose';

// ─── Sub-schemas ──────────────────────────────────────────────
interface IReward {
  position: number;
  label: string;
  amount: number;
}

interface IJudge {
  name: string;
  title: string;
  experience: string;
  photoUrl: string;
  introVideoUrl: string;
}

interface ICompetitionDates {
  registrationClose: Date;
  submissionStart: Date;
  submissionEnd: Date;
  resultDate: Date;
}

interface IPreviousWinner {
  name: string;
  rank: string;
  photoUrl: string;
  videoUrl: string;
}

// ─── Main interface ────────────────────────────────────────────
export interface ICompetition extends Document {
  title: string;
  category: string;
  type: string;
  hasCertificate: boolean;
  prizePool: number;
  entryFee: number;
  totalSpots: number;
  bookedSpots: number;
  status: 'upcoming' | 'active' | 'closed' | 'completed';
  judge: IJudge;
  dates: ICompetitionDates;
  description: string;
  about: string;
  judgingParameters: string;
  rulesEligibility: string;
  rewards: IReward[];
  disclaimer: string;
  referralBaseUrl: string;
  previousWinners: IPreviousWinner[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────
const RewardSchema = new Schema<IReward>(
  {
    position: { type: Number, required: true },
    label: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const JudgeSchema = new Schema<IJudge>(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    experience: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: '' },
    introVideoUrl: { type: String, default: '' },
  },
  { _id: false }
);

const DatesSchema = new Schema<ICompetitionDates>(
  {
    registrationClose: { type: Date, required: true },
    submissionStart: { type: Date, required: true },
    submissionEnd: { type: Date, required: true },
    resultDate: { type: Date, required: true },
  },
  { _id: false }
);

const PreviousWinnerSchema = new Schema<IPreviousWinner>(
  {
    name: { type: String, required: true, trim: true },
    rank: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
  },
  { _id: false }
);

const CompetitionSchema = new Schema<ICompetition>(
  {
    title: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    hasCertificate: { type: Boolean, default: false },
    prizePool: { type: Number, required: true, min: 0 },
    entryFee: { type: Number, required: true, min: 0 },
    totalSpots: { type: Number, required: true, min: 1 },
    bookedSpots: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'closed', 'completed'],
      default: 'upcoming',
      index: true,
    },
    judge: { type: JudgeSchema, required: true },
    dates: { type: DatesSchema, required: true },
    description: { type: String, default: '' },
    about: { type: String, default: '' },
    judgingParameters: { type: String, default: '' },
    rulesEligibility: { type: String, default: '' },
    rewards: { type: [RewardSchema], default: [] },
    disclaimer: { type: String, default: '' },
    referralBaseUrl: { type: String, default: '' },
    previousWinners: { type: [PreviousWinnerSchema], default: [] },
  },
  {
    timestamps: true,
    // Optimistic concurrency — __v increments on every save
    optimisticConcurrency: true,
  }
);

// Virtual: remaining spots
CompetitionSchema.virtual('remainingSpots').get(function (this: ICompetition) {
  return Math.max(0, this.totalSpots - this.bookedSpots);
});

// Virtual: isFull
CompetitionSchema.virtual('isFull').get(function (this: ICompetition) {
  return this.bookedSpots >= this.totalSpots;
});

CompetitionSchema.set('toJSON', { virtuals: true });
CompetitionSchema.set('toObject', { virtuals: true });

export default mongoose.model<ICompetition>('Competition', CompetitionSchema);
