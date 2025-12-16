export class ImportQuestionFromImageUseCase {
  constructor(imageQuestionExtractor, categoryRepository) {
    this.imageQuestionExtractor = imageQuestionExtractor;
    this.categoryRepository = categoryRepository;
  }

  async execute({ imagePath, autoDetectCategory = false }) {
    // Extract data from image using AI
    const extracted = await this.imageQuestionExtractor.extract(imagePath);

    let categoryId = null;

    // If auto-detect is enabled and category name was extracted
    if (autoDetectCategory && extracted.categoryName) {
      const categories = await this.categoryRepository.findAll();
      const matchingCategory = categories.find(
        cat => cat.name.toLowerCase() === extracted.categoryName.toLowerCase()
      );
      
      if (matchingCategory) {
        categoryId = matchingCategory.id;
      }
    }

    return {
      question: extracted.question,
      categoryId,
      categoryName: extracted.categoryName,
      answers: extracted.answers
    };
  }
}
