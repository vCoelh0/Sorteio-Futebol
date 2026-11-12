import express from 'express';
import { healthRouter } from './routes/health.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  app.get('/api', (_request, response) => {
    response.json({ name: 'Sorteio Futebol API', version: '0.1.0' });
  });
  app.use('/api/health', healthRouter);

  app.use((_request, response) => {
    response.status(404).json({ message: 'Rota não encontrada.' });
  });

  app.use((error, _request, response, _next) => {
    console.error('Erro não tratado:', error);
    response.status(500).json({ message: 'Erro interno do servidor.' });
  });

  return app;
}
