import { Router } from 'express';

export function createDrawRouter(drawCoordinator) {
  const router = Router();

  router.get('/', async (_request, response, next) => {
    try {
      response.json(await drawCoordinator.getState());
    } catch (error) {
      next(error);
    }
  });

  return router;
}
