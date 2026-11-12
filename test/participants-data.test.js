import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('mantém 25 jogadores e os cinco capitães configurados', async () => {
  const fileUrl = new URL('../data/participants.json', import.meta.url);
  const participants = JSON.parse(await readFile(fileUrl, 'utf8'));
  const captains = participants.filter(({ captain }) => captain).map(({ name }) => name).sort();

  assert.equal(participants.length, 25);
  assert.equal(new Set(participants.map(({ name }) => name)).size, 25);
  assert.deepEqual(captains, ['FJ', 'João Freitas', 'Kauan', 'Marquinhos', 'Tiago'].sort());
});
