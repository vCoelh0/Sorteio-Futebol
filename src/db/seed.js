import { readFile } from 'node:fs/promises';
import { pool } from '../config/database.js';
import { assertDatabaseEnv } from '../config/env.js';
import { DRAW_CONFIG } from '../constants/draw.js';

const participantsUrl = new URL('../../data/participants.json', import.meta.url);

async function seed() {
  assertDatabaseEnv();
  const participants = JSON.parse(await readFile(participantsUrl, 'utf8'));
  const names = participants.map(({ name }) => name?.trim());

  if (names.length !== DRAW_CONFIG.participantCount) {
    throw new Error(`A lista deve conter exatamente ${DRAW_CONFIG.participantCount} participantes.`);
  }
  if (names.some((name) => !name) || new Set(names).size !== names.length) {
    throw new Error('Os nomes dos participantes devem ser preenchidos e únicos.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE participants SET active = FALSE');

    for (const name of names) {
      await client.query(
        `INSERT INTO participants (name, active)
         VALUES ($1, TRUE)
         ON CONFLICT (name) DO UPDATE SET active = TRUE`,
        [name],
      );
    }

    await client.query('COMMIT');
    console.log(`${names.length} participantes ativos sincronizados.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error) => {
    console.error('Falha ao importar participantes:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
