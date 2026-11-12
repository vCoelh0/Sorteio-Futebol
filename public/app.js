import { emptyState, readState, subscribe, writeState } from './demo-state.js';

const elements = {
  title: document.querySelector('#draw-title'),
  status: document.querySelector('#status-pill'),
  teams: document.querySelector('#teams-grid'),
  animation: document.querySelector('#drawing-animation'),
  countdown: document.querySelector('#countdown'),
  progress: document.querySelector('#drawing-progress'),
};

let countdownTimer;

function placeholderCard(index) {
  return `<article class="team-card placeholder">
    <div class="team-title"><strong>TIME ${index}</strong><span>${index}</span></div>
    <div class="placeholder-lines"><span></span><span></span><span></span><span></span><span></span></div>
  </article>`;
}

function teamCard(team) {
  const players = team.players.map((player, index) => `
    <li><span class="number">${String(index + 1).padStart(2, '0')}</span><span>${player.name}</span></li>
  `).join('');
  return `<article class="team-card">
    <div class="team-title"><strong>${team.name}</strong><span>${team.number}</span></div>
    <ol class="player-list">${players}</ol>
  </article>`;
}

function startCountdown(state) {
  window.clearInterval(countdownTimer);
  const startedAt = new Date(state.startedAt).getTime();
  const revealAt = new Date(state.revealAt).getTime();

  function update() {
    const remaining = Math.max(0, revealAt - Date.now());
    elements.countdown.textContent = Math.ceil(remaining / 1000);
    const elapsedRatio = Math.min(1, Math.max(0, (Date.now() - startedAt) / (revealAt - startedAt)));
    elements.progress.style.width = `${elapsedRatio * 100}%`;

    if (remaining === 0) {
      window.clearInterval(countdownTimer);
      writeState({ ...state, status: 'COMPLETED', completedAt: new Date().toISOString() });
    }
  }

  update();
  countdownTimer = window.setInterval(update, 100);
}

function render(state = emptyState()) {
  const drawing = state.status === 'DRAWING';
  const completed = state.status === 'COMPLETED';

  elements.animation.hidden = !drawing;
  elements.teams.hidden = drawing;

  if (drawing) {
    elements.title.textContent = 'A bola está rolando';
    elements.status.textContent = 'Sorteando';
    startCountdown(state);
    return;
  }

  window.clearInterval(countdownTimer);
  if (completed) {
    elements.title.textContent = 'Os times estão definidos';
    elements.status.textContent = 'Finalizado';
    elements.teams.innerHTML = state.teams.map(teamCard).join('');
  } else {
    elements.title.textContent = 'Aguardando o organizador';
    elements.status.textContent = 'Aguardando';
    elements.teams.innerHTML = Array.from({ length: 5 }, (_, index) => placeholderCard(index + 1)).join('');
  }
}

subscribe(render);
render(readState());
