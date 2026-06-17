// /server/routes/messages.js
import { Router } from 'express';
import { getRecent } from '../controllers/messageController.js';
import authenticate from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/recent', getRecent);
export default router;
