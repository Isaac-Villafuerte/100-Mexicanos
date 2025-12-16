import { CategoryRepository } from '../../domain/repositories/CategoryRepository.js';
import { Category } from '../../domain/entities/Category.js';
import { getPool } from './mysqlClient.js';

export class CategoryRepositoryMySQL extends CategoryRepository {
  async create(category) {
    const pool = getPool();
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description, is_active) VALUES (?, ?, ?)',
      [category.name, category.description || null, category.isActive]
    );
    return { ...category, id: result.insertId };
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return Category.create({
      id: rows[0].id,
      name: rows[0].name,
      description: rows[0].description,
      isActive: rows[0].is_active
    });
  }

  async findAll() {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM categories ORDER BY name'
    );
    return rows.map(row => Category.create({
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.is_active
    }));
  }

  async update(id, data) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(data.isActive);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async delete(id) {
    const pool = getPool();
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  }
}
