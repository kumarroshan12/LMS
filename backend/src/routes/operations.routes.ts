import { Router } from 'express';
import { OperationsController } from '../controllers/operations.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/rbac.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const ops = new OperationsController();

// Global requirement: authenticated token
router.use(authenticateJwt);

// 1. Sales Module routes
router.get('/sales/leads', authorizeRoles(UserRole.SALES, UserRole.ADMIN), ops.getSalesLeads);

// 2. Sanction Module routes
router.get('/sanction/queue', authorizeRoles(UserRole.SANCTION, UserRole.ADMIN), ops.getSanctionQueue);
router.post(
  '/sanction/:id/approve',
  authorizeRoles(UserRole.SANCTION, UserRole.ADMIN),
  ops.approveLoan
);
router.post(
  '/sanction/:id/reject',
  authorizeRoles(UserRole.SANCTION, UserRole.ADMIN),
  ops.rejectLoan
);

// 3. Disbursement Module routes
router.get(
  '/disbursement/queue',
  authorizeRoles(UserRole.DISBURSEMENT, UserRole.ADMIN),
  ops.getDisbursementQueue
);
router.post(
  '/disbursement/:id/disburse',
  authorizeRoles(UserRole.DISBURSEMENT, UserRole.ADMIN),
  ops.disburseLoan
);

// 4. Collection Module routes
router.get(
  '/collection/queue',
  authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN),
  ops.getCollectionQueue
);
router.post(
  '/collection/:id/repay',
  authorizeRoles(UserRole.COLLECTION, UserRole.ADMIN),
  ops.recordRepayment
);
router.get(
  '/collection/:id/payments',
  authorizeRoles(UserRole.COLLECTION, UserRole.SANCTION, UserRole.ADMIN),
  ops.getLoanPayments
);

// 5. Admin Overview route
router.get('/admin/summary', authorizeRoles(UserRole.ADMIN), ops.getAdminSummary);

export default router;
