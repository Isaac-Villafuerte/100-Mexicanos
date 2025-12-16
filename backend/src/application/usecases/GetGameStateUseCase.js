export class GetGameStateUseCase {
  constructor(gameRepository, questionRepository) {
    this.gameRepository = gameRepository;
    this.questionRepository = questionRepository;
  }

  async execute({ gameId }) {
    const game = await this.gameRepository.findById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const currentRound = await this.gameRepository.findCurrentRound(gameId);
    
    let roundData = null;
    if (currentRound) {
      const question = await this.questionRepository.findById(currentRound.questionId);
      
      // Calculate current round score
      const roundScore = currentRound.calculateRoundScore(question.answers);

      // Map answers with reveal state
      const answers = question.answers.map(answer => {
        const state = currentRound.answerStates.find(
          s => s.questionAnswerId === answer.id
        );
        return {
          id: answer.id,
          position: answer.position,
          text: answer.text,
          points: answer.points,
          isRevealed: state ? state.isRevealed : false
        };
      });

      roundData = {
        id: currentRound.id,
        number: currentRound.roundNumber,
        questionId: question.id,
        questionText: question.text,
        categoryName: question.categoryName || '',
        multiplier: currentRound.multiplier,
        teamInTurn: currentRound.teamInTurn,
        answers,
        roundScore
      };
    }

    return {
      gameId: game.id,
      title: game.title,
      targetScore: game.targetScore,
      status: game.status,
      teamA: {
        name: game.teamAName,
        score: game.teamAScore,
        strikes: currentRound ? currentRound.strikesTeamA : 0
      },
      teamB: {
        name: game.teamBName,
        score: game.teamBScore,
        strikes: currentRound ? currentRound.strikesTeamB : 0
      },
      currentRound: roundData
    };
  }
}
