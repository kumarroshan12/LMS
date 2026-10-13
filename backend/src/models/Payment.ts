import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
  loanId: Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  collectedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loanId: {
      type: Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
      index: true,
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);
