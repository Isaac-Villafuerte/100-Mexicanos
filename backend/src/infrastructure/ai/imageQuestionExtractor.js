/**
 * AI Service for extracting questions from images
 * This is a STUB implementation. Connect to OpenAI Vision API or similar here.
 */

export class ImageQuestionExtractor {
  /**
   * Extract question data from an image
   * @param {string} imagePath - Path to the uploaded image
   * @returns {Promise<{question: string, categoryName?: string, answers: Array<{text: string, points: number}>}>}
   */
  async extract(imagePath) {
    // TODO: Integrate with OpenAI Vision API or similar
    // Example call:
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4-vision-preview",
    //   messages: [{
    //     role: "user",
    //     content: [
    //       { type: "text", text: "Extract the question and answers from this Family Feud board..." },
    //       { type: "image_url", image_url: { url: imageUrl } }
    //     ]
    //   }]
    // });

    console.log('[AI STUB] Extracting question from image:', imagePath);

    // Return dummy data for now
    return {
      question: '¿Qué haces cuando estás aburrido?',
      categoryName: 'Entretenimiento',
      answers: [
        { text: 'Ver televisión', points: 35 },
        { text: 'Usar el celular', points: 28 },
        { text: 'Dormir', points: 15 },
        { text: 'Salir a caminar', points: 12 },
        { text: 'Leer', points: 10 }
      ]
    };
  }
}
