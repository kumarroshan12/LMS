import { LoanRepository } from '../repositories/loan.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { BreService, BreInput } from './bre.service';
import { calculateLoanTerms } from '../utils/math';
import { LoanStatus } from '../constants/loanStatus';
import { ILoan } from '../models/Loan';

export interface CreateLoanApplicationInput extends BreInput {
  borrowerId: string;
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  principalAmount: number;
  tenureDays: number;
}

export class LoanService {
  private loanRepo: LoanRepository;
  private paymentRepo: PaymentRepository;
  private breService: BreService;

  constructor() {
    this.loanRepo = new LoanRepository();
    this.paymentRepo = new PaymentRepository();
    this.breService = new BreService();
  }

  /**
   * Run BRE check for borrower pre-flight
   */
  public checkEligibility(input: BreInput) {
    return this.breService.evaluateEligibility(input);
  }

  /**
   * Applies for a loan:
   * 1. Runs BRE check on server. Rejects if invalid.
   * 2. Calculates SI: (P * R * T) / (365 * 100)
   * 3. Sets status to APPLIED
   */
  public async submitLoanApplication(input: CreateLoanApplicationInput): Promise<ILoan> {
    // 1. Strict Server-Side BRE Evaluation
    const breResult = this.breService.evaluateEligibility({
      fullName: input.fullName,
      pan: input.pan,
      dateOfBirth: input.dateOfBirth,
      monthlySalary: input.monthlySalary,
      employmentMode: input.employmentMode,
    });

    if (!breResult.isEligible) {
      throw new Error(`BRE Verification Failed: ${breResult.errors.join(' | ')}`);
    }

    // Validate loan amount and tenure range
    if (input.principalAmount < 50000 || input.principalAmount > 500000) {
      throw new Error('Principal loan amount must be between ₹50,000 and ₹5,00,000.');
    }
    if (input.tenureDays < 30 || input.tenureDays > 365) {
      throw new Error('Tenure must be between 30 and 365 days.');
    }

    // 2. Loan Mathematics (Fixed at 12% p.a.)
    const { interestAmount, totalRepayment, interestRate } = calculateLoanTerms(
      input.principalAmount,
      input.tenureDays,
      12
    );

    // 3. Create Loan in Repository
    const loan = await this.loanRepo.create({
      borrowerId: input.borrowerId as any,
      fullName: input.fullName.trim(),
      pan: input.pan.trim().toUpperCase(),
      dateOfBirth: new Date(input.dateOfBirth),
      monthlySalary: input.monthlySalary,
      employmentMode: input.employmentMode,
      salarySlipUrl: input.salarySlipUrl || '',
      salarySlipOriginalName: input.salarySlipOriginalName || '',
      principalAmount: input.principalAmount,
      tenureDays: input.tenureDays,
      interestRate,
      interestAmount,
      totalRepayment,
      totalPaid: 0,
      balanceRemaining: totalRepayment,
      status: LoanStatus.APPLIED,
    });

    return loan;
  }

  public async getBorrowerLoans(borrowerId: string): Promise<ILoan[]> {
    return this.loanRepo.findByBorrowerId(borrowerId);
  }

  public async getLatestBorrowerLoan(borrowerId: string): Promise<ILoan | null> {
    return this.loanRepo.findLatestByBorrowerId(borrowerId);
  }

  public async getLoanDetailsWithPayments(loanId: string) {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) {
      throw new Error('Loan record not found.');
    }
    const payments = await this.paymentRepo.findByLoanId(loanId);
    return { loan, payments };
  }
}
