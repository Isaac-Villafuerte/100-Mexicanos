export class AssignRoundPointsUseCase {
  constructor(gameRepository, questionRepository) {
    this.gameRepository = gameRepository;
    this.questionRepository = questionRepository;
  }

  async execute({ roundId, winnerTeam }) {
    if (winnerTeam !== 'A' && winnerTeam !== 'B') {
      throw new Error('Invalid team');
    }

    const round = await this.gameRepository.findRoundById(roundId);
    if (!round) {
      throw new Error('Round not found');
    }

    const question = await this.questionRepository.findById(round.questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Calculate points from revealed answers
    const roundScore = round.calculateRoundScore(question.answers);

    // Update game scores
    const game = await this.gameRepository.findById(round.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    game.addScoreToTeam(winnerTeam, roundScore);

    await this.gameRepository.update(game.id, {
      teamAScore: game.teamAScore,
      teamBScore: game.teamBScore
    });

    return { game, roundScore, winnerTeam };
  }
}
