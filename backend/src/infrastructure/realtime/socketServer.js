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

  // Estado de botonera por juego: { gameId: { locked: boolean, lockedUntil: number, winner: string|null } }
  const buzzerState = new Map();

  // Tema visual por juego (en memoria)
  const gameThemes = new Map();

  const getBuzzerState = (gameId) => {
    if (!buzzerState.has(gameId)) {
      buzzerState.set(gameId, { locked: false, lockedUntil: 0, winner: null });
    }
    return buzzerState.get(gameId);
  };

  const BUZZER_LOCK_DURATION = 5000; // 5 segundos de bloqueo

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

      // Send current theme
      const currentTheme = gameThemes.get(gameId) || 'carnival-dark';
      socket.emit('THEME_CHANGED', { theme: currentTheme });
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

    // Reset game: update scores, team names, clear current round
    socket.on('RESET_GAME', async (data, callback) => {
      const { gameId, teamAScore, teamBScore, teamAName, teamBName } = data;
      console.log(`[RESET_GAME] Received for game ${gameId}:`, { teamAScore, teamBScore, teamAName, teamBName });
      try {
        const parsedGameId = parseInt(gameId);

        // Finish all active rounds FIRST (before updating game)
        let activeRound = await dependencies.gameRepository.findCurrentRound(parsedGameId);
        let finishedCount = 0;
        while (activeRound) {
          console.log(`[RESET_GAME] Finishing round ${activeRound.id} (state: ${activeRound.state})`);
          await dependencies.gameRepository.updateRound(activeRound.id, { state: 'finished' });
          finishedCount++;
          activeRound = await dependencies.gameRepository.findCurrentRound(parsedGameId);
        }
        console.log(`[RESET_GAME] Finished ${finishedCount} active rounds`);

        // Now update the game data
        const updateData = {
          status: 'pending',
          currentRoundNumber: 0
        };
        if (teamAScore !== undefined) updateData.teamAScore = parseInt(teamAScore);
        if (teamBScore !== undefined) updateData.teamBScore = parseInt(teamBScore);
        if (teamAName !== undefined) updateData.teamAName = teamAName;
        if (teamBName !== undefined) updateData.teamBName = teamBName;

        console.log(`[RESET_GAME] Updating game ${parsedGameId}:`, updateData);
        await dependencies.gameRepository.update(parsedGameId, updateData);

        // Get fresh state and broadcast
        const gameState = await dependencies.getGameStateUseCase.execute({
          gameId: parsedGameId
        });

        console.log(`[RESET_GAME] Broadcasting new state. currentRound: ${gameState.currentRound ? 'exists' : 'null'}`);
        io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
        io.to(`game-${gameId}`).emit('GAME_RESET');

        if (typeof callback === 'function') callback({ success: true });
      } catch (error) {
        console.error('[RESET_GAME] Error:', error);
        socket.emit('ERROR', { message: error.message });
        if (typeof callback === 'function') callback({ success: false, error: error.message });
      }
    });

    // Change board theme
    socket.on('CHANGE_THEME', ({ gameId, theme }) => {
      gameThemes.set(gameId, theme);
      io.to(`game-${gameId}`).emit('THEME_CHANGED', { theme });
      console.log(`[THEME] Game ${gameId} theme changed to: ${theme}`);
    });

    // BUZZER: Presionar botón del equipo
    socket.on('BUZZER_PRESS', ({ gameId, team }) => {
      const state = getBuzzerState(gameId);
      const now = Date.now();

      // Si está bloqueado y no ha pasado el tiempo, ignorar
      if (state.locked && now < state.lockedUntil) {
        console.log(`Buzzer bloqueado para game ${gameId}, equipo ${team} ignorado`);
        return;
      }

      // Si ya pasó el tiempo de bloqueo, resetear
      if (state.locked && now >= state.lockedUntil) {
        state.locked = false;
        state.winner = null;
      }

      // Primer equipo en presionar gana
      if (!state.locked) {
        state.locked = true;
        state.lockedUntil = now + BUZZER_LOCK_DURATION;
        state.winner = team;

        console.log(`Buzzer: Equipo ${team} ganó en game ${gameId}`);

        // Emitir evento de ganador a todos en la sala
        io.to(`game-${gameId}`).emit('BUZZER_WINNER', { 
          team, 
          lockDuration: BUZZER_LOCK_DURATION 
        });

        // Programar desbloqueo automático
        setTimeout(() => {
          const currentState = getBuzzerState(gameId);
          if (currentState.lockedUntil <= Date.now()) {
            currentState.locked = false;
            currentState.winner = null;
            io.to(`game-${gameId}`).emit('BUZZER_RESET');
            console.log(`Buzzer reseteado para game ${gameId}`);
          }
        }, BUZZER_LOCK_DURATION);
      }
    });

    // BUZZER: Reset manual (para el host)
    socket.on('BUZZER_MANUAL_RESET', ({ gameId }) => {
      const state = getBuzzerState(gameId);
      state.locked = false;
      state.lockedUntil = 0;
      state.winner = null;
      io.to(`game-${gameId}`).emit('BUZZER_RESET');
      console.log(`Buzzer reseteado manualmente para game ${gameId}`);
    });

    // BUZZER: Obtener estado actual
    socket.on('BUZZER_GET_STATE', ({ gameId }) => {
      const state = getBuzzerState(gameId);
      const now = Date.now();
      const isLocked = state.locked && now < state.lockedUntil;
      socket.emit('BUZZER_STATE', {
        locked: isLocked,
        winner: isLocked ? state.winner : null,
        remainingTime: isLocked ? state.lockedUntil - now : 0
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
