const STORAGE_KEY = 'liga-futebas-demo-state';
const channel = 'BroadcastChannel' in window ? new BroadcastChannel(STORAGE_KEY) : null;

const participantNames = [
  'FJ', 'Big', 'Djalma', 'Wil', 'Douglas', 'Giovanni', 'Gabriel', 'Renan', 'João Freitas',
  'House', 'Ivan', 'Bruno', 'Davidson', 'Cleyton', 'Vini Leite', 'Arthur', 'Allan', 'Mario',
  'Marquinhos', 'Tiago', 'André', 'Kauan', 'Murilo', 'João Vitor - Irmão do Fran',
  'Kaique (George Washington)',
];

export const participants = participantNames.map((name, index) => ({ id: index + 1, name }));
const captainNames = new Set(['Tiago', 'Kauan', 'João Freitas', 'Marquinhos', 'FJ']);

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
  const shuffle = (items) => {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  };
  const captains = shuffle(participants.filter(({ name }) => captainNames.has(name)));
  const players = shuffle(participants.filter(({ name }) => !captainNames.has(name)));
  const teams = Array.from({ length: 5 }, (_, index) => ({
    number: index + 1,
    name: `TIME ${index + 1}`,
    players: [captains[index]],
  }));

  players.forEach((player, index) => {
    teams[index % 5].players.push(player);
  });

  return teams;
}
