export function getDrawTiming(startedAt, revealAt, now = Date.now()) {
  const start = new Date(startedAt).getTime();
  const reveal = new Date(revealAt).getTime();
  const duration = Math.max(1, reveal - start);
  const remainingMs = Math.max(0, reveal - now);

  return {
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    progress: Math.min(1, Math.max(0, (now - start) / duration)),
  };
}

export function getDrawPhase(remainingMs) {
  if (remainingMs > 5000) return 'Embaralhando os 25 participantes';
  if (remainingMs > 2000) return 'Distribuindo 5 jogadores em cada time';
  if (remainingMs > 0) return 'Preparando o resultado';
  return 'Finalizando o sorteio';
}
