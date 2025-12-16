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

  // Get questions by category
  router.get('/questions', async (req, res, next) => {
    try {
      const { categoryId } = req.query;
      
      let questions;
      if (categoryId) {
        questions = await deps.questionRepository.findByCategoryId(parseInt(categoryId));
      } else {
        // Get all active categories and their questions
        const categories = await deps.categoryRepository.findAll();
        questions = [];
        for (const cat of categories) {
          const catQuestions = await deps.questionRepository.findByCategoryId(cat.id);
          questions.push(...catQuestions);
        }
      }
      
      res.json({ questions });
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

  // Import question from image
  router.post('/questions/import-from-image', upload.single('image'), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      const autoDetectCategory = req.body.autoDetectCategory === 'true';

      const result = await deps.importQuestionFromImageUseCase.execute({
        imagePath: req.file.path,
        autoDetectCategory
      });

      res.json({ result });
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
