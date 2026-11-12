import { randomInt } from 'node:crypto';
import { DRAW_CONFIG } from '../constants/draw.js';

export class CaptainCountError extends Error {}

export function shuffle(items, getRandomIndex = randomInt) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function createTeams(participants, getRandomIndex = randomInt) {
  if (participants.length !== DRAW_CONFIG.participantCount) {
    throw new Error(`O sorteio exige exatamente ${DRAW_CONFIG.participantCount} participantes ativos.`);
  }

  const captains = participants.filter(({ is_captain: isCaptain }) => isCaptain === true);
  if (captains.length !== DRAW_CONFIG.teamCount) {
    throw new CaptainCountError(`O sorteio exige exatamente ${DRAW_CONFIG.teamCount} capitães ativos.`);
  }

  const shuffledCaptains = shuffle(captains, getRandomIndex);
  const shuffledPlayers = shuffle(
    participants.filter(({ is_captain: isCaptain }) => isCaptain !== true),
    getRandomIndex,
  );
  const teams = Array.from({ length: DRAW_CONFIG.teamCount }, (_, index) => ({
    number: index + 1,
    name: `TIME ${index + 1}`,
    players: [shuffledCaptains[index]],
  }));

  shuffledPlayers.forEach((player, index) => {
    teams[index % DRAW_CONFIG.teamCount].players.push(player);
  });

  return teams.map((team) => ({
    ...team,
    players: team.players.map(({ id, name }) => ({ id, name })),
  }));
}
