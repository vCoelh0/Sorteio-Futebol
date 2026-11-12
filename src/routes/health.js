import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({ status: 'ok', service: 'sorteio-futebol' });
});
healthRouter.get('/database', async (_request, response) => {
  try {
    const currentTime = await checkDatabaseConnection();
    response.json({ status: 'ok', databaseTime: currentTime });
  } catch (error) {
    console.error('Falha no health check do banco:', error);
    response.status(503).json({ status: 'error', message: 'Banco indisponível' });
  }
});

