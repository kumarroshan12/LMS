import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../constants/roles';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  customerProfile?: {
    fullName?: string;
    pan?: string;
    dateOfBirth?: Date;
    monthlySalary?: number;
    employmentMode?: 'Salaried' | 'Self-Employed' | 'Unemployed';
    eligibility?: {
      isEligible: boolean;
      checkedAt: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BORROWER,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    customerProfile: {
      fullName: { type: String, trim: true },
      pan: { type: String, trim: true, uppercase: true },
      dateOfBirth: { type: Date },
      monthlySalary: { type: Number, min: 0 },
      employmentMode: { type: String, enum: ['Salaried', 'Self-Employed', 'Unemployed'] },
      eligibility: {
        isEligible: { type: Boolean, default: false },
        checkedAt: { type: Date },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
