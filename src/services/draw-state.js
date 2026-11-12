import { pool } from '../config/database.js';
import { DRAW_CONFIG, DRAW_STATUS } from '../constants/draw.js';
import { createTeams } from './team-draw.js';

export class DrawConflictError extends Error {}
export class ParticipantCountError extends Error {}

function toPublicState(row) {
  const completed = row.status === DRAW_STATUS.COMPLETED;
  const startedAt = row.started_at ? new Date(row.started_at) : null;

  return {
    status: row.status,
    teams: completed ? row.teams : [],
    startedAt: startedAt?.toISOString() ?? null,
    revealAt: startedAt
      ? new Date(startedAt.getTime() + DRAW_CONFIG.animationDurationMs).toISOString()
      : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getPersistedDrawState(database = pool) {
  const result = await database.query(
    `SELECT status, teams, started_at, completed_at, updated_at
       FROM draw_state
      WHERE id = 1`,
  );

  if (result.rowCount !== 1) {
    throw new Error('Estado único do sorteio não foi inicializado.');
  }

  return result.rows[0];
}

export async function getDrawState(database = pool) {
  return toPublicState(await getPersistedDrawState(database));
}

export async function beginDraw(database = pool) {
  const client = await database.connect();

  try {
    await client.query('BEGIN');
    const stateResult = await client.query(
      'SELECT status FROM draw_state WHERE id = 1 FOR UPDATE',
    );
    const state = stateResult.rows[0];

    if (state.status !== DRAW_STATUS.IDLE) {
      throw new DrawConflictError(
        state.status === DRAW_STATUS.DRAWING
          ? 'Já existe um sorteio em andamento.'
          : 'Resete o sorteio atual antes de iniciar outro.',
      );
    }

    const participantsResult = await client.query(
      'SELECT id, name, is_captain FROM participants WHERE active = TRUE ORDER BY id',
    );
    if (participantsResult.rowCount !== DRAW_CONFIG.participantCount) {
      throw new ParticipantCountError(
        `São necessários ${DRAW_CONFIG.participantCount} participantes ativos; encontrados ${participantsResult.rowCount}.`,
      );
    }

    const teams = createTeams(participantsResult.rows);
    const result = await client.query(
      `UPDATE draw_state
          SET status = $1,
              teams = $2::jsonb,
              started_at = NOW(),
              completed_at = NULL,
              updated_at = NOW()
        WHERE id = 1
      RETURNING status, teams, started_at, completed_at, updated_at`,
      [DRAW_STATUS.DRAWING, JSON.stringify(teams)],
    );

    await client.query('COMMIT');
    return toPublicState(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function completeDraw(expectedStartedAt, database = pool) {
  const result = await database.query(
    `UPDATE draw_state
        SET status = $1,
            completed_at = NOW(),
            updated_at = NOW()
      WHERE id = 1
        AND status = $2
        AND date_trunc('milliseconds', started_at) = $3::timestamptz
    RETURNING status, teams, started_at, completed_at, updated_at`,
    [DRAW_STATUS.COMPLETED, DRAW_STATUS.DRAWING, expectedStartedAt],
  );

  return result.rowCount === 1 ? toPublicState(result.rows[0]) : null;
}

export async function resetDraw(database = pool) {
  const result = await database.query(
    `UPDATE draw_state
        SET status = $1,
            teams = '[]'::jsonb,
            started_at = NULL,
            completed_at = NULL,
            updated_at = NOW()
      WHERE id = 1
    RETURNING status, teams, started_at, completed_at, updated_at`,
    [DRAW_STATUS.IDLE],
  );

  return toPublicState(result.rows[0]);
}
