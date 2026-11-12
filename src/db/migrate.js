import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/database.js';
import { assertDatabaseEnv } from '../config/env.js';

const migrationsUrl = new URL('./migrations/', import.meta.url);

async function migrate() {
  assertDatabaseEnv();
  const directory = fileURLToPath(migrationsUrl);
  const files = (await readdir(directory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await readFile(new URL(file, migrationsUrl), 'utf8');
    await pool.query(sql);
    console.log(`Migração aplicada: ${file}`);
  }
}

migrate()
  .catch((error) => {
    console.error('Falha ao executar migrações:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
