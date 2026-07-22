import { Router } from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);
router.use(checkRole(['SUPER_ADMIN', 'ADMIN']));

router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

export default router;
