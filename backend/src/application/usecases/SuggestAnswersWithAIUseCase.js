export class SuggestAnswersWithAIUseCase {
  constructor(answersSuggester) {
    this.answersSuggester = answersSuggester;
  }

  async execute({ question, category = null }) {
    const result = await this.answersSuggester.suggest(question, category);
    return result;
  }
}
