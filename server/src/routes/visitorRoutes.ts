import { Router } from 'express';
import { getVisitors, updateVisitor, convertVisitorToUser, deleteVisitor } from '../controllers/visitorController';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', getVisitors);
router.put('/:id', checkRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), updateVisitor);
router.post('/:id/convert', checkRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']), convertVisitorToUser);
router.delete('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), deleteVisitor);

export default router;
