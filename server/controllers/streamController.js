// /server/controllers/streamController.js
import jwt    from 'jsonwebtoken';
import bus    from '../events.js';

const HEARTBEAT_MS = 25_000;

/**
 * GET /api/stream
 *
 * Server-Sent Events endpoint. Auth via ?token=<jwt> because the browser's
 * EventSource API does not support custom request headers.
 *
 * Each connected client subscribes to the in-process event bus. On disconnect
 * the listener and heartbeat are cleaned up immediately.
 */
export const sseStream = (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx proxy buffering if present
  res.flushHeaders();

  // Let the client know the stream is open
  res.write(': connected\n\n');

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  bus.on('event', send);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, HEARTBEAT_MS);

  req.on('close', () => {
    bus.off('event', send);
    clearInterval(heartbeat);
  });
};
