import { readFile } from 'node:fs/promises';
import { pool } from '../config/database.js';
import { assertDatabaseEnv } from '../config/env.js';
import { DRAW_CONFIG } from '../constants/draw.js';

const participantsUrl = new URL('../../data/participants.json', import.meta.url);

async function seed() {
  assertDatabaseEnv();
  const participants = JSON.parse(await readFile(participantsUrl, 'utf8'));
  const names = participants.map(({ name }) => name?.trim());
  const captainCount = participants.filter(({ captain }) => captain === true).length;

  if (names.length !== DRAW_CONFIG.participantCount) {
    throw new Error(`A lista deve conter exatamente ${DRAW_CONFIG.participantCount} participantes.`);
  }
  if (names.some((name) => !name) || new Set(names).size !== names.length) {
    throw new Error('Os nomes dos participantes devem ser preenchidos e únicos.');
  }
  if (captainCount !== DRAW_CONFIG.teamCount) {
    throw new Error(`A lista deve conter exatamente ${DRAW_CONFIG.teamCount} capitães.`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE participants SET active = FALSE, is_captain = FALSE');

    for (const participant of participants) {
      const name = participant.name.trim();
      await client.query(
        `INSERT INTO participants (name, active, is_captain)
         VALUES ($1, TRUE, $2)
         ON CONFLICT (name) DO UPDATE
           SET active = TRUE, is_captain = EXCLUDED.is_captain`,
        [name, participant.captain === true],
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
