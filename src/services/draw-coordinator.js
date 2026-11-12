import { DRAW_STATUS } from '../constants/draw.js';
import {
  beginDraw,
  completeDraw,
  getDrawState,
  resetDraw,
} from './draw-state.js';

export function createDrawCoordinator(io, options = {}) {
  const operations = {
    beginDraw,
    completeDraw,
    getDrawState,
    resetDraw,
    ...options.operations,
  };
  const timers = {
    set: setTimeout,
    clear: clearTimeout,
    now: Date.now,
    ...options.timers,
  };
  let completionTimer = null;

  function clearCompletionTimer() {
    if (completionTimer) timers.clear(completionTimer);
    completionTimer = null;
  }

  function scheduleCompletion(startedAt, revealAt) {
    clearCompletionTimer();
    const delay = Math.max(0, new Date(revealAt).getTime() - timers.now());

    completionTimer = timers.set(async () => {
      completionTimer = null;
      try {
        const state = await operations.completeDraw(startedAt);
        if (state) io.emit('draw:state', state);
      } catch (error) {
        console.error('Falha ao concluir o sorteio:', error);
        io.emit('draw:error', { message: 'Não foi possível concluir o sorteio.' });
      }
    }, delay);
  }

  async function getCurrentState() {
    const state = await operations.getDrawState();
    const revealTime = state.revealAt ? new Date(state.revealAt).getTime() : Number.POSITIVE_INFINITY;

    if (state.status !== DRAW_STATUS.DRAWING || revealTime > timers.now()) return state;

    const completedState = await operations.completeDraw(state.startedAt);
    if (completedState) {
      clearCompletionTimer();
      io.emit('draw:state', completedState);
      return completedState;
    }

    return operations.getDrawState();
  }

  return {
    getState: getCurrentState,

    async start() {
      const state = await operations.beginDraw();
      io.emit('draw:state', state);
      scheduleCompletion(state.startedAt, state.revealAt);
      return state;
    },

    async reset() {
      clearCompletionTimer();
      const state = await operations.resetDraw();
      io.emit('draw:state', state);
      return state;
    },

    async resume() {
      const state = await getCurrentState();
      if (state.status === DRAW_STATUS.DRAWING) {
        scheduleCompletion(state.startedAt, state.revealAt);
      }
    },

    stop() {
      clearCompletionTimer();
    },
  };
}
