import OpenAI from 'openai';
import fs from 'fs';
import { config } from '../../config/env.js';

/**
 * AI Service for extracting questions from images
 * Uses OpenAI Vision API (gpt-4o) with a 2-step process:
 * 1. Extract questions/answers from image (no categories)
 * 2. Categorize questions using text-only call (saves tokens)
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
      // PASO 1: Extracción de imagen (sin categorías)
      console.log('[ImageQuestionExtractor] PASO 1: Extrayendo preguntas de imagen...');
      const extractedQuestions = await this._extractFromImage(imagePath);
      console.log('[ImageQuestionExtractor] PASO 1 completado:', extractedQuestions.length, 'preguntas extraídas');

      // PASO 2: Categorización por texto
      console.log('[ImageQuestionExtractor] PASO 2: Categorizando preguntas...');
      let categorizedQuestions;
      try {
        categorizedQuestions = await this._categorizeQuestions(extractedQuestions, existingCategories);
        console.log('[ImageQuestionExtractor] PASO 2 completado');
      } catch (catError) {
        console.error('[ImageQuestionExtractor] Error en PASO 2, usando fallback:', catError.message);
        categorizedQuestions = this._fallbackCategories(extractedQuestions);
      }

      console.log('[ImageQuestionExtractor] Resultado final:', JSON.stringify(categorizedQuestions, null, 2));
      return categorizedQuestions;

    } catch (error) {
      console.error('[ImageQuestionExtractor] Error:', error);
      throw new Error(`Error al procesar la imagen con IA: ${error.message}`);
    }
  }

  /**
   * PASO 1: Extract questions and answers from image (no categories)
   */
  async _extractFromImage(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = this._getMimeType(imagePath);

    const systemPrompt = this._buildExtractPrompt();

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extrae todas las preguntas y respuestas de esta imagen. Responde SOLO con JSON válido.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    const parsed = this._parseJson(content);
    return parsed.questions || [];
  }

  /**
   * PASO 2: Categorize questions using text-only call
   */
  async _categorizeQuestions(extractedQuestions, existingCategories) {
    if (extractedQuestions.length === 0) {
      return [];
    }

    const compactText = this._toCompactQuestionsText(extractedQuestions);
    const systemPrompt = this._buildCategorizePrompt(existingCategories);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: compactText }
      ],
      max_tokens: 2000,
      temperature: 0.6
    });

    const content = response.choices[0].message.content;
    const parsed = this._parseJson(content);
    const categories = parsed.categories || [];

    // Merge categories with extracted questions
    return this._mergeCategories(extractedQuestions, categories, existingCategories);
  }

  /**
   * Build prompt for PASO 1: Extraction only (no categories)
   */
  _buildExtractPrompt() {
    return `Eres un experto en extraer información de imágenes del juego "100 Mexicanos Dijeron" (Family Feud mexicano).

La imagen puede contener de 1 a 4 tarjetas de preguntas. Cada tarjeta tiene:
- Una pregunta
- De 1 a 8 respuestas con sus puntos asociados

Tu tarea: Extraer TODAS las preguntas visibles con sus respuestas y puntos.
NO asignes categorías, solo extrae la información visible.

IMPORTANTE: Responde SOLO con JSON válido, sin markdown, sin explicaciones.

Formato de respuesta:
{
  "questions": [
    {
      "question": "texto de la pregunta",
      "answers": [
        { "text": "respuesta 1", "points": 35 },
        { "text": "respuesta 2", "points": 28 }
      ]
    }
  ]
}`;
  }

  /**
   * Build prompt for PASO 2: Categorization
   */
  _buildCategorizePrompt(existingCategories) {
    const catList = existingCategories.length > 0
      ? existingCategories.map(c => `- [${c.id}] ${c.name}${c.description ? `: ${c.description}` : ''}`).join('\n')
      : '(No hay categorías existentes)';

    return `Eres un experto en categorizar preguntas del juego "100 Mexicanos Dijeron" (Family Feud mexicano).

CATEGORÍAS EXISTENTES:
${catList}

Objetivo: categorías tipo "modo de juego" (AMPLIAS y reutilizables). Una categoría debe poder agrupar muchas preguntas (ideal: 10+). Evita categorías hiper-específicas (que solo sirvan para 1-3 preguntas). Si la idea suena a respuesta/objeto ("tacos", "WhatsApp", "suegra"), sube al tema padre ("Comida y cocina", "Tecnología y redes", "Familia y relaciones").

Tu tarea: Asignar una categoría a cada pregunta.

REGLAS IMPORTANTES:
1. Reusar categoría existente SOLO si el encaje es muy alto (>=85% de relevancia)
2. NO uses categorías genéricas como "General", "Variado", "Otros" si existe una más específica
3. Si ninguna categoría existente aplica bien, propón una NUEVA con:
   - name: 1-4 palabras, específico
   - description: 1 frase breve

Responde SOLO con JSON válido:
{
  "categories": [
    { "index": 0, "category": { "id": 18, "name": "Comida", "isNew": false } },
    { "index": 1, "category": { "name": "Actividades de ocio", "description": "Cosas que hace la gente en su tiempo libre", "isNew": true } }
  ]
}`;
  }

  /**
   * Convert extracted questions to compact text format for PASO 2
   */
  _toCompactQuestionsText(extractedQuestions) {
    const lines = ['PREGUNTAS A CATEGORIZAR:'];
    extractedQuestions.forEach((q, idx) => {
      const answersStr = q.answers.map(a => `${a.text}(${a.points})`).join('; ');
      lines.push(`#${idx} ${q.question} | ${answersStr}`);
    });
    return lines.join('\n');
  }

  /**
   * Merge categories from PASO 2 with extracted questions
   */
  _mergeCategories(extractedQuestions, categories, existingCategories) {
    return extractedQuestions.map((q, idx) => {
      const catInfo = categories.find(c => c.index === idx);
      let category;

      if (catInfo && catInfo.category) {
        category = { ...catInfo.category };

        // If isNew is false but no id, try to find by name
        if (!category.isNew && !category.id) {
          const match = existingCategories.find(
            c => c.name.toLowerCase() === category.name.toLowerCase()
          );
          if (match) {
            category.id = match.id;
          } else {
            // Convert to new if no match found
            category.isNew = true;
            category.description = category.description || `Categoría para preguntas sobre ${category.name.toLowerCase()}`;
          }
        }
      } else {
        // Fallback if no category assigned
        category = {
          name: 'Sin categoría',
          description: 'Preguntas sin categoría asignada',
          isNew: true
        };
      }

      return {
        question: q.question,
        category,
        answers: q.answers
      };
    });
  }

  /**
   * Fallback categories if PASO 2 fails
   */
  _fallbackCategories(extractedQuestions) {
    return extractedQuestions.map(q => ({
      question: q.question,
      category: {
        name: 'Sin categoría',
        description: 'Categoría temporal - error en categorización automática',
        isNew: true
      },
      answers: q.answers
    }));
  }

  /**
   * Parse JSON response, handling markdown code blocks
   */
  _parseJson(content) {
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return JSON.parse(jsonStr);
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
