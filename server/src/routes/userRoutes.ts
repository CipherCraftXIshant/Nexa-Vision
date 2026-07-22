import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), updateUser);
router.delete('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), deleteUser);

export default router;
