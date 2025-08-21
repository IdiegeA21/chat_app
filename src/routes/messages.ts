import { Router } from 'express';
import { getRoomMessages, sendMessage } from '../controllers/messageController';
import { authenticateToken } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { sendMessageSchema } from '../utils/validation';

const router = Router();

router.use(authenticateToken);

router.get('/room/:roomId', getRoomMessages);
router.post('/', validateRequest(sendMessageSchema), sendMessage);

export default router;
