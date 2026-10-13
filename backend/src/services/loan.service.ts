import { LoanRepository } from '../repositories/loan.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { BreService, BreInput } from './bre.service';
import { calculateLoanTerms } from '../utils/math';
import { LoanStatus } from '../constants/loanStatus';
import { ILoan } from '../models/Loan';
import { UserRepository } from '../repositories/user.repository';
import path from 'path';
import { ENV } from '../config/env';

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
  private userRepo: UserRepository;

  constructor() {
    this.loanRepo = new LoanRepository();
    this.paymentRepo = new PaymentRepository();
    this.breService = new BreService();
    this.userRepo = new UserRepository();
  }

  /**
   * Run BRE check for borrower pre-flight
   */
  public checkEligibility(input: BreInput) {
    return this.breService.evaluateEligibility(input);
  }

  public async checkBorrowerEligibility(borrowerId: string, input: BreInput) {
    const user = await this.userRepo.findById(borrowerId);
    if (!user) throw new Error('Borrower account not found.');

    const savedProfile = user.customerProfile;
    if (savedProfile?.eligibility?.isEligible && savedProfile.pan && savedProfile.dateOfBirth) {
      return this.breService.evaluateEligibility({
        fullName: savedProfile.fullName || user.fullName,
        pan: savedProfile.pan,
        dateOfBirth: savedProfile.dateOfBirth,
        monthlySalary: savedProfile.monthlySalary || 0,
        employmentMode: savedProfile.employmentMode || 'Unemployed',
      });
    }

    const result = this.breService.evaluateEligibility(input);
    await this.userRepo.updateCustomerProfile(borrowerId, {
      fullName: input.fullName.trim(),
      pan: input.pan.trim().toUpperCase(),
      dateOfBirth: new Date(input.dateOfBirth),
      monthlySalary: input.monthlySalary,
      employmentMode: input.employmentMode,
      eligibility: { isEligible: result.isEligible, checkedAt: new Date() },
    });
    return result;
  }

  /**
   * Applies for a loan:
   * 1. Runs BRE check on server. Rejects if invalid.
   * 2. Calculates SI: (P * R * T) / (365 * 100)
   * 3. Sets status to APPLIED
   */
  public async submitLoanApplication(input: CreateLoanApplicationInput): Promise<ILoan> {
    if (await this.loanRepo.hasActiveApplication(input.borrowerId)) {
      throw new Error('You already have an active loan application. Please wait until it is closed or rejected before applying again.');
    }

    const borrower = await this.userRepo.findById(input.borrowerId);
    const savedProfile = borrower?.customerProfile;
    const applicationInput: CreateLoanApplicationInput = savedProfile?.eligibility?.isEligible
      ? {
          ...input,
          fullName: savedProfile.fullName || input.fullName,
          pan: savedProfile.pan || input.pan,
          dateOfBirth: savedProfile.dateOfBirth || input.dateOfBirth,
          monthlySalary: savedProfile.monthlySalary ?? input.monthlySalary,
          employmentMode: savedProfile.employmentMode || input.employmentMode,
        }
      : input;

    if (applicationInput.salarySlipUrl) {
      const filename = path.basename(applicationInput.salarySlipUrl);
      const allowedUpload = new RegExp(`^salary-slip-${applicationInput.borrowerId}-\\d+-\\d+\\.(pdf|jpg|jpeg|png)$`);
      if (applicationInput.salarySlipUrl !== `/uploads/${filename}` || !allowedUpload.test(filename)) {
        throw new Error('The salary slip must be uploaded from this borrower account.');
      }
    }

    // 1. Strict Server-Side BRE Evaluation
    const breResult = this.breService.evaluateEligibility({
      fullName: applicationInput.fullName,
      pan: applicationInput.pan,
      dateOfBirth: applicationInput.dateOfBirth,
      monthlySalary: applicationInput.monthlySalary,
      employmentMode: applicationInput.employmentMode,
    });

    if (!breResult.isEligible) {
      throw new Error(`BRE Verification Failed: ${breResult.errors.join(' | ')}`);
    }

    // Validate loan amount and tenure range
    if (applicationInput.principalAmount < 50000 || applicationInput.principalAmount > 500000) {
      throw new Error('Principal loan amount must be between ₹50,000 and ₹5,00,000.');
    }
    if (applicationInput.tenureDays < 30 || applicationInput.tenureDays > 365) {
      throw new Error('Tenure must be between 30 and 365 days.');
    }

    // 2. Loan Mathematics (Fixed at 12% p.a.)
    const { interestAmount, totalRepayment, interestRate } = calculateLoanTerms(
      applicationInput.principalAmount,
      applicationInput.tenureDays,
      12
    );

    // 3. Create Loan in Repository
    let loan: ILoan;
    try {
      loan = await this.loanRepo.create({
        borrowerId: applicationInput.borrowerId as any,
        fullName: applicationInput.fullName.trim(),
        pan: applicationInput.pan.trim().toUpperCase(),
        dateOfBirth: new Date(applicationInput.dateOfBirth),
        monthlySalary: applicationInput.monthlySalary,
        employmentMode: applicationInput.employmentMode,
        salarySlipUrl: applicationInput.salarySlipUrl || '',
        salarySlipOriginalName: applicationInput.salarySlipOriginalName || '',
        principalAmount: applicationInput.principalAmount,
        tenureDays: applicationInput.tenureDays,
        interestRate,
        interestAmount,
        totalRepayment,
        totalPaid: 0,
        balanceRemaining: totalRepayment,
        status: LoanStatus.APPLIED,
      });
    } catch (error: any) {
      // The unique partial index closes the race between concurrent submissions.
      if (error?.code === 11000) {
        throw new Error('You already have an active loan application. Please wait until it is closed or rejected before applying again.');
      }
      throw error;
    }

    // Keep reusable customer details on the borrower account. The loan retains
    // its own immutable snapshot for historical application records.
    await this.userRepo.updateCustomerProfile(applicationInput.borrowerId, {
      fullName: applicationInput.fullName.trim(),
      pan: applicationInput.pan.trim().toUpperCase(),
      dateOfBirth: new Date(applicationInput.dateOfBirth),
      monthlySalary: applicationInput.monthlySalary,
      employmentMode: applicationInput.employmentMode,
      eligibility: { isEligible: true, checkedAt: savedProfile?.eligibility?.checkedAt || new Date() },
    });

    return loan;
  }

  public async getBorrowerProfile(borrowerId: string) {
    const user = await this.userRepo.findById(borrowerId);
    if (!user) throw new Error('Borrower account not found.');
    if (user.customerProfile?.pan) {
      if (!user.customerProfile.eligibility && user.customerProfile.dateOfBirth) {
        const result = this.breService.evaluateEligibility({
          fullName: user.customerProfile.fullName || user.fullName,
          pan: user.customerProfile.pan,
          dateOfBirth: user.customerProfile.dateOfBirth,
          monthlySalary: user.customerProfile.monthlySalary || 0,
          employmentMode: user.customerProfile.employmentMode || 'Unemployed',
        });
        const migratedProfile = {
          ...user.customerProfile,
          eligibility: { isEligible: result.isEligible, checkedAt: new Date() },
        };
        await this.userRepo.updateCustomerProfile(borrowerId, migratedProfile);
        return migratedProfile;
      }
      return user.customerProfile;
    }

    // Backfill reusable profile data for accounts created before this profile existed.
    const latestLoan = await this.loanRepo.findLatestByBorrowerId(borrowerId);
    if (!latestLoan) return user.customerProfile || null;
    const profile = {
      fullName: latestLoan.fullName,
      pan: latestLoan.pan,
      dateOfBirth: latestLoan.dateOfBirth,
      monthlySalary: latestLoan.monthlySalary,
      employmentMode: latestLoan.employmentMode,
      eligibility: {
        isEligible: this.breService.evaluateEligibility({
          fullName: latestLoan.fullName,
          pan: latestLoan.pan,
          dateOfBirth: latestLoan.dateOfBirth,
          monthlySalary: latestLoan.monthlySalary,
          employmentMode: latestLoan.employmentMode,
        }).isEligible,
        checkedAt: new Date(),
      },
    };
    await this.userRepo.updateCustomerProfile(borrowerId, profile);
    return profile;
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

  public async getSalarySlipPath(loanId: string, borrowerId: string, isAdmin: boolean): Promise<string> {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) throw new Error('Loan record not found.');
    const ownerId = (loan.borrowerId as any)?._id?.toString() || loan.borrowerId?.toString();
    if (!isAdmin && ownerId !== borrowerId) {
      throw new Error('Access forbidden. You can only view documents for your own loans.');
    }
    if (!loan.salarySlipUrl) throw new Error('No salary slip is attached to this loan.');

    const filename = path.basename(loan.salarySlipUrl);
    const ownerUpload = new RegExp(`^salary-slip-${ownerId}-\\d+-\\d+\\.(pdf|jpg|jpeg|png)$`);
    const isSeedSample = filename === 'sample-salary-slip.pdf';
    if (
      !filename ||
      filename !== loan.salarySlipUrl.split('/').pop() ||
      (!isAdmin && !ownerUpload.test(filename) && !isSeedSample)
    ) {
      throw new Error('Invalid salary slip reference.');
    }
    const uploadDirectory = path.resolve(process.cwd(), ENV.UPLOAD_DIR);
    const filePath = path.resolve(uploadDirectory, filename);
    if (!filePath.startsWith(`${uploadDirectory}${path.sep}`)) {
      throw new Error('Invalid salary slip reference.');
    }
    return filePath;
  }
}
