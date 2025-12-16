import { Game } from '../../domain/entities/Game.js';

export class CreateGameUseCase {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  async execute({ title, targetScore, teamAName, teamBName }) {
    const game = Game.create({
      title: title || '100 Mexicanos Dijeron',
      targetScore: targetScore || 300,
      teamAName,
      teamBName,
      status: 'pending',
      currentRoundNumber: 0,
      teamAScore: 0,
      teamBScore: 0
    });

    const createdGame = await this.gameRepository.create(game);
    return createdGame;
  }
}
