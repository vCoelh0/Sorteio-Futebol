import express from 'express';
import { fileURLToPath } from 'node:url';
import { createAdminRouter } from './routes/admin.js';
import { createDrawRouter } from './routes/draw.js';
import { healthRouter } from './routes/health.js';

export function configureApp(app, drawCoordinator) {
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));
  app.use(express.static(fileURLToPath(new URL('../public/', import.meta.url))));

  app.get('/api', (_request, response) => {
    response.json({ name: 'Sorteio Futebol API', version: '0.2.0' });
  });
  app.use('/api/health', healthRouter);
  app.use('/api/draw', createDrawRouter(drawCoordinator));
  app.use('/api/admin', createAdminRouter(drawCoordinator));

  app.use((_request, response) => {
    response.status(404).json({ message: 'Rota não encontrada.' });
  });

  app.use((error, _request, response, _next) => {
    console.error('Erro não tratado:', error);
    response.status(500).json({ message: 'Erro interno do servidor.' });
  });

  return app;
}
