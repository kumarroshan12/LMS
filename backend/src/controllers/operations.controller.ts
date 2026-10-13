import { Response } from 'express';
import { OperationsService } from '../services/operations.service';
import { ApiResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { LoanService } from '../services/loan.service';

export class OperationsController {
  private opsService: OperationsService;
  private loanService: LoanService;

  constructor() {
    this.opsService = new OperationsService();
    this.loanService = new LoanService();
  }

  // ===================== SALES MODULE =====================
  public getSalesLeads = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const leads = await this.opsService.getSalesLeads();
      ApiResponse.success(res, 'Sales leads retrieved.', leads);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch sales leads.', 500);
    }
  };

  // ===================== SANCTION MODULE =====================
  public getSanctionQueue = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const queue = await this.opsService.getSanctionQueue();
      ApiResponse.success(res, 'Sanction queue retrieved.', queue);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch sanction queue.', 500);
    }
  };

  public getSalarySlip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const filePath = await this.loanService.getSalarySlipPath(
        req.params.id as string,
        req.user!.id,
        req.user!.role === 'admin'
      );
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(filePath, (error) => {
        if (error && !res.headersSent) ApiResponse.error(res, 'Salary slip file not found.', 404);
      });
    } catch (error: any) {
      const statusCode = error.message?.startsWith('Access forbidden') ? 403 : 404;
      ApiResponse.error(res, error.message || 'Failed to retrieve salary slip.', statusCode);
    }
  };

  public approveLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const executiveId = req.user!.id;
      const loan = await this.opsService.approveLoan(id, executiveId);
      ApiResponse.success(res, 'Loan successfully sanctioned / approved.', loan);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to approve loan.', 400);
    }
  };

  public rejectLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const executiveId = req.user!.id;

      if (!reason || !reason.trim()) {
        ApiResponse.error(res, 'Rejection reason is required.', 400);
        return;
      }

      const loan = await this.opsService.rejectLoan(id, reason, executiveId);
      ApiResponse.success(res, 'Loan successfully rejected.', loan);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to reject loan.', 400);
    }
  };

  // ===================== DISBURSEMENT MODULE =====================
  public getDisbursementQueue = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const queue = await this.opsService.getDisbursementQueue();
      ApiResponse.success(res, 'Disbursement queue retrieved.', queue);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch disbursement queue.', 500);
    }
  };

  public disburseLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { disbursementReference } = req.body;
      const executiveId = req.user!.id;

      const loan = await this.opsService.disburseLoan(id, executiveId, disbursementReference);
      ApiResponse.success(res, 'Funds marked as disbursed successfully.', loan);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to mark disbursement.', 400);
    }
  };

  // ===================== COLLECTION MODULE =====================
  public getCollectionQueue = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const queue = await this.opsService.getCollectionQueue();
      ApiResponse.success(res, 'Collection queue retrieved.', queue);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch collection queue.', 500);
    }
  };

  public recordRepayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { utrNumber, amount, paymentDate } = req.body;
      const executiveId = req.user!.id;

      if (!utrNumber || !amount) {
        ApiResponse.error(res, 'UTR Number and payment amount are required.', 400);
        return;
      }

      const result = await this.opsService.recordRepayment(
        id,
        utrNumber,
        Number(amount),
        paymentDate,
        executiveId
      );

      const msg = result.isClosed
        ? 'Repayment recorded. Loan total repayment reached - Loan marked as CLOSED!'
        : 'Repayment successfully recorded.';

      ApiResponse.success(res, msg, result);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to record repayment.', 400);
    }
  };

  public getLoanPayments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const payments = await this.opsService.getLoanRepayments(id);
      ApiResponse.success(res, 'Repayment history fetched.', payments);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch payments.', 500);
    }
  };

  // ===================== ADMIN OVERVIEW =====================
  public getAdminSummary = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const summary = await this.opsService.getAdminSummary();
      ApiResponse.success(res, 'Admin summary metrics retrieved.', summary);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch admin metrics.', 500);
    }
  };
}
