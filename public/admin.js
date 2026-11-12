import { drawTeams, emptyState, readState, subscribe, writeState } from './demo-state.js';

const elements = {
  draw: document.querySelector('#draw-button'),
  reset: document.querySelector('#reset-button'),
  title: document.querySelector('#admin-title'),
  description: document.querySelector('#admin-description'),
  status: document.querySelector('#admin-status-number'),
  toast: document.querySelector('#toast'),
};

let completionTimer;
let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => { elements.toast.hidden = true; }, 3200);
}

function render(state = emptyState()) {
  const drawing = state.status === 'DRAWING';
  const completed = state.status === 'COMPLETED';

  elements.draw.disabled = drawing || completed;
  elements.reset.disabled = state.status === 'IDLE';

  if (drawing) {
    elements.status.textContent = 'AO VIVO';
    elements.title.textContent = 'Sorteio em andamento';
    elements.description.textContent = 'A animação está sendo exibida para todos os visitantes.';
    elements.draw.textContent = 'Sorteando...';
  } else if (completed) {
    elements.status.textContent = 'PRONTO';
    elements.title.textContent = 'Times definidos com sucesso';
    elements.description.textContent = 'O resultado permanece visível até o sorteio ser resetado.';
    elements.draw.textContent = 'Sorteio concluído';
  } else {
    elements.status.textContent = '—';
    elements.title.textContent = 'Tudo pronto para começar';
    elements.description.textContent = 'Inicie quando todos estiverem acompanhando a tela pública.';
    elements.draw.textContent = 'Sortear times';
  }
}

elements.draw.addEventListener('click', () => {
  const now = Date.now();
  const state = {
    status: 'DRAWING',
    teams: drawTeams(),
    startedAt: new Date(now).toISOString(),
    revealAt: new Date(now + 7000).toISOString(),
    completedAt: null,
  };
  writeState(state);
  showToast('Sorteio iniciado. O resultado será revelado em 7 segundos.');
  window.clearTimeout(completionTimer);
  completionTimer = window.setTimeout(() => {
    writeState({ ...state, status: 'COMPLETED', completedAt: new Date().toISOString() });
  }, 7000);
});

elements.reset.addEventListener('click', () => {
  if (!window.confirm('Deseja limpar os times e voltar ao estado inicial?')) return;
  window.clearTimeout(completionTimer);
  writeState(emptyState());
  showToast('Sorteio resetado. A tela pública voltou ao estado inicial.');
});

subscribe(render);
render(readState());
