import { Router } from 'express';
import { BorrowerController } from '../controllers/borrower.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { salarySlipUpload } from '../middlewares/upload.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const borrowerController = new BorrowerController();

// The borrower portal is reserved for borrower accounts. Admin access is
// provided through the operations routes and admin dashboard.
router.use(authenticateJwt);
router.use(authorizeRoles(UserRole.BORROWER));

router.post('/eligibility', borrowerController.checkEligibility);
router.post(
  '/upload-salary-slip',
  salarySlipUpload.single('salarySlip'),
  borrowerController.uploadSalarySlip
);
router.post('/apply', borrowerController.submitApplication);
router.get('/profile', borrowerController.getMyProfile);
router.get('/my-loans', borrowerController.getMyLoans);
router.get('/latest-loan', borrowerController.getLatestLoan);
router.get('/loans/:id', borrowerController.getLoanById);
router.get('/loans/:id/salary-slip', borrowerController.getSalarySlip);

export default router;
