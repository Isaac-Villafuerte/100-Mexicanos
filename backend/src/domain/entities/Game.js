export class Game {
  constructor({
    id,
    title,
    targetScore,
    status = 'pending',
    currentRoundNumber = 0,
    teamAName,
    teamBName,
    teamAScore = 0,
    teamBScore = 0
  }) {
    this.id = id;
    this.title = title;
    this.targetScore = targetScore;
    this.status = status; // 'pending', 'running', 'finished'
    this.currentRoundNumber = currentRoundNumber;
    this.teamAName = teamAName;
    this.teamBName = teamBName;
    this.teamAScore = teamAScore;
    this.teamBScore = teamBScore;
  }

  static create(data) {
    return new Game(data);
  }

  start() {
    this.status = 'running';
  }

  finish() {
    this.status = 'finished';
  }

  addScoreToTeam(team, points) {
    if (team === 'A') {
      this.teamAScore += points;
    } else if (team === 'B') {
      this.teamBScore += points;
    }
  }

  incrementRound() {
    this.currentRoundNumber += 1;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      targetScore: this.targetScore,
      status: this.status,
      currentRoundNumber: this.currentRoundNumber,
      teamAName: this.teamAName,
      teamBName: this.teamBName,
      teamAScore: this.teamAScore,
      teamBScore: this.teamBScore
    };
  }
}
