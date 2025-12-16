import { Question } from '../../domain/entities/Question.js';
import { Answer } from '../../domain/entities/Answer.js';

export class CreateQuestionUseCase {
  constructor(questionRepository) {
    this.questionRepository = questionRepository;
  }

  async execute({ categoryId, text, answers }) {
    if (!answers || answers.length === 0) {
      throw new Error('At least one answer is required');
    }

    if (answers.length > 8) {
      throw new Error('Maximum 8 answers allowed');
    }

    const question = Question.create({
      categoryId,
      text,
      isActive: true
    });

    const answerEntities = answers.map((ans, index) => 
      Answer.create({
        text: ans.text,
        points: ans.points,
        position: ans.position || (index + 1)
      })
    );

    const questionId = await this.questionRepository.create(question, answerEntities);
    
    return { questionId };
  }
}
