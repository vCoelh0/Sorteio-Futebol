import assert from 'node:assert/strict';
import test from 'node:test';
import { DRAW_CONFIG, DRAW_STATUS } from '../src/constants/draw.js';

test('configura cinco times com cinco participantes', () => {
  assert.equal(DRAW_CONFIG.teamCount, 5);
  assert.equal(DRAW_CONFIG.playersPerTeam, 5);
  assert.equal(
    DRAW_CONFIG.participantCount,
    DRAW_CONFIG.teamCount * DRAW_CONFIG.playersPerTeam,
  );
});
test('configura sete segundos de animação', () => {
  assert.equal(DRAW_CONFIG.animationDurationMs, 7_000);
});

test('expõe os três estados previstos para o sorteio', () => {
  assert.deepEqual(Object.values(DRAW_STATUS), ['IDLE', 'DRAWING', 'COMPLETED']);
});

