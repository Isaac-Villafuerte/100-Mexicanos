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

    // Get a random question
    const question = await this.questionRepository.findRandom(categoryIds);
    if (!question) {
      throw new Error('No questions available');
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
