import { useState, useEffect } from 'react';
import QuestionListItem from './QuestionListItem';
import QuestionEditModal from './QuestionEditModal';

/**
 * QuestionsList - Paginated list of all questions
 */
function QuestionsList({ categories = [] }) {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [filterCategoryId, setFilterCategoryId] = useState('');

  useEffect(() => {
    fetchQuestions(1);
  }, [filterCategoryId]);

  const fetchQuestions = async (page) => {
    setIsLoading(true);
    try {
      let url = `/api/admin/questions?page=${page}&limit=10`;
      if (filterCategoryId) {
        url += `&categoryId=${filterCategoryId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setQuestions(data.questions || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchQuestions(newPage);
    }
  };

  const handleQuestionClick = (question) => {
    setSelectedQuestionId(question.id);
  };

  const handleModalClose = () => {
    setSelectedQuestionId(null);
  };

  const handleQuestionSaved = () => {
    fetchQuestions(pagination.page);
    setSelectedQuestionId(null);
  };

  return (
    <div className="questions-list">
      <div className="questions-list__header">
        <h4>Preguntas existentes</h4>
        <select 
          value={filterCategoryId} 
          onChange={e => setFilterCategoryId(e.target.value)}
          className="questions-list__filter"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="questions-list__loading">Cargando...</div>
      ) : questions.length === 0 ? (
        <div className="questions-list__empty">No hay preguntas</div>
      ) : (
        <>
          <div className="questions-list__items">
            {questions.map(question => (
              <QuestionListItem
                key={question.id}
                question={question}
                onClick={handleQuestionClick}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="questions-list__pagination">
              <button
                className="btn btn-small btn-secondary"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                ‹ Anterior
              </button>
              <span className="questions-list__page-info">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-small btn-secondary"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Siguiente ›
              </button>
            </div>
          )}

          <div className="questions-list__total">
            Total: {pagination.total} preguntas
          </div>
        </>
      )}

      {selectedQuestionId && (
        <QuestionEditModal
          questionId={selectedQuestionId}
          categories={categories}
          onClose={handleModalClose}
          onSave={handleQuestionSaved}
        />
      )}
    </div>
  );
}

export default QuestionsList;
