export class AddStrikeUseCase {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  async execute({ roundId, team, remove = false }) {
    const round = await this.gameRepository.findRoundById(roundId);
    if (!round) {
      throw new Error('Round not found');
    }

    if (remove) {
      round.removeStrike(team);
    } else {
      round.addStrike(team);
    }

    await this.gameRepository.updateRound(roundId, {
      strikesTeamA: round.strikesTeamA,
      strikesTeamB: round.strikesTeamB
    });

    return round;
  }
}
