import { useState, useEffect, useRef } from 'react';

/**
 * QuestionPreviewCard - Editable card for a single extracted question
 * Allows editing question text, answers, points, and category selection
 */
function QuestionPreviewCard({ 
  question, 
  index, 
  existingCategories = [], 
  onChange, 
  onRemove 
}) {
  const initializedRef = useRef(false);
  
  // Determine if category is new based on AI response
  const isNewCategory = question.category?.isNew === true;
  
  // Get the effective category ID (from categoryId or category.id)
  const effectiveCategoryId = question.categoryId || question.category?.id || null;
  
  const [useNewCategory, setUseNewCategory] = useState(isNewCategory);

  // Initialize component state on first render
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // If category is new, ensure useNewCategory is true
    if (question.category?.isNew === true) {
      setUseNewCategory(true);
    } 
    // If category has an ID (existing), ensure categoryId is set and useNewCategory is false
    else if (question.category?.id && !question.categoryId) {
      setUseNewCategory(false);
      onChange(index, {
        ...question,
        categoryId: question.category.id
      });
    }
  }, [question.category?.isNew, question.category?.id]);

  const handleQuestionChange = (field, value) => {
    onChange(index, { ...question, [field]: value });
  };

  const handleCategoryChange = (categoryId) => {
    const selectedCat = existingCategories.find(c => c.id === parseInt(categoryId));
    if (selectedCat) {
      onChange(index, {
        ...question,
        categoryId: selectedCat.id,
        category: { ...selectedCat, isNew: false }
      });
    }
  };

  const handleNewCategoryChange = (field, value) => {
    onChange(index, {
      ...question,
      categoryId: null,
      category: { ...question.category, [field]: value, isNew: true }
    });
  };

  const handleCategoryModeChange = (isNew) => {
    setUseNewCategory(isNew);
    if (!isNew && existingCategories.length > 0) {
      const firstCat = existingCategories[0];
      onChange(index, {
        ...question,
        categoryId: firstCat.id,
        category: { ...firstCat, isNew: false }
      });
    } else {
      onChange(index, {
        ...question,
        categoryId: null,
        category: { 
          name: question.category?.name || '', 
          description: question.category?.description || '', 
          isNew: true 
        }
      });
    }
  };

  const handleAnswerChange = (answerIndex, field, value) => {
    const newAnswers = [...question.answers];
    newAnswers[answerIndex] = { ...newAnswers[answerIndex], [field]: value };
    onChange(index, { ...question, answers: newAnswers });
  };

  const addAnswer = () => {
    if (question.answers.length >= 8) return;
    onChange(index, {
      ...question,
      answers: [...question.answers, { text: '', points: 0 }]
    });
  };

  const removeAnswer = (answerIndex) => {
    if (question.answers.length <= 1) return;
    const newAnswers = question.answers.filter((_, i) => i !== answerIndex);
    onChange(index, { ...question, answers: newAnswers });
  };

  return (
    <div className="question-preview-card">
      <div className="question-preview-card__header">
        <span className="question-preview-card__number">Pregunta {index + 1}</span>
        <button
          type="button"
          className="btn btn-small btn-danger"
          onClick={() => onRemove(index)}
          title="Eliminar pregunta"
        >
          ✕
        </button>
      </div>

      {/* Category section */}
      <div className="question-preview-card__category">
        <div className="category-toggle">
          <label className={!useNewCategory ? 'active' : ''}>
            <input
              type="radio"
              name={`category-mode-${index}`}
              checked={!useNewCategory}
              onChange={() => handleCategoryModeChange(false)}
            />
            Categoría existente
          </label>
          <label className={useNewCategory ? 'active' : ''}>
            <input
              type="radio"
              name={`category-mode-${index}`}
              checked={useNewCategory}
              onChange={() => handleCategoryModeChange(true)}
            />
            Nueva categoría
          </label>
        </div>

        {!useNewCategory ? (
          <select
            value={effectiveCategoryId || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="category-select"
          >
            <option value="">Seleccionar categoría...</option>
            {existingCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="new-category-inputs">
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={question.category?.name || ''}
              onChange={(e) => handleNewCategoryChange('name', e.target.value)}
            />
            <input
              type="text"
              placeholder="Descripción (opcional)"
              value={question.category?.description || ''}
              onChange={(e) => handleNewCategoryChange('description', e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Question text */}
      <div className="question-preview-card__question">
        <label>Pregunta</label>
        <textarea
          value={question.question || ''}
          onChange={(e) => handleQuestionChange('question', e.target.value)}
          rows="2"
          placeholder="Texto de la pregunta"
        />
      </div>

      {/* Answers */}
      <div className="question-preview-card__answers">
        <label>Respuestas</label>
        {question.answers.map((answer, ansIdx) => (
          <div key={ansIdx} className="answer-row">
            <span className="answer-position">{ansIdx + 1}</span>
            <input
              type="text"
              value={answer.text || ''}
              onChange={(e) => handleAnswerChange(ansIdx, 'text', e.target.value)}
              placeholder="Respuesta"
              className="answer-text"
            />
            <input
              type="number"
              value={answer.points || 0}
              onChange={(e) => handleAnswerChange(ansIdx, 'points', parseInt(e.target.value) || 0)}
              placeholder="Pts"
              className="answer-points"
              min="0"
              max="100"
            />
            {question.answers.length > 1 && (
              <button
                type="button"
                className="btn btn-small btn-danger"
                onClick={() => removeAnswer(ansIdx)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        
        {question.answers.length < 8 && (
          <button
            type="button"
            className="btn btn-small btn-secondary add-answer-btn"
            onClick={addAnswer}
          >
            + Agregar respuesta
          </button>
        )}
      </div>
    </div>
  );
}

export default QuestionPreviewCard;
