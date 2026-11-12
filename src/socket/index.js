export function registerSocketHandlers(io, drawCoordinator) {
  io.on('connection', async (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    try {
      socket.emit('draw:state', await drawCoordinator.getState());
    } catch (error) {
      console.error('Não foi possível enviar o estado inicial:', error);
      socket.emit('draw:error', { message: 'Não foi possível carregar o sorteio.' });
    }

    socket.on('disconnect', (reason) => {
      console.log(`Cliente desconectado: ${socket.id} (${reason})`);
    });
  });
}
