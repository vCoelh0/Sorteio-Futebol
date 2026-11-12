import { env } from '../config/env.js';
import { secureCompare } from '../services/admin-auth.js';

export function requireAdmin(request, response, next) {
  const authorization = request.get('authorization') ?? '';
  const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const token = bearerToken || request.get('x-admin-token') || '';

  if (!token || !secureCompare(token, env.adminToken)) {
    return response.status(401).json({ message: 'Acesso administrativo não autorizado.' });
  }

  return next();
}
