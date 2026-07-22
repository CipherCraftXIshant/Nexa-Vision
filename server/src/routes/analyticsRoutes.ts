import { Router } from 'express';
import { getDashboardStats } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/dashboard', getDashboardStats);

export default router;
