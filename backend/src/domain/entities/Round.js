export class Round {
  constructor({
    id,
    gameId,
    questionId,
    roundNumber,
    multiplier = 1,
    teamInTurn = 'A',
    teamARoundPoints = 0,
    teamBRoundPoints = 0,
    state = 'not_started',
    strikesTeamA = 0,
    strikesTeamB = 0,
    answerStates = []
  }) {
    this.id = id;
    this.gameId = gameId;
    this.questionId = questionId;
    this.roundNumber = roundNumber;
    this.multiplier = multiplier;
    this.teamInTurn = teamInTurn; // 'A' or 'B'
    this.teamARoundPoints = teamARoundPoints;
    this.teamBRoundPoints = teamBRoundPoints;
    this.state = state; // 'not_started', 'in_progress', 'finished'
    this.strikesTeamA = strikesTeamA;
    this.strikesTeamB = strikesTeamB;
    this.answerStates = answerStates;
  }

  static create(data) {
    return new Round(data);
  }

  start() {
    this.state = 'in_progress';
  }

  finish() {
    this.state = 'finished';
  }

  addStrike(team) {
    if (team === 'A' && this.strikesTeamA < 3) {
      this.strikesTeamA += 1;
    } else if (team === 'B' && this.strikesTeamB < 3) {
      this.strikesTeamB += 1;
    }
  }

  removeStrike(team) {
    if (team === 'A' && this.strikesTeamA > 0) {
      this.strikesTeamA -= 1;
    } else if (team === 'B' && this.strikesTeamB > 0) {
      this.strikesTeamB -= 1;
    }
  }

  setTeamInTurn(team) {
    this.teamInTurn = team;
  }

  calculateRoundScore(answers) {
    let total = 0;
    this.answerStates.forEach(state => {
      if (state.isRevealed) {
        const answer = answers.find(a => a.id === state.questionAnswerId);
        if (answer) {
          total += answer.points;
        }
      }
    });
    return total * this.multiplier;
  }

  toJSON() {
    return {
      id: this.id,
      gameId: this.gameId,
      questionId: this.questionId,
      roundNumber: this.roundNumber,
      multiplier: this.multiplier,
      teamInTurn: this.teamInTurn,
      teamARoundPoints: this.teamARoundPoints,
      teamBRoundPoints: this.teamBRoundPoints,
      state: this.state,
      strikesTeamA: this.strikesTeamA,
      strikesTeamB: this.strikesTeamB,
      answerStates: this.answerStates
    };
  }
}
