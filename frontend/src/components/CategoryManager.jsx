import { useState } from 'react';

function CategoryManager({ categories, onUpdate }) {
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        setNewCategory({ name: '', description: '' });
        onUpdate();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;

    try {
      await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div className="category-manager">
      <h2>Gestión de Categorías</h2>

      <form onSubmit={handleCreate} className="category-form">
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción (opcional)</label>
          <textarea
            value={newCategory.description}
            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            rows="3"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Categoría'}
        </button>
      </form>

      <div className="categories-list">
        <h3>Categorías Existentes</h3>
        {categories.length === 0 ? (
          <p>No hay categorías</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                  <td>{cat.description || '-'}</td>
                  <td>
                    <span className={`status ${cat.isActive ? 'active' : 'inactive'}`}>
                      {cat.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(cat.id, cat.isActive)}
                      className="btn btn-small"
                    >
                      {cat.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="btn btn-small btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default CategoryManager;
