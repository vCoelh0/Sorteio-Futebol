import { DRAW_STATUS } from '../constants/draw.js';
import {
  beginDraw,
  completeDraw,
  getDrawState,
  getPersistedDrawState,
  resetDraw,
} from './draw-state.js';

export function createDrawCoordinator(io, options = {}) {
  const operations = {
    beginDraw,
    completeDraw,
    getDrawState,
    getPersistedDrawState,
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

  return {
    getState: operations.getDrawState,

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
      const persisted = await operations.getPersistedDrawState();
      if (persisted.status !== DRAW_STATUS.DRAWING) return;

      const publicState = await operations.getDrawState();
      scheduleCompletion(publicState.startedAt, publicState.revealAt);
    },

    stop() {
      clearCompletionTimer();
    },
  };
}
