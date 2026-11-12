import { Router } from 'express';
import { requireAdmin } from '../middleware/admin-auth.js';
import { DrawConflictError, ParticipantCountError } from '../services/draw-state.js';

export function createAdminRouter(drawCoordinator) {
  const router = Router();
  router.use(requireAdmin);

  router.post('/draw', async (_request, response, next) => {
    try {
      response.status(202).json(await drawCoordinator.start());
    } catch (error) {
      if (error instanceof DrawConflictError) {
        return response.status(409).json({ message: error.message });
      }
      if (error instanceof ParticipantCountError) {
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
