import mongoose, { Document, Schema, Types } from 'mongoose';
import { LoanStatus } from '../constants/loanStatus';

export interface ILoan extends Document {
  borrowerId: Types.ObjectId;
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: 'Salaried' | 'Self-Employed' | 'Unemployed';
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  
  // Loan terms
  principalAmount: number;
  tenureDays: number;
  interestRate: number; // 12% p.a.
  interestAmount: number; // SI
  totalRepayment: number; // Principal + SI
  totalPaid: number;
  balanceRemaining: number;

  // Lifecycle
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  disbursementReference?: string;
  closedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    pan: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    monthlySalary: {
      type: Number,
      required: true,
      min: 0,
    },
    employmentMode: {
      type: String,
      enum: ['Salaried', 'Self-Employed', 'Unemployed'],
      required: true,
    },
    salarySlipUrl: {
      type: String,
      default: '',
    },
    salarySlipOriginalName: {
      type: String,
      default: '',
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },
    tenureDays: {
      type: Number,
      required: true,
      min: 30,
      max: 365,
    },
    interestRate: {
      type: Number,
      default: 12, // 12% p.a.
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalRepayment: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.APPLIED,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    sanctionedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sanctionedAt: {
      type: Date,
    },
    disbursedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    disbursedAt: {
      type: Date,
    },
    disbursementReference: {
      type: String,
      trim: true,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

LoanSchema.index({ status: 1, createdAt: -1 });

export const LoanModel = mongoose.model<ILoan>('Loan', LoanSchema);
