import { useState, useEffect } from 'react';

/**
 * QuestionEditModal - Modal for viewing and editing a question
 */
function QuestionEditModal({ 
  questionId, 
  categories = [], 
  onClose, 
  onSave 
}) {
  const [question, setQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`);
      const data = await response.json();
      setQuestion(data.question);
      setFormData({
        text: data.question.text,
        categoryId: data.question.categoryId,
        answers: data.question.answers.map(a => ({
          text: a.text,
          points: a.points
        }))
      });
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (value) => {
    setFormData({ ...formData, text: value });
  };

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, categoryId: parseInt(value) });
  };

  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = { 
      ...newAnswers[index], 
      [field]: field === 'points' ? parseInt(value) || 0 : value 
    };
    setFormData({ ...formData, answers: newAnswers });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.text,
          categoryId: formData.categoryId,
          answers: formData.answers
        })
      });

      if (!response.ok) throw new Error('Error al guardar');
      
      setIsEditing(false);
      onSave?.();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error al guardar la pregunta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setFormData({
        text: question.text,
        categoryId: question.categoryId,
        answers: question.answers.map(a => ({ text: a.text, points: a.points }))
      });
      setIsEditing(false);
    } else {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-loading">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content question-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Editar Pregunta' : 'Detalle de Pregunta'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Category */}
          <div className="modal-field">
            <label>Categoría</label>
            {isEditing ? (
              <select 
                value={formData.categoryId || ''} 
                onChange={e => handleCategoryChange(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            ) : (
              <p>{question.categoryName || 'Sin categoría'}</p>
            )}
          </div>

          {/* Question text */}
          <div className="modal-field">
            <label>Pregunta</label>
            {isEditing ? (
              <textarea
                value={formData.text}
                onChange={e => handleTextChange(e.target.value)}
                rows="2"
              />
            ) : (
              <p className="modal-question-text">{question.text}</p>
            )}
          </div>

          {/* Answers */}
          <div className="modal-field">
            <label>Respuestas</label>
            <div className="modal-answers">
              {(isEditing ? formData.answers : question.answers).map((answer, idx) => (
                <div key={idx} className="modal-answer-row">
                  <span className="modal-answer-num">{idx + 1}</span>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={answer.text}
                        onChange={e => handleAnswerChange(idx, 'text', e.target.value)}
                        className="modal-answer-text"
                      />
                      <input
                        type="number"
                        value={answer.points}
                        onChange={e => handleAnswerChange(idx, 'points', e.target.value)}
                        className="modal-answer-points"
                        min="0"
                        max="100"
                      />
                    </>
                  ) : (
                    <>
                      <span className="modal-answer-text">{answer.text}</span>
                      <span className="modal-answer-points">{answer.points} pts</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {isEditing ? (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Editar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuestionEditModal;
