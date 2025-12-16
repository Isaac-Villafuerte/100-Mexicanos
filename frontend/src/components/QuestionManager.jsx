import { useState } from 'react';
import ImageInput from './ImageInput';
import ExtractedQuestionsForm from './ExtractedQuestionsForm';
import QuestionsList from './QuestionsList';

function QuestionManager({ categories }) {
  const [activeMode, setActiveMode] = useState('list'); // 'list', 'manual', 'image', 'ai'
  
  // Manual form state
  const [manualForm, setManualForm] = useState({
    categoryId: '',
    text: '',
    answers: [
      { text: '', points: 0, position: 1 }
    ]
  });

  // Image import state
  const [imageFile, setImageFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // AI suggestions state
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const addAnswerField = () => {
    setManualForm({
      ...manualForm,
      answers: [...manualForm.answers, { text: '', points: 0, position: manualForm.answers.length + 1 }]
    });
  };

  const removeAnswerField = (index) => {
    const newAnswers = manualForm.answers.filter((_, i) => i !== index);
    setManualForm({ ...manualForm, answers: newAnswers });
  };

  const updateAnswer = (index, field, value) => {
    const newAnswers = [...manualForm.answers];
    newAnswers[index][field] = value;
    setManualForm({ ...manualForm, answers: newAnswers });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });

      if (response.ok) {
        alert('Pregunta creada exitosamente');
        setManualForm({
          categoryId: '',
          text: '',
          answers: [{ text: '', points: 0, position: 1 }]
        });
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Error al crear la pregunta');
    }
  };

  const handleImageReady = (file) => {
    setImageFile(file);
    if (!file) {
      setExtractedData(null);
    }
  };

  const handleExtractFromImage = async () => {
    if (!imageFile) {
      alert('Selecciona una imagen primero');
      return;
    }

    setIsExtracting(true);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch('/api/admin/questions/import-from-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error del servidor');
      }

      const data = await response.json();
      setExtractedData(data.result);
    } catch (error) {
      console.error('Error importing from image:', error);
      alert('Error al procesar la imagen: ' + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveExtractedQuestions = async (questions) => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error del servidor');
      }

      const data = await response.json();
      alert(`${data.count} pregunta(s) guardada(s) exitosamente`);
      setExtractedData(null);
      setImageFile(null);
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Error al guardar las preguntas: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelExtracted = () => {
    setExtractedData(null);
    setImageFile(null);
  };

  const handleAISuggest = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/admin/questions/suggest-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: aiQuestion })
      });

      const data = await response.json();
      setAiSuggestions(data.result);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      alert('Error al obtener sugerencias');
    }
  };

  const handleSaveAISuggestions = async () => {
    if (!aiSuggestions || !manualForm.categoryId) {
      alert('Selecciona una categoría primero');
      return;
    }

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: parseInt(manualForm.categoryId),
          text: aiQuestion,
          answers: aiSuggestions.answers.map((ans, idx) => ({
            text: ans.text,
            points: ans.points,
            position: idx + 1
          }))
        })
      });

      if (response.ok) {
        alert('Pregunta guardada exitosamente');
        setAiQuestion('');
        setAiSuggestions(null);
      }
    } catch (error) {
      console.error('Error saving AI suggestions:', error);
      alert('Error al guardar la pregunta');
    }
  };

  return (
    <div className="question-manager">
      <h2>Gestión de Preguntas</h2>

      <div className="mode-selector">
        <button
          className={`btn ${activeMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('list')}
        >
          Ver Preguntas
        </button>
        <button
          className={`btn ${activeMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('manual')}
        >
          Manual
        </button>
        <button
          className={`btn ${activeMode === 'image' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('image')}
        >
          Desde Imagen
        </button>
        <button
          className={`btn ${activeMode === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('ai')}
        >
          Sugerencias IA
        </button>
      </div>

      {activeMode === 'list' && (
        <QuestionsList categories={categories} />
      )}

      {activeMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="manual-form">
          <div className="form-group">
            <label>Categoría</label>
            <select
              value={manualForm.categoryId}
              onChange={(e) => setManualForm({ ...manualForm, categoryId: parseInt(e.target.value) })}
              required
            >
              <option value="">Seleccionar...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Pregunta</label>
            <textarea
              value={manualForm.text}
              onChange={(e) => setManualForm({ ...manualForm, text: e.target.value })}
              rows="3"
              required
            />
          </div>

          <div className="answers-section">
            <h4>Respuestas (máximo 8)</h4>
            {manualForm.answers.map((answer, index) => (
              <div key={index} className="answer-input-row">
                <input
                  type="text"
                  placeholder="Texto de la respuesta"
                  value={answer.text}
                  onChange={(e) => updateAnswer(index, 'text', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Puntos"
                  value={answer.points}
                  onChange={(e) => updateAnswer(index, 'points', parseInt(e.target.value))}
                  required
                />
                {manualForm.answers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAnswerField(index)}
                    className="btn btn-small btn-danger"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {manualForm.answers.length < 8 && (
              <button type="button" onClick={addAnswerField} className="btn btn-secondary">
                + Agregar Respuesta
              </button>
            )}
          </div>

          <button type="submit" className="btn btn-primary">
            Guardar Pregunta
          </button>
        </form>
      )}

      {activeMode === 'image' && (
        <div className="image-import">
          {!extractedData ? (
            <>
              <ImageInput 
                onImageReady={handleImageReady}
                disabled={isExtracting}
                compressionOptions={{
                  maxSizeMB: 0.4,
                  maxWidthOrHeight: 600,
                  useWebWorker: true,
                }}
              />

              {imageFile && (
                <button 
                  type="button"
                  className="btn btn-primary extract-btn"
                  onClick={handleExtractFromImage}
                  disabled={isExtracting}
                >
                  {isExtracting ? '⏳ Extrayendo con IA...' : '🤖 Extraer preguntas con IA'}
                </button>
              )}
            </>
          ) : (
            <ExtractedQuestionsForm
              extractedData={extractedData}
              onSave={handleSaveExtractedQuestions}
              onCancel={handleCancelExtracted}
              isSaving={isSaving}
            />
          )}
        </div>
      )}

      {activeMode === 'ai' && (
        <div className="ai-suggestions">
          <form onSubmit={handleAISuggest}>
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={manualForm.categoryId}
                onChange={(e) => setManualForm({ ...manualForm, categoryId: parseInt(e.target.value) })}
                required
              >
                <option value="">Seleccionar...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pregunta</label>
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                rows="3"
                placeholder="Ej: ¿Qué haces cuando estás aburrido?"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Obtener Sugerencias con IA
            </button>
          </form>

          {aiSuggestions && (
            <div className="ai-preview">
              <h4>Respuestas Sugeridas (edita si es necesario)</h4>
              <ul>
                {aiSuggestions.answers.map((ans, idx) => (
                  <li key={idx}>
                    {ans.text} - {ans.points} puntos
                  </li>
                ))}
              </ul>
              <button onClick={handleSaveAISuggestions} className="btn btn-success">
                Guardar Pregunta
              </button>
              <button onClick={() => setAiSuggestions(null)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionManager;
