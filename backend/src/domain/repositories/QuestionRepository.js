// Interface for Question Repository
export class QuestionRepository {
  async create(question, answers) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async findByCategoryId(categoryId) {
    throw new Error('Method not implemented');
  }

  async findRandom(categoryIds = []) {
    throw new Error('Method not implemented');
  }

  async update(id, data) {
    throw new Error('Method not implemented');
  }

  async delete(id) {
    throw new Error('Method not implemented');
  }
}
