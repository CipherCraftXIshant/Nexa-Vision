import { Router } from 'express';
import { getDevices, createDevice, updateDevice } from '../controllers/deviceController';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', getDevices);
router.post('/', checkRole(['SUPER_ADMIN', 'ADMIN']), createDevice);
router.put('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), updateDevice);

export default router;
