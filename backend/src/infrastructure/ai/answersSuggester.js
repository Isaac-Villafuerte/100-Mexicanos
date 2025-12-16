import OpenAI from 'openai';
import { config } from '../../config/env.js';

/**
 * AI Service for suggesting answers to questions
 * Uses OpenAI API to generate Family Feud style answers
 */
export class AnswersSuggester {
  constructor() {
    if (config.openai.apiKey) {
      this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    } else {
      this.openai = null;
      console.warn('[AnswersSuggester] No OPENAI_API_KEY configured. Using stub mode.');
    }
  }

  /**
   * Suggest possible answers for a question
   * @param {string} question - The question text
   * @param {string} [category] - Optional category context
   * @returns {Promise<{answers: Array<{text: string, points: number}>}>}
   */
  async suggest(question, category = null) {
    if (!this.openai) {
      return this._stubSuggest(question, category);
    }

    try {
      const categoryContext = category ? `\nCategoría: ${category}` : '';

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en crear preguntas estilo "100 Mexicanos Dijeron" (Family Feud mexicano).

Tu tarea es generar las respuestas más populares que la gente daría a una pregunta de encuesta.

Reglas:
- Genera entre 5 y 8 respuestas
- Las respuestas deben ser cortas (1-4 palabras idealmente)
- Los puntos deben sumar exactamente 100
- Ordena las respuestas de mayor a menor puntaje
- La respuesta más popular debe tener entre 25-40 puntos
- Las respuestas menos populares pueden tener entre 5-15 puntos
- Las respuestas deben reflejar lo que respondería la mayoría de mexicanos

IMPORTANTE: Responde SOLO con JSON válido, sin markdown, sin explicaciones.

Formato:
{
  "answers": [
    { "text": "respuesta", "points": 35 },
    { "text": "otra respuesta", "points": 25 }
  ]
}`
          },
          {
            role: 'user',
            content: `Pregunta: ${question}${categoryContext}\n\nGenera las respuestas más populares.`
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      
      // Parse JSON response
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);
      return parsed;

    } catch (error) {
      console.error('[AnswersSuggester] Error:', error);
      throw new Error(`Error al obtener sugerencias de IA: ${error.message}`);
    }
  }

  _stubSuggest(question, category) {
    console.log('[AI STUB] Suggesting answers for question:', question, 'category:', category);

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
