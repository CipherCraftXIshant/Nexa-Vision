import { Router } from 'express';
import { getRecognitionLogs, processCameraFrame, registerUserFace } from '../controllers/recognitionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/logs', getRecognitionLogs);
router.post('/process-frame', processCameraFrame);
router.post('/register-face', registerUserFace);

export default router;
