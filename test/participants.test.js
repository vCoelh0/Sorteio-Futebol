import assert from 'node:assert/strict';
import test from 'node:test';
import { listActiveParticipants } from '../src/services/participants.js';

test('lista somente os participantes ativos em ordem alfabética', async () => {
  const expected = [{ id: 2, name: 'Ana' }, { id: 1, name: 'Bruno' }];
  const database = {
    query: async (sql) => {
      assert.match(sql, /active = TRUE/);
      assert.match(sql, /ORDER BY name/);
      return { rows: expected };
    },
  };

  assert.deepEqual(await listActiveParticipants(database), expected);
});
