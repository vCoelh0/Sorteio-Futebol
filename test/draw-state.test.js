import assert from 'node:assert/strict';
import test from 'node:test';
import {
  beginDraw,
  DrawConflictError,
  getDrawState,
  ParticipantCountError,
} from '../src/services/draw-state.js';

const timestamp = new Date('2026-11-12T12:00:00.000Z');

function stateRow(status, teams = []) {
  return {
    status,
    teams,
    started_at: status === 'IDLE' ? null : timestamp,
    completed_at: status === 'COMPLETED' ? new Date(timestamp.getTime() + 7000) : null,
    updated_at: timestamp,
  };
}

function transactionDatabase({ status = 'IDLE', participantCount = 25 } = {}) {
  const calls = [];
  const participants = Array.from({ length: participantCount }, (_, index) => ({
    id: index + 1,
    name: `Participante ${index + 1}`,
  }));

  const client = {
    async query(sql, params = []) {
      calls.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
      if (sql.includes('SELECT status')) return { rowCount: 1, rows: [{ status }] };
      if (sql.includes('FROM participants')) return { rowCount: participants.length, rows: participants };
      if (sql.includes('UPDATE draw_state')) {
        return { rowCount: 1, rows: [stateRow('DRAWING', JSON.parse(params[1]))] };
      }
      return { rowCount: 0, rows: [] };
    },
    release() { calls.push('RELEASE'); },
  };

  return { database: { connect: async () => client }, calls };
}

test('oculta os times enquanto o sorteio está em andamento', async () => {
  const privateTeams = [{ name: 'TIME 1', players: [{ id: 1, name: 'Jogador' }] }];
  const database = {
    query: async () => ({ rowCount: 1, rows: [stateRow('DRAWING', privateTeams)] }),
  };

  const state = await getDrawState(database);
  assert.equal(state.status, 'DRAWING');
  assert.deepEqual(state.teams, []);
  assert.equal(state.revealAt, '2026-11-12T12:00:07.000Z');
});

test('rejeita um segundo sorteio enquanto outro está em andamento', async () => {
  const { database, calls } = transactionDatabase({ status: 'DRAWING' });
  await assert.rejects(() => beginDraw(database), DrawConflictError);
  assert.ok(calls.includes('ROLLBACK'));
  assert.ok(calls.includes('RELEASE'));
});

test('rejeita o sorteio quando não existem 25 participantes ativos', async () => {
  const { database, calls } = transactionDatabase({ participantCount: 24 });
  await assert.rejects(() => beginDraw(database), ParticipantCountError);
  assert.ok(calls.includes('ROLLBACK'));
});

test('grava os cinco times em transação sem revelá-los antes da conclusão', async () => {
  const { database, calls } = transactionDatabase();
  const state = await beginDraw(database);

  assert.equal(state.status, 'DRAWING');
  assert.deepEqual(state.teams, []);
  assert.ok(calls.includes('COMMIT'));
  assert.ok(calls.includes('RELEASE'));
});
