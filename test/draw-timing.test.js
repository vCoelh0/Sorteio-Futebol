import assert from 'node:assert/strict';
import test from 'node:test';
import { getDrawPhase, getDrawTiming } from '../public/draw-timing.js';

const start = '2026-11-12T12:00:00.000Z';
const reveal = '2026-11-12T12:00:07.000Z';

test('calcula a contagem e o progresso usando os horários do servidor', () => {
  const timing = getDrawTiming(start, reveal, new Date('2026-11-12T12:00:03.500Z').getTime());
  assert.equal(timing.remainingSeconds, 4);
  assert.equal(timing.remainingMs, 3500);
  assert.equal(timing.progress, 0.5);
});

test('limita o progresso e escolhe cada etapa da animação', () => {
  assert.equal(getDrawTiming(start, reveal, new Date('2026-11-12T12:00:08.000Z').getTime()).progress, 1);
  assert.equal(getDrawPhase(6000), 'Embaralhando os 25 participantes');
  assert.equal(getDrawPhase(4000), 'Distribuindo 5 jogadores em cada time');
  assert.equal(getDrawPhase(1000), 'Preparando o resultado');
  assert.equal(getDrawPhase(0), 'Finalizando o sorteio');
});
