import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/database.js';
import { assertDatabaseEnv } from '../config/env.js';

const migrationUrl = new URL('./migrations/001_initial.sql', import.meta.url);

async function migrate() {
  assertDatabaseEnv();
  const sql = await readFile(fileURLToPath(migrationUrl), 'utf8');
  await pool.query(sql);
  console.log('Migração inicial aplicada com sucesso.');
}

migrate()
  .catch((error) => {
    console.error('Falha ao executar migrações:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
