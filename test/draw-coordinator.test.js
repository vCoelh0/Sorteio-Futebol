import assert from 'node:assert/strict';
import test from 'node:test';
import { createDrawCoordinator } from '../src/services/draw-coordinator.js';

const drawingState = {
  status: 'DRAWING', teams: [],
  startedAt: '2026-11-12T12:00:00.000Z',
  revealAt: '2026-11-12T12:00:07.000Z',
};
const completedState = { ...drawingState, status: 'COMPLETED', teams: [{ name: 'TIME 1' }] };
const idleState = { status: 'IDLE', teams: [], startedAt: null, revealAt: null };

function harness(persistedStatus = 'IDLE') {
  const events = [];
  let scheduled;
  let cleared = false;
  const io = { emit: (event, payload) => events.push({ event, payload }) };
  const operations = {
    beginDraw: async () => drawingState,
    completeDraw: async () => completedState,
    getDrawState: async () => drawingState,
    getPersistedDrawState: async () => ({ status: persistedStatus }),
    resetDraw: async () => idleState,
  };
  const timers = {
    now: () => new Date('2026-11-12T12:00:00.000Z').getTime(),
    set: (callback) => { scheduled = callback; return 123; },
    clear: () => { cleared = true; scheduled = undefined; },
  };
  const coordinator = createDrawCoordinator(io, { operations, timers });
  return { coordinator, events, runScheduled: async () => scheduled?.(), wasCleared: () => cleared };
}

test('transmite o início e a conclusão para todos os clientes', async () => {
  const testHarness = harness();
  await testHarness.coordinator.start();
  assert.equal(testHarness.events[0].payload.status, 'DRAWING');

  await testHarness.runScheduled();
  assert.equal(testHarness.events[1].payload.status, 'COMPLETED');
  assert.equal(testHarness.events[1].event, 'draw:state');
});

test('reset cancela a conclusão pendente e transmite o estado inicial', async () => {
  const testHarness = harness();
  await testHarness.coordinator.start();
  const state = await testHarness.coordinator.reset();

  assert.equal(state.status, 'IDLE');
  assert.equal(testHarness.wasCleared(), true);
  assert.equal(testHarness.events.at(-1).payload.status, 'IDLE');
});

test('retoma a conclusão pendente depois de reiniciar o servidor', async () => {
  const testHarness = harness('DRAWING');
  await testHarness.coordinator.resume();
  await testHarness.runScheduled();

  assert.equal(testHarness.events.length, 1);
  assert.equal(testHarness.events[0].payload.status, 'COMPLETED');
});
