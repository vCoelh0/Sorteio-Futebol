import 'dotenv/config';

function parsePort(value) {
  const port = Number.parseInt(value ?? '3000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT deve ser um número entre 1 e 65535.');
  }
  return port;
}
const nodeEnv = process.env.NODE_ENV ?? 'development';

export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  adminToken: process.env.ADMIN_TOKEN ?? '',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
});

function assertRequired(keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(', ')}`);
  }
}

export function assertDatabaseEnv() {
  assertRequired(['databaseUrl']);
}

export function assertRuntimeEnv() {
  assertRequired(['databaseUrl', 'adminPassword', 'adminToken']);
}

