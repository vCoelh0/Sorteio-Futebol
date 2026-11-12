import assert from 'node:assert/strict';
import test from 'node:test';
import { createTeams } from '../src/services/team-draw.js';

const participants = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  name: `Participante ${index + 1}`,
}));

test('cria cinco times com cinco jogadores sem repetições', () => {
  const teams = createTeams(participants);
  const players = teams.flatMap((team) => team.players);

  assert.equal(teams.length, 5);
  assert.ok(teams.every((team) => team.players.length === 5));
  assert.equal(players.length, 25);
  assert.equal(new Set(players.map(({ id }) => id)).size, 25);
});

test('recusa uma quantidade de participantes diferente de 25', () => {
  assert.throws(() => createTeams(participants.slice(0, 24)), /exatamente 25/);
});

test('permite controlar a aleatoriedade durante os testes', () => {
  const teams = createTeams(participants, () => 0);
  assert.equal(teams[0].players[0].id, 2);
  assert.equal(teams[4].players[4].id, 1);
});
