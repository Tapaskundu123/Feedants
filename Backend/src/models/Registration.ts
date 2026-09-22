import mongoose, { Document, Schema } from 'mongoose';

export type RegistrationStatus = 'registered' | 'submitted' | 'disqualified';

export interface IRegistration extends Document {
  competitionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  paymentId: string;
  referralCode: string;
  registeredAt: Date;
  submissionUrl: string;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    competitionId: {
      type: Schema.Types.ObjectId,
      ref: 'Competition',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['registered', 'submitted', 'disqualified'],
      default: 'registered',
    },
    paymentId: { type: String, default: '' },
    referralCode: { type: String, default: '' },
    registeredAt: { type: Date, default: Date.now },
    submissionUrl: { type: String, default: '' },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

// Enforce one registration per user per competition at DB level
RegistrationSchema.index({ competitionId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IRegistration>('Registration', RegistrationSchema);
