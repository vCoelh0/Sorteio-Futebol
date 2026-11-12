import { randomInt } from 'node:crypto';
import { DRAW_CONFIG } from '../constants/draw.js';

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

  const shuffled = shuffle(participants, getRandomIndex);
  return Array.from({ length: DRAW_CONFIG.teamCount }, (_, index) => ({
    number: index + 1,
    name: `TIME ${index + 1}`,
    players: shuffled.slice(
      index * DRAW_CONFIG.playersPerTeam,
      (index + 1) * DRAW_CONFIG.playersPerTeam,
    ),
  }));
}
