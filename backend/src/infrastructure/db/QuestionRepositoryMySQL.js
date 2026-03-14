import { QuestionRepository } from '../../domain/repositories/QuestionRepository.js';
import { Question } from '../../domain/entities/Question.js';
import { Answer } from '../../domain/entities/Answer.js';
import { getPool } from './mysqlClient.js';

export class QuestionRepositoryMySQL extends QuestionRepository {
  async create(question, answers) {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert question
      const [questionResult] = await connection.execute(
        'INSERT INTO questions (category_id, text, is_active) VALUES (?, ?, ?)',
        [question.categoryId, question.text, question.isActive]
      );
      
      const questionId = questionResult.insertId;

      // Insert answers
      for (const answer of answers) {
        await connection.execute(
          'INSERT INTO question_answers (question_id, text, points, position) VALUES (?, ?, ?, ?)',
          [questionId, answer.text, answer.points, answer.position]
        );
      }

      await connection.commit();
      return questionId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    const pool = getPool();
    
    // Get question
    const [questionRows] = await pool.execute(
      'SELECT q.*, c.name as category_name FROM questions q LEFT JOIN categories c ON q.category_id = c.id WHERE q.id = ?',
      [id]
    );
    
    if (questionRows.length === 0) return null;

    // Get answers
    const [answerRows] = await pool.execute(
      'SELECT * FROM question_answers WHERE question_id = ? ORDER BY position',
      [id]
    );

    const answers = answerRows.map(row => Answer.create({
      id: row.id,
      questionId: row.question_id,
      text: row.text,
      points: row.points,
      position: row.position
    }));

    return Question.create({
      id: questionRows[0].id,
      categoryId: questionRows[0].category_id,
      categoryName: questionRows[0].category_name,
      text: questionRows[0].text,
      isActive: questionRows[0].is_active,
      answers
    });
  }

  async findByCategoryId(categoryId) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM questions WHERE category_id = ? AND is_active = TRUE ORDER BY id DESC',
      [categoryId]
    );
    
    const questions = [];
    for (const row of rows) {
      const question = await this.findById(row.id);
      questions.push(question);
    }
    
    return questions;
  }

  async findRandom(categoryIds = [], excludeQuestionIds = []) {
    const pool = getPool();
    let query = 'SELECT id FROM questions WHERE is_active = TRUE';
    const params = [];

    if (categoryIds.length > 0) {
      query += ' AND category_id IN (?)';
      params.push(categoryIds);
    }

    if (excludeQuestionIds.length > 0) {
      query += ` AND id NOT IN (${excludeQuestionIds.map(() => '?').join(',')})`;
      params.push(...excludeQuestionIds);
    }

    query += ' ORDER BY RAND() LIMIT 1';

    const [rows] = await pool.execute(query, params);
    
    if (rows.length === 0) return null;
    
    return this.findById(rows[0].id);
  }

  async update(id, data) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    if (data.text !== undefined) {
      fields.push('text = ?');
      values.push(data.text);
    }
    if (data.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(data.isActive);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async delete(id) {
    const pool = getPool();
    await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
  }

  async findAllPaginated({ page = 1, limit = 10, categoryId = null } = {}) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    
    let countQuery = 'SELECT COUNT(*) as total FROM questions';
    let dataQuery = `
      SELECT q.id, q.text, q.is_active, q.category_id, q.created_at,
             c.name as category_name
      FROM questions q
      LEFT JOIN categories c ON q.category_id = c.id
    `;
    const params = [];

    if (categoryId) {
      countQuery += ' WHERE category_id = ?';
      dataQuery += ' WHERE q.category_id = ?';
      params.push(categoryId);
    }

    dataQuery += ' ORDER BY q.created_at DESC, q.id DESC LIMIT ? OFFSET ?';

    const [[{ total }]] = await pool.execute(countQuery, categoryId ? [categoryId] : []);
    const [rows] = await pool.execute(dataQuery, [...params, String(limit), String(offset)]);

    return {
      questions: rows.map(row => ({
        id: row.id,
        text: row.text,
        isActive: row.is_active,
        categoryId: row.category_id,
        categoryName: row.category_name,
        createdAt: row.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateWithAnswers(id, data, answers) {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update question
      const fields = [];
      const values = [];
      
      if (data.text !== undefined) {
        fields.push('text = ?');
        values.push(data.text);
      }
      if (data.categoryId !== undefined) {
        fields.push('category_id = ?');
        values.push(data.categoryId);
      }
      if (data.isActive !== undefined) {
        fields.push('is_active = ?');
        values.push(data.isActive);
      }

      if (fields.length > 0) {
        values.push(id);
        await connection.execute(
          `UPDATE questions SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update answers if provided
      if (answers && answers.length > 0) {
        // Delete existing answers
        await connection.execute('DELETE FROM question_answers WHERE question_id = ?', [id]);
        
        // Insert new answers
        for (const answer of answers) {
          await connection.execute(
            'INSERT INTO question_answers (question_id, text, points, position) VALUES (?, ?, ?, ?)',
            [id, answer.text, answer.points, answer.position]
          );
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
