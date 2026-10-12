import { LoanModel, ILoan } from '../models/Loan';
import { LoanStatus } from '../constants/loanStatus';

export class LoanRepository {
  async findById(id: string): Promise<ILoan | null> {
    return LoanModel.findById(id).populate('borrowerId', 'fullName email phone');
  }

  async findByBorrowerId(borrowerId: string): Promise<ILoan[]> {
    return LoanModel.find({ borrowerId }).sort({ createdAt: -1 });
  }

  async findLatestByBorrowerId(borrowerId: string): Promise<ILoan | null> {
    return LoanModel.findOne({ borrowerId }).sort({ createdAt: -1 });
  }

  async create(data: Partial<ILoan>): Promise<ILoan> {
    return LoanModel.create(data);
  }

  async updateById(id: string, updateData: Partial<ILoan>): Promise<ILoan | null> {
    return LoanModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async findByStatus(status: LoanStatus | LoanStatus[]): Promise<ILoan[]> {
    const filter = Array.isArray(status) ? { status: { $in: status } } : { status };
    return LoanModel.find(filter)
      .populate('borrowerId', 'fullName email phone')
      .populate('sanctionedBy', 'fullName email')
      .populate('disbursedBy', 'fullName email')
      .sort({ createdAt: -1 });
  }

  async recordPayment(loanId: string, paymentAmount: number): Promise<ILoan | null> {
    const loan = await LoanModel.findById(loanId);
    if (!loan) return null;

    const cleanPayment = Math.round(Number(paymentAmount) * 100) / 100;
    const newTotalPaid = Math.round((loan.totalPaid + cleanPayment) * 100) / 100;
    let newBalance = Math.round((loan.totalRepayment - newTotalPaid) * 100) / 100;

    // Zero balance threshold: if remaining balance is within 5 paise (0.05), fully settle
    if (newBalance <= 0.05) {
      newBalance = 0;
    }

    loan.totalPaid = newTotalPaid;
    loan.balanceRemaining = newBalance;
    if (newBalance === 0) {
      loan.status = LoanStatus.CLOSED;
      loan.closedAt = new Date();
    }

    return loan.save();
  }

  async getDashboardMetrics() {
    const counts = await LoanModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$principalAmount' },
        },
      },
    ]);
    return counts;
  }
}
