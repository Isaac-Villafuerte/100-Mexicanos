export class ToggleAnswerUseCase {
  constructor(gameRepository) {
    this.gameRepository = gameRepository;
  }

  async execute({ roundId, answerId, isRevealed }) {
    await this.gameRepository.setAnswerState(roundId, answerId, isRevealed);
    return { roundId, answerId, isRevealed };
  }
}
