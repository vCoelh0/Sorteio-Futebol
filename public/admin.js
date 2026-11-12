const demoMode = new URLSearchParams(window.location.search).get('demo') === '1';
const tokenKey = 'liga-futebas-admin-token';

const elements = {
  loginView: document.querySelector('#login-view'),
  adminView: document.querySelector('#admin-view'),
  loginForm: document.querySelector('#login-form'),
  loginButton: document.querySelector('#login-button'),
  password: document.querySelector('#admin-password'),
  loginError: document.querySelector('#login-error'),
  logout: document.querySelector('#logout-button'),
  draw: document.querySelector('#draw-button'),
  reset: document.querySelector('#reset-button'),
  title: document.querySelector('#admin-title'),
  description: document.querySelector('#admin-description'),
  status: document.querySelector('#admin-status-number'),
  toast: document.querySelector('#toast'),
};

let currentState = { status: 'IDLE' };
let completionTimer;
let toastTimer;
let socket;

function showToast(message, error = false) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle('error', error);
  elements.toast.hidden = false;
  toastTimer = window.setTimeout(() => { elements.toast.hidden = true; }, 3200);
}

function showLogin() {
  elements.loginView.hidden = false;
  elements.adminView.hidden = true;
  elements.logout.hidden = true;
  window.setTimeout(() => elements.password.focus(), 0);
}

function showAdmin() {
  elements.loginView.hidden = true;
  elements.adminView.hidden = false;
  elements.logout.hidden = demoMode;
}

function render(state) {
  currentState = state;
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

async function api(path, options = {}) {
  const token = sessionStorage.getItem(tokenKey);
  const response = await fetch(path, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(body?.message || 'Não foi possível concluir a operação.');
  return body;
}

function connectSocket() {
  if (typeof window.io !== 'function' || socket) return;
  socket = window.io();
  socket.on('draw:state', render);
  socket.on('draw:error', ({ message }) => showToast(message, true));
}

async function startRealMode() {
  if (!sessionStorage.getItem(tokenKey)) {
    showLogin();
    return;
  }

  try {
    await api('/api/admin/session');
    showAdmin();
    render(await api('/api/draw'));
    connectSocket();
  } catch (error) {
    sessionStorage.removeItem(tokenKey);
    showLogin();
    showToast(error.message, true);
  }
}

async function startDemoMode() {
  const demo = await import('./demo-state.js');
  showAdmin();
  render(demo.readState());
  demo.subscribe(render);

  elements.draw.addEventListener('click', () => {
    const now = Date.now();
    const state = {
      status: 'DRAWING', teams: demo.drawTeams(),
      startedAt: new Date(now).toISOString(), revealAt: new Date(now + 7000).toISOString(), completedAt: null,
    };
    demo.writeState(state);
    showToast('Sorteio iniciado. O resultado será revelado em 7 segundos.');
    window.clearTimeout(completionTimer);
    completionTimer = window.setTimeout(() => {
      demo.writeState({ ...state, status: 'COMPLETED', completedAt: new Date().toISOString() });
    }, 7000);
  });

  elements.reset.addEventListener('click', () => {
    if (!window.confirm('Deseja limpar os times e voltar ao estado inicial?')) return;
    window.clearTimeout(completionTimer);
    demo.writeState(demo.emptyState());
    showToast('Sorteio resetado. A tela pública voltou ao estado inicial.');
  });
}

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.loginError.hidden = true;
  elements.loginButton.disabled = true;
  elements.loginButton.textContent = 'Entrando...';

  try {
    const result = await api('/api/admin/login', {
      method: 'POST', body: JSON.stringify({ password: elements.password.value }),
    });
    sessionStorage.setItem(tokenKey, result.token);
    elements.password.value = '';
    showAdmin();
    render(await api('/api/draw'));
    connectSocket();
  } catch (error) {
    elements.loginError.textContent = error.message;
    elements.loginError.hidden = false;
    elements.password.select();
  } finally {
    elements.loginButton.disabled = false;
    elements.loginButton.textContent = 'Entrar';
  }
});

elements.logout.addEventListener('click', () => {
  sessionStorage.removeItem(tokenKey);
  socket?.disconnect();
  socket = null;
  showLogin();
});

if (!demoMode) {
  elements.draw.addEventListener('click', async () => {
    elements.draw.disabled = true;
    try {
      render(await api('/api/admin/draw', { method: 'POST' }));
      showToast('Sorteio iniciado. O resultado será revelado em 7 segundos.');
    } catch (error) {
      showToast(error.message, true);
      render(currentState);
    }
  });

  elements.reset.addEventListener('click', async () => {
    if (!window.confirm('Deseja limpar os times e voltar ao estado inicial?')) return;
    elements.reset.disabled = true;
    try {
      render(await api('/api/admin/reset', { method: 'POST' }));
      showToast('Sorteio resetado. A tela pública voltou ao estado inicial.');
    } catch (error) {
      showToast(error.message, true);
      render(currentState);
    }
  });
}

if (demoMode) startDemoMode();
else startRealMode();
