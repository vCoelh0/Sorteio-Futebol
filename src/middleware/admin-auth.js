import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function requireAdmin(request, response, next) {
  const authorization = request.get('authorization') ?? '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const token = bearerToken || request.get('x-admin-token') || '';

  if (!token || !safeEqual(token, env.adminToken)) {
    return response.status(401).json({ message: 'Acesso administrativo não autorizado.' });
  }

  return next();
}
