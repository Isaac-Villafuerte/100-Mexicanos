export class ImportQuestionFromImageUseCase {
  constructor(imageQuestionExtractor, categoryRepository) {
    this.imageQuestionExtractor = imageQuestionExtractor;
    this.categoryRepository = categoryRepository;
  }

  /**
   * Extract questions from an image
   * @param {Object} params
   * @param {string} params.imagePath - Path to the uploaded image
   * @returns {Promise<{questions: Array, categories: Array}>}
   */
  async execute({ imagePath }) {
    // Get existing categories to pass to AI for matching
    const existingCategories = await this.categoryRepository.findAll();
    
    // Extract data from image using AI (now returns array of questions)
    const extractedQuestions = await this.imageQuestionExtractor.extract(
      imagePath,
      existingCategories.map(c => ({ id: c.id, name: c.name, description: c.description }))
    );

    // Return questions with category info for frontend editing
    return {
      questions: extractedQuestions,
      existingCategories: existingCategories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description
      }))
    };
  }
}
