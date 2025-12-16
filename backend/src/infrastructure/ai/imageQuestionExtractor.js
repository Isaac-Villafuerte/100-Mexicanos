import OpenAI from 'openai';
import fs from 'fs';
import { config } from '../../config/env.js';

/**
 * AI Service for extracting questions from images
 * Uses OpenAI Vision API (gpt-4o) to extract 1-4 question cards from Family Feud images
 */
export class ImageQuestionExtractor {
  constructor() {
    if (config.openai.apiKey) {
      this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    } else {
      this.openai = null;
      console.warn('[ImageQuestionExtractor] No OPENAI_API_KEY configured. Using stub mode.');
    }
  }

  /**
   * Extract question data from an image
   * @param {string} imagePath - Path to the uploaded image
   * @param {Array<{id: number, name: string, description?: string}>} existingCategories - Existing categories from DB
   * @returns {Promise<Array<{question: string, category: {id?: number, name: string, description?: string, isNew: boolean}, answers: Array<{text: string, points: number}>}>>}
   */
  async extract(imagePath, existingCategories = []) {
    if (!this.openai) {
      return this._stubExtract(imagePath);
    }

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this._getMimeType(imagePath);

      const categoriesContext = existingCategories.length > 0
        ? `Categorías existentes en la base de datos:\n${existingCategories.map(c => `- "${c.name}"${c.description ? `: ${c.description}` : ''}`).join('\n')}`
        : 'No hay categorías existentes en la base de datos.';

      const systemPrompt = `Eres un experto en extraer información de imágenes del juego "100 Mexicanos Dijeron" (Family Feud mexicano).

La imagen puede contener de 1 a 4 tarjetas de preguntas. Cada tarjeta tiene:
- Una pregunta
- De 1 a 8 respuestas con sus puntos asociados

Tu tarea:
1. Extraer TODAS las preguntas visibles (1-4 tarjetas)
2. Para cada pregunta, extraer todas las respuestas con sus puntos
3. Asignar una categoría a cada pregunta

${categoriesContext}

Para las categorías:
- Si la pregunta encaja bien en una categoría existente, usa esa categoría (isNew: false, incluye el nombre exacto)
- Si ninguna categoría existente aplica o no encaja o no hay, propón una nueva categoría con nombre y descripción breve (isNew: true)

IMPORTANTE: Responde SOLO con un JSON válido, sin markdown, sin explicaciones adicionales.

Formato de respuesta JSON:
{
  "questions": [
    {
      "question": "texto de la pregunta",
      "category": {
        "name": "nombre de categoría",
        "description": "descripción breve (solo si isNew es true)",
        "isNew": false
      },
      "answers": [
        { "text": "respuesta 1", "points": 35 },
        { "text": "respuesta 2", "points": 28 }
      ]
    }
  ]
}`;

      console.log('[ImageQuestionExtractor] System Prompt:', systemPrompt);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extrae todas las preguntas y respuestas de esta imagen. Recuerda responder SOLO con JSON válido.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  // detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1
      });

      const content = response.choices[0].message.content;
      
      // Parse JSON response (remove potential markdown code blocks)
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Map category IDs for existing categories
      const questionsWithCategoryIds = parsed.questions.map(q => {
        if (!q.category.isNew) {
          const existingCat = existingCategories.find(
            c => c.name.toLowerCase() === q.category.name.toLowerCase()
          );
          if (existingCat) {
            q.category.id = existingCat.id;
          } else {
            // Category name didn't match exactly, mark as new
            q.category.isNew = true;
            q.category.description = q.category.description || `Categoría para preguntas sobre ${q.category.name.toLowerCase()}`;
          }
        }
        return q;
      });

      console.log('[ImageQuestionExtractor] AI Response:', JSON.stringify(questionsWithCategoryIds, null, 2));
      return questionsWithCategoryIds;

    } catch (error) {
      console.error('[ImageQuestionExtractor] Error:', error);
      throw new Error(`Error al procesar la imagen con IA: ${error.message}`);
    }
  }

  _getMimeType(filePath) {
    const ext = filePath.toLowerCase().split('.').pop();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  _stubExtract(imagePath) {
    console.log('[AI STUB] Extracting questions from image:', imagePath);
    
    return [
      {
        question: '¿Qué haces cuando estás aburrido?',
        category: {
          name: 'Entretenimiento',
          description: 'Preguntas sobre actividades de ocio y diversión',
          isNew: true
        },
        answers: [
          { text: 'Ver televisión', points: 35 },
          { text: 'Usar el celular', points: 28 },
          { text: 'Dormir', points: 15 },
          { text: 'Salir a caminar', points: 12 },
          { text: 'Leer', points: 10 }
        ]
      }
    ];
  }
}
