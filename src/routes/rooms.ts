import { Router } from 'express';
import {
  createRoom,
  joinRoom,
  getUserRooms,
  getRoomMembers,
  leaveRoom
} from '../controllers/roomController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { createRoomSchema, joinRoomSchema } from '../utils/validation';

const router = Router();

router.use(authenticateToken);

router.post('/', validateRequest(createRoomSchema), createRoom);
router.post('/join', validateRequest(joinRoomSchema), joinRoom);
router.get('/', getUserRooms);
router.get('/:roomId/members', getRoomMembers);
router.delete('/:roomId/leave', leaveRoom);

export default router;
