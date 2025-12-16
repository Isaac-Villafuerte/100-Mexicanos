import { useState } from 'react';
import QuestionPreviewCard from './QuestionPreviewCard';

/**
 * ExtractedQuestionsForm - Container for editing and saving multiple extracted questions
 */
function ExtractedQuestionsForm({ 
  extractedData, 
  onSave, 
  onCancel,
  isSaving = false 
}) {
  const [questions, setQuestions] = useState(extractedData.questions || []);
  const existingCategories = extractedData.existingCategories || [];

  const handleQuestionChange = (index, updatedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index) => {
    if (questions.length <= 1) {
      alert('Debe haber al menos una pregunta');
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const validateQuestions = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.question?.trim()) {
        alert(`La pregunta ${i + 1} no tiene texto`);
        return false;
      }

      if (!q.categoryId && !q.category?.name?.trim()) {
        alert(`La pregunta ${i + 1} no tiene categoría asignada`);
        return false;
      }

      if (!q.answers || q.answers.length === 0) {
        alert(`La pregunta ${i + 1} no tiene respuestas`);
        return false;
      }

      for (let j = 0; j < q.answers.length; j++) {
        if (!q.answers[j].text?.trim()) {
          alert(`La respuesta ${j + 1} de la pregunta ${i + 1} está vacía`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateQuestions()) return;
    onSave(questions);
  };

  return (
    <div className="extracted-questions-form">
      <div className="extracted-questions-form__header">
        <h3>
          {questions.length === 1 
            ? '1 pregunta extraída' 
            : `${questions.length} preguntas extraídas`}
        </h3>
        <p className="hint">Revisa y edita la información antes de guardar</p>
      </div>

      <div className="extracted-questions-form__list">
        {questions.map((question, index) => (
          <QuestionPreviewCard
            key={index}
            question={question}
            index={index}
            existingCategories={existingCategories}
            onChange={handleQuestionChange}
            onRemove={handleRemoveQuestion}
          />
        ))}
      </div>

      <div className="extracted-questions-form__actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? 'Guardando...' : `Guardar ${questions.length > 1 ? 'preguntas' : 'pregunta'}`}
        </button>
      </div>
    </div>
  );
}

export default ExtractedQuestionsForm;
