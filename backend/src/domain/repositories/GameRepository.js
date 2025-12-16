// Interface for Game Repository
export class GameRepository {
  async create(game) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async update(id, data) {
    throw new Error('Method not implemented');
  }

  async createRound(round) {
    throw new Error('Method not implemented');
  }

  async findRoundById(roundId) {
    throw new Error('Method not implemented');
  }

  async findCurrentRound(gameId) {
    throw new Error('Method not implemented');
  }

  async updateRound(roundId, data) {
    throw new Error('Method not implemented');
  }

  async setAnswerState(roundId, answerId, isRevealed) {
    throw new Error('Method not implemented');
  }

  async getAnswerStates(roundId) {
    throw new Error('Method not implemented');
  }
}
