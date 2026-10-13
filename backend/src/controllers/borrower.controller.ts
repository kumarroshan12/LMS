import { Response } from 'express';
import { LoanService } from '../services/loan.service';
import { ApiResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class BorrowerController {
  private loanService: LoanService;

  constructor() {
    this.loanService = new LoanService();
  }

  /**
   * Pre-flight BRE check (Personal details step)
   */
  public checkEligibility = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;

      if (!fullName || !pan || !dateOfBirth || monthlySalary === undefined || !employmentMode) {
        ApiResponse.error(res, 'All personal details and employment fields are required.', 400);
        return;
      }

      if (!req.user) {
        ApiResponse.error(res, 'Unauthorized.', 401);
        return;
      }

      const result = await this.loanService.checkBorrowerEligibility(req.user.id, {
        fullName,
        pan,
        dateOfBirth,
        monthlySalary: Number(monthlySalary),
        employmentMode,
      });

      if (!result.isEligible) {
        ApiResponse.error(res, 'Application rejected by Business Rule Engine (BRE).', 422, result.errors);
        return;
      }

      ApiResponse.success(res, 'BRE verification passed successfully. You are eligible to apply.', result);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Error processing eligibility check.', 500);
    }
  };

  /**
   * Upload Salary Slip file (PDF/JPG/PNG max 5MB)
   */
  public uploadSalarySlip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        ApiResponse.error(res, 'No file uploaded. Please provide a PDF, JPG, or PNG salary slip.', 400);
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      ApiResponse.success(res, 'Salary slip uploaded successfully.', {
        fileUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'File upload failed.', 500);
    }
  };

  /**
   * Complete loan submission
   */
  public submitApplication = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Unauthorized.', 401);
        return;
      }

      const {
        fullName,
        pan,
        dateOfBirth,
        monthlySalary,
        employmentMode,
        salarySlipUrl,
        salarySlipOriginalName,
        principalAmount,
        tenureDays,
      } = req.body;

      if (
        !fullName ||
        !pan ||
        !dateOfBirth ||
        !monthlySalary ||
        !employmentMode ||
        !principalAmount ||
        !tenureDays
      ) {
        ApiResponse.error(res, 'Missing required fields in loan application.', 400);
        return;
      }

      const newLoan = await this.loanService.submitLoanApplication({
        borrowerId: req.user.id,
        fullName,
        pan,
        dateOfBirth,
        monthlySalary: Number(monthlySalary),
        employmentMode,
        salarySlipUrl,
        salarySlipOriginalName,
        principalAmount: Number(principalAmount),
        tenureDays: Number(tenureDays),
      });

      ApiResponse.success(res, 'Loan application submitted successfully.', newLoan, 201);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to submit loan application.', 400);
    }
  };

  /**
   * Get all loans for current borrower
   */
  public getMyLoans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Unauthorized.', 401);
        return;
      }
      const loans = await this.loanService.getBorrowerLoans(req.user.id);
      ApiResponse.success(res, 'Borrower loans fetched.', loans);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch loans.', 500);
    }
  };

  /** Get reusable personal and employment details for the signed-in borrower. */
  public getMyProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Unauthorized.', 401);
        return;
      }
      const profile = await this.loanService.getBorrowerProfile(req.user.id);
      ApiResponse.success(res, 'Borrower profile fetched.', profile);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch borrower profile.', 500);
    }
  };

  /**
   * Get latest loan for current borrower
   */
  public getLatestLoan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Unauthorized.', 401);
        return;
      }
      const loan = await this.loanService.getLatestBorrowerLoan(req.user.id);
      if (!loan) {
        ApiResponse.success(res, 'No loan application found for borrower.', null);
        return;
      }
      const details = await this.loanService.getLoanDetailsWithPayments(loan._id.toString());
      ApiResponse.success(res, 'Latest loan retrieved.', details);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch loan details.', 500);
    }
  };

  /**
   * Get specific loan by ID with its payments
   */
  public getLoanById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Unauthorized.', 401);
        return;
      }
      const id = req.params.id as string;
      const details = await this.loanService.getLoanDetailsWithPayments(id);

      const loanOwnerId = (details.loan.borrowerId as any)?._id?.toString() || details.loan.borrowerId?.toString();
      if (req.user.role === 'borrower' && loanOwnerId !== req.user.id) {
        ApiResponse.error(res, 'Access forbidden. You can only view your own loan applications.', 403);
        return;
      }

      ApiResponse.success(res, 'Loan details retrieved.', details);
    } catch (error: any) {
      ApiResponse.error(res, error.message || 'Failed to fetch loan details.', 404);
    }
  };

  public getSalarySlip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Unauthorized.', 401);
        return;
      }
      const filePath = await this.loanService.getSalarySlipPath(
        req.params.id as string,
        req.user.id,
        req.user.role === 'admin'
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
}
