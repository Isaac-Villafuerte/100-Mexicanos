export class Question {
  constructor({ id, categoryId, text, isActive = true, answers = [] }) {
    this.id = id;
    this.categoryId = categoryId;
    this.text = text;
    this.isActive = isActive;
    this.answers = answers;
  }

  static create(data) {
    return new Question(data);
  }

  addAnswer(answer) {
    this.answers.push(answer);
  }

  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      text: this.text,
      isActive: this.isActive,
      answers: this.answers.map(a => a.toJSON ? a.toJSON() : a)
    };
  }
}
