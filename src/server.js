import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { pool } from './config/database.js';
import { assertRuntimeEnv, env } from './config/env.js';
import { registerSocketHandlers } from './socket/index.js';

assertRuntimeEnv();

const app = createApp();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.clientOrigin,
    methods: ['GET', 'POST'],
  },
});

registerSocketHandlers(io);

httpServer.listen(env.port, () => {
  console.log(`Servidor disponível na porta ${env.port}.`);
});

let isShuttingDown = false;

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} recebido. Encerrando servidor...`);

  io.close();
  httpServer.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
