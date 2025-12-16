/**
 * AI Service for suggesting answers to questions
 * This is a STUB implementation. Connect to OpenAI or similar LLM here.
 */

export class AnswersSuggester {
  /**
   * Suggest possible answers for a question
   * @param {string} question - The question text
   * @param {string} [category] - Optional category context
   * @returns {Promise<{answers: Array<{text: string, points: number}>}>}
   */
  async suggest(question, category = null) {
    // TODO: Integrate with OpenAI API or similar
    // Example call:
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{
    //     role: "system",
    //     content: "You are an expert at creating Family Feud style survey questions..."
    //   }, {
    //     role: "user",
    //     content: `Generate 5-8 most popular answers for: ${question}`
    //   }]
    // });

    console.log('[AI STUB] Suggesting answers for question:', question, 'category:', category);

    // Return dummy data for now
    return {
      answers: [
        { text: 'Respuesta sugerida 1', points: 40 },
        { text: 'Respuesta sugerida 2', points: 30 },
        { text: 'Respuesta sugerida 3', points: 15 },
        { text: 'Respuesta sugerida 4', points: 10 },
        { text: 'Respuesta sugerida 5', points: 5 }
      ]
    };
  }
}
