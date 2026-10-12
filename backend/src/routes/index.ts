import { Router } from 'express';
import authRoutes from './auth.routes';
import borrowerRoutes from './borrower.routes';
import operationsRoutes from './operations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/borrower', borrowerRoutes);
router.use('/operations', operationsRoutes);

export default router;
