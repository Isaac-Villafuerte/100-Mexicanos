import express from 'express';

export function gameRoutes(deps) {
  const router = express.Router();

  // Create new game
  router.post('/', async (req, res, next) => {
    try {
      const { title, targetScore, teamAName, teamBName } = req.body;
      
      const game = await deps.createGameUseCase.execute({
        title,
        targetScore,
        teamAName,
        teamBName
      });

      res.status(201).json({ game });
    } catch (error) {
      next(error);
    }
  });

  // Get game state
  router.get('/:gameId/state', async (req, res, next) => {
    try {
      const { gameId } = req.params;
      
      const gameState = await deps.getGameStateUseCase.execute({ 
        gameId: parseInt(gameId) 
      });

      res.json({ gameState });
    } catch (error) {
      next(error);
    }
  });

  // Start next round
  router.post('/:gameId/next-round', async (req, res, next) => {
    try {
      const { gameId } = req.params;
      const { categoryIds, multiplier } = req.body;

      const result = await deps.startNextRoundUseCase.execute({
        gameId: parseInt(gameId),
        categoryIds,
        multiplier
      });

      // Emit socket event
      if (deps.io) {
        const gameState = await deps.getGameStateUseCase.execute({ 
          gameId: parseInt(gameId) 
        });
        deps.io.to(`game-${gameId}`).emit('GAME_STATE_UPDATED', gameState);
      }

      res.json({ result });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
