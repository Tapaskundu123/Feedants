import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  referralCode: string;
  referralEarnings: number;
  referredBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    referralCode: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase(),
    },
    referralEarnings: { type: Number, default: 0, min: 0 },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any;
  if (!doc.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  doc.passwordHash = await bcrypt.hash(doc.passwordHash as string, salt);
});

UserSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model<IUser>('User', UserSchema);
