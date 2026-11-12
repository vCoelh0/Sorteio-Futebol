import { DRAW_STATUS } from '../constants/draw.js';
import {
  beginDraw,
  completeDraw,
  getDrawState,
  getPersistedDrawState,
  resetDraw,
} from './draw-state.js';

export function createDrawCoordinator(io) {
  let completionTimer = null;

  function clearCompletionTimer() {
    if (completionTimer) clearTimeout(completionTimer);
    completionTimer = null;
  }

  function scheduleCompletion(startedAt, revealAt) {
    clearCompletionTimer();
    const delay = Math.max(0, new Date(revealAt).getTime() - Date.now());

    completionTimer = setTimeout(async () => {
      completionTimer = null;
      try {
        const state = await completeDraw(startedAt);
        if (state) io.emit('draw:state', state);
      } catch (error) {
        console.error('Falha ao concluir o sorteio:', error);
        io.emit('draw:error', { message: 'Não foi possível concluir o sorteio.' });
      }
    }, delay);
  }

  return {
    getState: getDrawState,

    async start() {
      const state = await beginDraw();
      io.emit('draw:state', state);
      scheduleCompletion(state.startedAt, state.revealAt);
      return state;
    },

    async reset() {
      clearCompletionTimer();
      const state = await resetDraw();
      io.emit('draw:state', state);
      return state;
    },

    async resume() {
      const persisted = await getPersistedDrawState();
      if (persisted.status !== DRAW_STATUS.DRAWING) return;

      const publicState = await getDrawState();
      scheduleCompletion(publicState.startedAt, publicState.revealAt);
    },

    stop() {
      clearCompletionTimer();
    },
  };
}
