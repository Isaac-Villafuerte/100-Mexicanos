import { useState } from 'react';

function GameConfigForm({ categories, onGameCreated }) {
  const [formData, setFormData] = useState({
    title: '100 Mexicanos Dijeron',
    targetScore: 300,
    teamAName: 'Equipo A',
    teamBName: 'Equipo B'
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.game) {
        alert(`Juego creado con ID: ${data.game.id}`);
        onGameCreated(data.game.id);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Error al crear el juego');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="game-config-form">
      <h2>Crear Nueva Partida</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Título del Juego</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Puntaje Objetivo</label>
          <input
            type="number"
            value={formData.targetScore}
            onChange={(e) => setFormData({ ...formData, targetScore: parseInt(e.target.value) })}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nombre Equipo A</label>
            <input
              type="text"
              value={formData.teamAName}
              onChange={(e) => setFormData({ ...formData, teamAName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Nombre Equipo B</label>
            <input
              type="text"
              value={formData.teamBName}
              onChange={(e) => setFormData({ ...formData, teamBName: e.target.value })}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Partida'}
        </button>
      </form>
    </div>
  );
}

export default GameConfigForm;
