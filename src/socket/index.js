import { getDrawState } from '../services/draw-state.js';

export function registerSocketHandlers(io) {
  io.on('connection', async (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    try {
      socket.emit('draw:state', await getDrawState());
    } catch (error) {
      console.error('Não foi possível enviar o estado inicial:', error);
      socket.emit('draw:error', { message: 'Não foi possível carregar o sorteio.' });
    }

    socket.on('disconnect', (reason) => {
      console.log(`Cliente desconectado: ${socket.id} (${reason})`);
    });
  });
}
