import { Router } from 'express';
import { env } from '../config/env.js';
import { requireAdmin } from '../middleware/admin-auth.js';
import { secureCompare } from '../services/admin-auth.js';
import { DrawConflictError, ParticipantCountError } from '../services/draw-state.js';
import { CaptainCountError } from '../services/team-draw.js';

export function createAdminRouter(drawCoordinator) {
  const router = Router();

  router.post('/login', (request, response) => {
    const password = request.body?.password;

    if (typeof password !== 'string' || password.length === 0) {
      return response.status(400).json({ message: 'Informe a senha do administrador.' });
    }
    if (!secureCompare(password, env.adminPassword)) {
      return response.status(401).json({ message: 'Senha incorreta.' });
    }

    return response.json({ token: env.adminToken });
  });

  router.use(requireAdmin);

  router.get('/session', (_request, response) => {
    response.json({ authenticated: true });
  });

  router.post('/draw', async (_request, response, next) => {
    try {
      response.status(202).json(await drawCoordinator.start());
    } catch (error) {
      if (error instanceof DrawConflictError) {
        return response.status(409).json({ message: error.message });
      }
      if (error instanceof ParticipantCountError || error instanceof CaptainCountError) {
        return response.status(422).json({ message: error.message });
      }
      return next(error);
    }
  });

  router.post('/reset', async (_request, response, next) => {
    try {
      response.json(await drawCoordinator.reset());
    } catch (error) {
      next(error);
    }
  });

  return router;
}
