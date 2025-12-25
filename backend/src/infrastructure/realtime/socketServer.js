import { Server } from 'socket.io';
import { config } from '../../config/env.js';

export function createSocketServer(httpServer, dependencies) {
  // Configuración CORS para Socket.IO
  const corsOrigin = config.corsOrigins.length > 0 
    ? config.corsOrigins 
    : (config.nodeEnv === 'development' ? '*' : false);

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join game room
    socket.on('JOIN_GAME', async ({ gameId, role }) => {
      const room = `game-${gameId}`;
      socket.join(room);
      console.log(`Client ${socket.id} joined ${room} as ${role}`);

      // Send current game state
      try {
        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        socket.emit('GAME_STATE_UPDATED', gameState);
      } catch (error) {
        console.error('Error getting game state:', error);
      }
    });

    // Set team in turn
    socket.on('SET_TEAM_IN_TURN', async ({ gameId, roundId, team }) => {
      try {
        await dependencies.setTeamInTurnUseCase.execute({ 
          roundId: parseInt(roundId), 
          team 
        });

        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
      } catch (error) {
        console.error('Error setting team in turn:', error);
        socket.emit('ERROR', { message: error.message });
      }
    });

    // Reveal answer
    socket.on('REVEAL_ANSWER', async ({ gameId, roundId, answerId }) => {
      try {
        await dependencies.toggleAnswerUseCase.execute({
          roundId: parseInt(roundId),
          answerId: parseInt(answerId),
          isRevealed: true
        });

        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
        io.to(`game-${gameId}`).emit('ANSWER_REVEALED', { answerId });
      } catch (error) {
        console.error('Error revealing answer:', error);
        socket.emit('ERROR', { message: error.message });
      }
    });

    // Hide answer
    socket.on('HIDE_ANSWER', async ({ gameId, roundId, answerId }) => {
      try {
        await dependencies.toggleAnswerUseCase.execute({
          roundId: parseInt(roundId),
          answerId: parseInt(answerId),
          isRevealed: false
        });

        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
      } catch (error) {
        console.error('Error hiding answer:', error);
        socket.emit('ERROR', { message: error.message });
      }
    });

    // Add strike
    socket.on('ADD_STRIKE', async ({ gameId, roundId, team }) => {
      try {
        await dependencies.addStrikeUseCase.execute({
          roundId: parseInt(roundId),
          team,
          remove: false
        });

        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
        io.to(`game-${gameId}`).emit('STRIKE_ADDED', { team });
      } catch (error) {
        console.error('Error adding strike:', error);
        socket.emit('ERROR', { message: error.message });
      }
    });

    // Remove strike
    socket.on('REMOVE_STRIKE', async ({ gameId, roundId, team }) => {
      try {
        await dependencies.addStrikeUseCase.execute({
          roundId: parseInt(roundId),
          team,
          remove: true
        });

        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
      } catch (error) {
        console.error('Error removing strike:', error);
        socket.emit('ERROR', { message: error.message });
      }
    });

    // Assign round points
    socket.on('ASSIGN_ROUND_POINTS', async ({ gameId, roundId, winnerTeam }) => {
      try {
        await dependencies.assignRoundPointsUseCase.execute({
          roundId: parseInt(roundId),
          winnerTeam
        });

        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
        io.to(`game-${gameId}`).emit('ROUND_FINISHED', { winnerTeam });
      } catch (error) {
        console.error('Error assigning round points:', error);
        socket.emit('ERROR', { message: error.message });
      }
    });

    // Start next round
    socket.on('START_NEXT_ROUND', async ({ gameId, categoryIds, multiplier }) => {
      try {
        await dependencies.startNextRoundUseCase.execute({
          gameId: parseInt(gameId),
          categoryIds: categoryIds || [],
          multiplier: multiplier || 1
        });

        const gameState = await dependencies.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
        io.to(`game-${gameId}`).emit('ROUND_STARTED');
      } catch (error) {
        console.error('Error starting next round:', error);
        socket.emit('ERROR', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
