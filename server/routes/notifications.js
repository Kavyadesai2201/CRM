// /server/routes/notifications.js
import { Router } from 'express';
import authenticate from '../middleware/auth.js';
import { getNotifications, markAllRead } from '../controllers/notificationsController.js';

const router = Router();

router.get('/',        authenticate, getNotifications);
router.patch('/read',  authenticate, markAllRead);

export default router;
