import { PaymentModel, IPayment } from '../models/Payment';

export class PaymentRepository {
  async findByUtr(utrNumber: string): Promise<IPayment | null> {
    return PaymentModel.findOne({ utrNumber: utrNumber.trim().toUpperCase() });
  }

  async findByLoanId(loanId: string): Promise<IPayment[]> {
    return PaymentModel.find({ loanId })
      .populate('collectedBy', 'fullName email')
      .sort({ createdAt: -1 });
  }

  async create(data: Partial<IPayment>): Promise<IPayment> {
    return PaymentModel.create({
      ...data,
      utrNumber: data.utrNumber?.trim().toUpperCase(),
    });
  }

  async deleteById(id: string): Promise<void> {
    await PaymentModel.findByIdAndDelete(id);
  }

  async getTotalPaymentsSum(): Promise<number> {
    const result = await PaymentModel.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amount' },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalCollected : 0;
  }
}
