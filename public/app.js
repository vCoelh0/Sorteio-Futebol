import { getDrawPhase, getDrawTiming } from './draw-timing.js';

const elements = {
  title: document.querySelector('#draw-title'),
  status: document.querySelector('#status-pill'),
  teams: document.querySelector('#teams-grid'),
  animation: document.querySelector('#drawing-animation'),
  countdown: document.querySelector('#countdown'),
  progress: document.querySelector('#drawing-progress'),
  step: document.querySelector('#drawing-step'),
  board: document.querySelector('.draw-board'),
  connection: document.querySelector('#connection-status'),
  connectionLabel: document.querySelector('#connection-status .connection-label'),
  participants: document.querySelector('#participants-list'),
  participantsCount: document.querySelector('#participants-count'),
};

let countdownTimer;
let lastState;
let previousStatus;
let demoApi;

const emptyState = () => ({
  status: 'IDLE', teams: [], startedAt: null, revealAt: null, completedAt: null,
});

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

function renderParticipants(participants) {
  elements.participants.replaceChildren();
  elements.participantsCount.textContent = `${participants.length} nomes`;

  for (const participant of participants) {
    const item = document.createElement('li');
    item.textContent = participant.name;
    elements.participants.append(item);
  }
}

function showParticipantsError() {
  elements.participantsCount.textContent = 'Indisponível';
  const item = document.createElement('li');
  item.className = 'participants-empty';
  item.textContent = 'Não foi possível carregar a lista de jogadores.';
  elements.participants.replaceChildren(item);
}

function startCountdown(state) {
  window.clearInterval(countdownTimer);
  function update() {
    const timing = getDrawTiming(state.startedAt, state.revealAt);
    elements.countdown.textContent = timing.remainingSeconds;
    elements.step.textContent = getDrawPhase(timing.remainingMs);
    elements.progress.style.transform = `scaleX(${timing.progress})`;

    if (timing.remainingMs === 0) {
      window.clearInterval(countdownTimer);
      elements.countdown.textContent = '0';
      elements.title.textContent = 'Finalizando o sorteio';
      if (demoApi) {
        demoApi.writeState({ ...state, status: 'COMPLETED', completedAt: new Date().toISOString() });
      }
    }
  }

  update();
  countdownTimer = window.setInterval(update, 100);
}

function render(state = emptyState()) {
  const statusBeforeRender = previousStatus;
  previousStatus = state.status;
  lastState = state;
  document.body.dataset.drawState = state.status.toLowerCase();
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
    if (statusBeforeRender === 'DRAWING') {
      elements.board.classList.remove('celebrate');
      requestAnimationFrame(() => elements.board.classList.add('celebrate'));
      window.setTimeout(() => elements.board.classList.remove('celebrate'), 1300);
    }
  } else {
    elements.title.textContent = 'Aguardando o organizador';
    elements.status.textContent = 'Aguardando';
    elements.teams.innerHTML = Array.from({ length: 5 }, (_, index) => placeholderCard(index + 1)).join('');
  }
}

function setConnection(status, label) {
  elements.connection.classList.remove('connected', 'disconnected');
  elements.connection.classList.add(status);
  elements.connectionLabel.textContent = label;
}

function showLoadError(message) {
  window.clearInterval(countdownTimer);
  elements.animation.hidden = true;
  elements.teams.hidden = false;
  elements.title.textContent = 'Não foi possível carregar o sorteio';
  elements.status.textContent = 'Indisponível';
  elements.teams.innerHTML = `<div class="load-error">${message}</div>`;
}

async function startDemoMode() {
  const demo = await import('./demo-state.js');
  demoApi = demo;
  setConnection('connected', 'Modo demonstração');
  renderParticipants(demo.participants);
  demo.subscribe(render);
  render(demo.readState());
}

async function startLiveMode() {
  setConnection('disconnected', 'Conectando...');

  try {
    const response = await fetch('/api/draw', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`API respondeu com status ${response.status}`);
    render(await response.json());
  } catch (error) {
    console.error('Falha ao carregar o estado inicial:', error);
    showLoadError('Verifique a conexão e tente atualizar a página.');
  }

  try {
    const response = await fetch('/api/participants', { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`API respondeu com status ${response.status}`);
    renderParticipants(await response.json());
  } catch (error) {
    console.error('Falha ao carregar os participantes:', error);
    showParticipantsError();
  }

  if (typeof window.io !== 'function') {
    setConnection('disconnected', 'Sem conexão ao vivo');
    return;
  }

  const socket = window.io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 800,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => setConnection('connected', 'Sorteio ao vivo'));
  socket.on('draw:state', render);
  socket.on('draw:error', ({ message }) => showLoadError(message));
  socket.on('disconnect', () => {
    setConnection('disconnected', 'Reconectando...');
    if (lastState) render(lastState);
  });
  socket.io.on('reconnect_attempt', () => setConnection('disconnected', 'Reconectando...'));
  socket.io.on('reconnect_failed', () => setConnection('disconnected', 'Conexão perdida'));
}

render(emptyState());
if (new URLSearchParams(window.location.search).get('demo') === '1') {
  startDemoMode();
} else {
  startLiveMode();
}
