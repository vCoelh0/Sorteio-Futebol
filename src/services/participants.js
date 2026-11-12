import { pool } from '../config/database.js';

export async function listActiveParticipants(database = pool) {
  const result = await database.query(
    'SELECT id, name FROM participants WHERE active = TRUE ORDER BY name',
  );
  return result.rows;
}
