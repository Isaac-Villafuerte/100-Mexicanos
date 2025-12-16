export class Answer {
  constructor({ id, questionId, text, points, position }) {
    this.id = id;
    this.questionId = questionId;
    this.text = text;
    this.points = points;
    this.position = position;
  }

  static create(data) {
    return new Answer(data);
  }

  toJSON() {
    return {
      id: this.id,
      questionId: this.questionId,
      text: this.text,
      points: this.points,
      position: this.position
    };
  }
}
