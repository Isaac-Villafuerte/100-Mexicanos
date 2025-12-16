import express from 'express';
import multer from 'multer';
import path from 'path';

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export function adminRoutes(deps) {
  const router = express.Router();

  // ===== CATEGORIES =====
  
  // Get all categories
  router.get('/categories', async (req, res, next) => {
    try {
      const categories = await deps.categoryRepository.findAll();
      res.json({ categories });
    } catch (error) {
      next(error);
    }
  });

  // Create category
  router.post('/categories', async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const category = await deps.categoryRepository.create({ 
        name, 
        description 
      });
      res.status(201).json({ category });
    } catch (error) {
      next(error);
    }
  });

  // Update category
  router.put('/categories/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      await deps.categoryRepository.update(parseInt(id), { 
        name, 
        description, 
        isActive 
      });
      res.json({ message: 'Category updated' });
    } catch (error) {
      next(error);
    }
  });

  // Delete category
  router.delete('/categories/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      await deps.categoryRepository.delete(parseInt(id));
      res.json({ message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  });

  // ===== QUESTIONS =====

  // Get questions with pagination (ordered by creation date, newest first)
  router.get('/questions', async (req, res, next) => {
    try {
      const { categoryId, page = 1, limit = 10 } = req.query;
      
      const result = await deps.questionRepository.findAllPaginated({
        page: parseInt(page),
        limit: parseInt(limit),
        categoryId: categoryId ? parseInt(categoryId) : null
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Get single question with answers
  router.get('/questions/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const question = await deps.questionRepository.findById(parseInt(id));
      
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      res.json({ question });
    } catch (error) {
      next(error);
    }
  });

  // Update question with answers
  router.put('/questions/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { text, categoryId, isActive, answers } = req.body;
      
      await deps.questionRepository.updateWithAnswers(
        parseInt(id),
        { text, categoryId, isActive },
        answers?.map((ans, idx) => ({
          text: ans.text,
          points: parseInt(ans.points),
          position: idx + 1
        }))
      );
      
      res.json({ message: 'Question updated' });
    } catch (error) {
      next(error);
    }
  });

  // Create question
  router.post('/questions', async (req, res, next) => {
    try {
      const { categoryId, text, answers } = req.body;
      
      const result = await deps.createQuestionUseCase.execute({
        categoryId: parseInt(categoryId),
        text,
        answers
      });

      res.status(201).json({ result });
    } catch (error) {
      next(error);
    }
  });

  // Import questions from image (supports 1-4 question cards)
  router.post('/questions/import-from-image', upload.single('image'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const result = await deps.importQuestionFromImageUseCase.execute({
        imagePath: req.file.path
      });

      res.json({ result });
    } catch (error) {
      next(error);
    }
  });

  // Save multiple questions (with category creation if needed)
  router.post('/questions/bulk', async (req, res, next) => {
    try {
      const { questions } = req.body;
      
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'No questions provided' });
      }

      const results = [];

      for (const q of questions) {
        let categoryId = q.categoryId || q.category?.id;

        // If category is new, create it first
        if (q.category?.isNew && q.category?.name) {
          const newCategory = await deps.categoryRepository.create({
            name: q.category.name,
            description: q.category.description || '',
            isActive: true
          });
          categoryId = newCategory.id;
        }

        // Validate categoryId exists
        if (!categoryId) {
          throw new Error(`La pregunta "${q.question}" no tiene categoría válida`);
        }

        // Create the question
        const result = await deps.createQuestionUseCase.execute({
          categoryId: parseInt(categoryId),
          text: q.question,
          answers: q.answers.map((ans, idx) => ({
            text: ans.text,
            points: parseInt(ans.points),
            position: idx + 1
          }))
        });

        results.push(result);
      }

      res.status(201).json({ results, count: results.length });
    } catch (error) {
      next(error);
    }
  });

  // Suggest answers with AI
  router.post('/questions/suggest-answers', async (req, res, next) => {
    try {
      const { question, category } = req.body;

      const result = await deps.suggestAnswersWithAIUseCase.execute({
        question,
        category
      });

      res.json({ result });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
