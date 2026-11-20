import { Router } from 'express';
import { getRecognitionLogs, processCameraFrame, registerUserFace } from '../controllers/recognitionController';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/logs', checkRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), getRecognitionLogs);
router.post('/process-frame', checkRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), processCameraFrame);
router.post('/register-face', registerUserFace);

export default router;
