import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameConfigForm from '../components/GameConfigForm';
import CategoryManager from '../components/CategoryManager';
import QuestionManager from '../components/QuestionManager';
import '../styles/pages/_admin.scss';

function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('game');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Panel de Administración</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => setActiveTab('game')}
        >
          Configurar Juego
        </button>
        <button
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categorías
        </button>
        <button
          className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Preguntas
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'game' && (
          <GameConfigForm 
            categories={categories} 
            onGameCreated={(gameId) => navigate(`/host/${gameId}`)} 
          />
        )}
        {activeTab === 'categories' && (
          <CategoryManager 
            categories={categories} 
            onUpdate={fetchCategories} 
          />
        )}
        {activeTab === 'questions' && (
          <QuestionManager categories={categories} />
        )}
      </div>
    </div>
  );
}

export default AdminPage;
