import { Round } from '../../domain/entities/Round.js';

export class StartNextRoundUseCase {
  constructor(gameRepository, questionRepository) {
    this.gameRepository = gameRepository;
    this.questionRepository = questionRepository;
  }

  async execute({ gameId, categoryIds = [], multiplier = 1 }) {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Finish any current active round before starting a new one
    const currentRound = await this.gameRepository.findCurrentRound(gameId);
    if (currentRound) {
      await this.gameRepository.updateRound(currentRound.id, { state: 'finished' });
    }

    // Get question IDs already used in this game to avoid repeats
    const usedQuestionIds = await this.gameRepository.getUsedQuestionIds(gameId);

    // Get a random question excluding already used ones
    const question = await this.questionRepository.findRandom(categoryIds, usedQuestionIds);
    if (!question) {
      throw new Error('No hay preguntas disponibles (todas ya fueron usadas en este juego)');
    }

    // Create new round
    const roundNumber = game.currentRoundNumber + 1;
    const round = Round.create({
      gameId,
      questionId: question.id,
      roundNumber,
      multiplier,
      teamInTurn: 'A',
      state: 'in_progress'
    });

    const roundId = await this.gameRepository.createRound(round);

    // Initialize answer states (all hidden)
    for (const answer of question.answers) {
      await this.gameRepository.setAnswerState(roundId, answer.id, false);
    }

    // Update game
    await this.gameRepository.update(gameId, {
      currentRoundNumber: roundNumber,
      status: 'running'
    });

    return { roundId, question };
  }
}
