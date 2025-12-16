import { useState } from 'react';

function QuestionManager({ categories }) {
  const [activeMode, setActiveMode] = useState('manual'); // 'manual', 'image', 'ai'
  
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
  const [autoDetectCategory, setAutoDetectCategory] = useState(true);
  const [extractedData, setExtractedData] = useState(null);

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

  const handleImageUpload = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      alert('Selecciona una imagen');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('autoDetectCategory', autoDetectCategory);

    try {
      const response = await fetch('/api/admin/questions/import-from-image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setExtractedData(data.result);
    } catch (error) {
      console.error('Error importing from image:', error);
      alert('Error al procesar la imagen');
    }
  };

  const handleSaveExtracted = async () => {
    if (!extractedData) return;

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: extractedData.categoryId || categories[0]?.id,
          text: extractedData.question,
          answers: extractedData.answers.map((ans, idx) => ({
            text: ans.text,
            points: ans.points,
            position: idx + 1
          }))
        })
      });

      if (response.ok) {
        alert('Pregunta guardada exitosamente');
        setExtractedData(null);
        setImageFile(null);
      }
    } catch (error) {
      console.error('Error saving extracted question:', error);
      alert('Error al guardar la pregunta');
    }
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
          <form onSubmit={handleImageUpload}>
            <div className="form-group">
              <label>Subir Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                required
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={autoDetectCategory}
                  onChange={(e) => setAutoDetectCategory(e.target.checked)}
                />
                Detectar categoría automáticamente
              </label>
            </div>

            <button type="submit" className="btn btn-primary">
              Extraer Datos con IA
            </button>
          </form>

          {extractedData && (
            <div className="extracted-preview">
              <h4>Datos Extraídos (revisa antes de guardar)</h4>
              <p><strong>Pregunta:</strong> {extractedData.question}</p>
              <p><strong>Categoría sugerida:</strong> {extractedData.categoryName || 'N/A'}</p>
              <h5>Respuestas:</h5>
              <ul>
                {extractedData.answers.map((ans, idx) => (
                  <li key={idx}>
                    {ans.text} - {ans.points} puntos
                  </li>
                ))}
              </ul>
              <button onClick={handleSaveExtracted} className="btn btn-success">
                Guardar Pregunta
              </button>
              <button onClick={() => setExtractedData(null)} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
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
