import { LoanModel, ILoan } from '../models/Loan';
import { LoanStatus } from '../constants/loanStatus';

export class LoanRepository {
  async hasActiveApplication(borrowerId: string): Promise<boolean> {
    return LoanModel.exists({
      borrowerId,
      status: { $in: [LoanStatus.APPLIED, LoanStatus.SANCTIONED, LoanStatus.DISBURSED] },
    }).then(Boolean);
  }

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

  async transitionByStatus(
    id: string,
    expectedStatus: LoanStatus,
    updateData: Partial<ILoan>
  ): Promise<ILoan | null> {
    return LoanModel.findOneAndUpdate(
      { _id: id, status: expectedStatus },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async findByStatus(status: LoanStatus | LoanStatus[]): Promise<ILoan[]> {
    const filter = Array.isArray(status) ? { status: { $in: status } } : { status };
    return LoanModel.find(filter)
      .populate('borrowerId', 'fullName email phone')
      .populate('sanctionedBy', 'fullName email')
      .populate('disbursedBy', 'fullName email')
      .sort({ createdAt: -1 });
  }

  async recordPayment(
    loanId: string,
    paymentAmount: number,
    expectedBalance: number
  ): Promise<ILoan | null> {
    const cleanPayment = Math.round(Number(paymentAmount) * 100) / 100;
    const expectedLoan = await LoanModel.findOne({ _id: loanId, status: LoanStatus.DISBURSED, balanceRemaining: expectedBalance }).select('totalPaid totalRepayment');
    if (!expectedLoan) return null;

    const totalPaid = Math.round((expectedLoan.totalPaid + cleanPayment) * 100) / 100;
    let newBalance = Math.round((expectedLoan.totalRepayment - totalPaid) * 100) / 100;

    const updateData: Partial<ILoan> = {
      totalPaid,
      balanceRemaining: newBalance,
    };
    if (newBalance === 0) {
      updateData.status = LoanStatus.CLOSED;
      updateData.closedAt = new Date();
    }

    return LoanModel.findOneAndUpdate(
      { _id: loanId, status: LoanStatus.DISBURSED, balanceRemaining: expectedBalance },
      updateData,
      { new: true, runValidators: true }
    );
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
