// /server/routes/stream.js
import { Router }    from 'express';
import { sseStream } from '../controllers/streamController.js';

const router = Router();
router.get('/', sseStream);
export default router;
