import { pool } from '../config/database.js';

export async function getDrawState() {
  const result = await pool.query(
    `SELECT status, teams, started_at, completed_at, updated_at
       FROM draw_state
      WHERE id = 1`,
  );

  if (result.rowCount !== 1) {
    throw new Error('Estado único do sorteio não foi inicializado.');
  }

  return result.rows[0];
}
