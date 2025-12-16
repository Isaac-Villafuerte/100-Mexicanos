export class SetTeamInTurnUseCase {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  async execute({ roundId, team }) {
    if (team !== 'A' && team !== 'B') {
      throw new Error('Invalid team');
    }

    await this.gameRepository.updateRound(roundId, {
      teamInTurn: team
    });

    return { roundId, team };
  }
}
