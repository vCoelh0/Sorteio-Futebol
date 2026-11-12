const STORAGE_KEY = 'liga-futebas-demo-state';
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(STORAGE_KEY) : null;

export const participants = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  name: `Participante ${String(index + 1).padStart(2, '0')}`,
}));

export function emptyState() {
  return { status: 'IDLE', teams: [], startedAt: null, revealAt: null, completedAt: null };
}

export function readState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || emptyState(); }
  catch { return emptyState(); }
}

export function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  channel?.postMessage(state);
  window.dispatchEvent(new CustomEvent('demo-state', { detail: state }));
}

export function subscribe(callback) {
  channel?.addEventListener('message', ({ data }) => callback(data));
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) callback(readState());
  });
  window.addEventListener('demo-state', ({ detail }) => callback(detail));
}

export function drawTeams() {
  const shuffled = [...participants];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return Array.from({ length: 5 }, (_, index) => ({
    number: index + 1,
    name: `TIME ${index + 1}`,
    players: shuffled.slice(index * 5, index * 5 + 5),
  }));
}
