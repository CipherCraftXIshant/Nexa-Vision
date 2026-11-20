import { Router } from 'express';
import { getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkRole } from '../middleware/rbac';

const router = Router();

router.use(authenticateToken);

router.get('/', checkRole(['SUPER_ADMIN', 'ADMIN']), getUsers);
router.get('/:id', (request, res, next) => {
  const req = request as AuthRequest;
  if (req.user?.id === req.params.id || req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') return next();
  return res.status(403).json({ success: false, message: 'You may only view your own profile.' });
}, getUserById);
router.put('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), updateUser);
router.delete('/:id', checkRole(['SUPER_ADMIN', 'ADMIN']), deleteUser);

export default router;
