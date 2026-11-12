import assert from 'node:assert/strict';
import test from 'node:test';
import { createTeams } from '../src/services/team-draw.js';

const participants = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  name: `Participante ${index + 1}`,
  is_captain: index < 5,
}));

test('cria cinco times com cinco jogadores sem repetições', () => {
  const teams = createTeams(participants);
  const players = teams.flatMap((team) => team.players);

  assert.equal(teams.length, 5);
  assert.ok(teams.every((team) => team.players.length === 5));
  assert.equal(players.length, 25);
  assert.equal(new Set(players.map(({ id }) => id)).size, 25);
  assert.ok(teams.every((team) => team.players.filter(({ id }) => id <= 5).length === 1));
  assert.ok(players.every((player) => !Object.hasOwn(player, 'is_captain')));
});

test('recusa uma quantidade de participantes diferente de 25', () => {
  assert.throws(() => createTeams(participants.slice(0, 24)), /exatamente 25/);
});

test('permite controlar a aleatoriedade durante os testes', () => {
  assert.deepEqual(createTeams(participants, () => 0), createTeams(participants, () => 0));
});

test('recusa uma lista que não tenha exatamente cinco capitães', () => {
  const invalidParticipants = participants.map((participant, index) => ({
    ...participant,
    is_captain: index < 4,
  }));
  assert.throws(() => createTeams(invalidParticipants), /exatamente 5 capitães/);
});
