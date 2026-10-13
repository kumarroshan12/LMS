import { LoanRepository } from '../repositories/loan.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { UserRepository } from '../repositories/user.repository';
import { LoanStatus } from '../constants/loanStatus';
import { ILoan } from '../models/Loan';

export class OperationsService {
  private loanRepo: LoanRepository;
  private paymentRepo: PaymentRepository;
  private userRepo: UserRepository;

  constructor() {
    this.loanRepo = new LoanRepository();
    this.paymentRepo = new PaymentRepository();
    this.userRepo = new UserRepository();
  }

  // ===================== SALES MODULE =====================
  public async getSalesLeads() {
    return this.userRepo.findLeads();
  }

  // ===================== SANCTION MODULE =====================
  public async getSanctionQueue(): Promise<ILoan[]> {
    return this.loanRepo.findByStatus(LoanStatus.APPLIED);
  }

  public async approveLoan(loanId: string, sanctionExecutiveId: string): Promise<ILoan> {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) throw new Error('Loan not found.');
    if (loan.status !== LoanStatus.APPLIED) {
      throw new Error(`Cannot approve loan in '${loan.status}' status. Only APPLIED loans can be approved.`);
    }

    const updated = await this.loanRepo.transitionByStatus(loanId, LoanStatus.APPLIED, {
      status: LoanStatus.SANCTIONED,
      sanctionedBy: sanctionExecutiveId as any,
      sanctionedAt: new Date(),
    });

    if (!updated) throw new Error('Failed to update loan.');
    return updated;
  }

  public async rejectLoan(loanId: string, reason: string, sanctionExecutiveId: string): Promise<ILoan> {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) throw new Error('Loan not found.');
    if (loan.status !== LoanStatus.APPLIED) {
      throw new Error(`Cannot reject loan in '${loan.status}' status. Only APPLIED loans can be rejected.`);
    }
    if (!reason || !reason.trim()) {
      throw new Error('A valid rejection reason must be provided.');
    }

    const updated = await this.loanRepo.transitionByStatus(loanId, LoanStatus.APPLIED, {
      status: LoanStatus.REJECTED,
      rejectionReason: reason.trim(),
      sanctionedBy: sanctionExecutiveId as any,
      sanctionedAt: new Date(),
    });

    if (!updated) throw new Error('Failed to update loan.');
    return updated;
  }

  // ===================== DISBURSEMENT MODULE =====================
  public async getDisbursementQueue(): Promise<ILoan[]> {
    return this.loanRepo.findByStatus(LoanStatus.SANCTIONED);
  }

  public async disburseLoan(
    loanId: string,
    disbursementExecutiveId: string,
    disbursementReference?: string
  ): Promise<ILoan> {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) throw new Error('Loan not found.');
    if (loan.status !== LoanStatus.SANCTIONED) {
      throw new Error(`Cannot disburse loan with status '${loan.status}'. Only SANCTIONED loans can be disbursed.`);
    }

    const ref = disbursementReference || `DISB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated = await this.loanRepo.transitionByStatus(loanId, LoanStatus.SANCTIONED, {
      status: LoanStatus.DISBURSED,
      disbursedBy: disbursementExecutiveId as any,
      disbursedAt: new Date(),
      disbursementReference: ref,
    });

    if (!updated) throw new Error('Failed to update loan.');
    return updated;
  }

  // ===================== COLLECTION MODULE =====================
  public async getCollectionQueue(): Promise<ILoan[]> {
    // Shows all disbursed and recently closed loans for collection ledger tracking
    return this.loanRepo.findByStatus([LoanStatus.DISBURSED, LoanStatus.CLOSED]);
  }

  public async recordRepayment(
    loanId: string,
    utrNumber: string,
    amount: number,
    paymentDate: Date | string,
    collectionExecutiveId: string
  ) {
    const cleanUtr = utrNumber?.trim().toUpperCase();
    if (!cleanUtr) throw new Error('UTR Number is required.');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Payment amount must be a valid number greater than 0.');

    // Enforce global UTR uniqueness
    const existingUtr = await this.paymentRepo.findByUtr(cleanUtr);
    if (existingUtr) {
      throw new Error(`Duplicate UTR Number: Transaction with UTR '${cleanUtr}' has already been recorded.`);
    }

    const loan = await this.loanRepo.findById(loanId);
    if (!loan) throw new Error('Loan not found.');

    if (loan.status !== LoanStatus.DISBURSED) {
      throw new Error(`Repayments can only be recorded for active DISBURSED loans (Current status: ${loan.status}).`);
    }

    const cleanAmount = Math.round(Number(amount) * 100) / 100;
    const currentBalance = Math.round(loan.balanceRemaining * 100) / 100;
    if (cleanAmount <= 0) throw new Error('Payment amount must be at least ₹0.01.');

    if (cleanAmount > currentBalance) {
      throw new Error(
        `Payment amount (₹${cleanAmount.toFixed(2)}) exceeds the outstanding balance (₹${currentBalance.toFixed(2)}).`
      );
    }

    const finalPaymentAmount = cleanAmount;

    const parsedPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    if (Number.isNaN(parsedPaymentDate.getTime())) throw new Error('Payment date is invalid.');

    // 1. Create Payment record
    let payment;
    try {
      payment = await this.paymentRepo.create({
        loanId: loan._id as any,
        utrNumber: cleanUtr,
        amount: finalPaymentAmount,
        paymentDate: parsedPaymentDate,
        collectedBy: collectionExecutiveId as any,
      });
    } catch (error: any) {
      if (error?.code === 11000) throw new Error(`Duplicate UTR Number: Transaction with UTR '${cleanUtr}' has already been recorded.`);
      throw error;
    }

    // 2. Update Loan ledger (totalPaid, balanceRemaining, auto-close if balanced)
    let updatedLoan;
    try {
      updatedLoan = await this.loanRepo.recordPayment(loanId, finalPaymentAmount, currentBalance);
      if (!updatedLoan) throw new Error('Loan balance changed during this payment. Refresh the loan and retry.');
    } catch (error) {
      await this.paymentRepo.deleteById(payment._id.toString());
      throw error;
    }

    return {
      payment,
      loan: updatedLoan,
      isClosed: updatedLoan?.status === LoanStatus.CLOSED,
    };
  }

  public async getLoanRepayments(loanId: string) {
    return this.paymentRepo.findByLoanId(loanId);
  }

  // ===================== ADMIN OVERVIEW =====================
  public async getAdminSummary() {
    const [leads, sanctionQueue, disbursementQueue, collectionQueue, allMetrics, totalCollected] =
      await Promise.all([
        this.userRepo.findLeads(),
        this.loanRepo.findByStatus(LoanStatus.APPLIED),
        this.loanRepo.findByStatus(LoanStatus.SANCTIONED),
        this.loanRepo.findByStatus(LoanStatus.DISBURSED),
        this.loanRepo.getDashboardMetrics(),
        this.paymentRepo.getTotalPaymentsSum(),
      ]);

    return {
      leadsCount: leads.length,
      appliedCount: sanctionQueue.length,
      sanctionedCount: disbursementQueue.length,
      disbursedCount: collectionQueue.length,
      totalCollected,
      statusBreakdown: allMetrics,
    };
  }
}
