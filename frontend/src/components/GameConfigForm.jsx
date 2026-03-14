import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

function GameConfigForm({ categories }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '100 Mexicanos Dijeron',
    targetScore: 300,
    teamAName: 'Equipo A',
    teamBName: 'Equipo B'
  });

  const [loading, setLoading] = useState(false);
  const [createdGameId, setCreatedGameId] = useState(null);

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
        setCreatedGameId(data.game.id);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Error al crear el juego');
    } finally {
      setLoading(false);
    }
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const handleCloseModal = () => {
    setCreatedGameId(null);
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

      {createdGameId && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content game-created-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Juego Creado</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="game-created-id">
                <span className="game-id-label">ID del Juego</span>
                <span className="game-id-value">{createdGameId}</span>
              </div>

              <div className="game-created-nav">
                <p className="game-created-nav-label">Ir a:</p>
                <div className="game-created-nav-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/host/${createdGameId}`)}
                  >
                    Pantalla de Presentador
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/board/${createdGameId}`)}
                  >
                    Tablero del Juego
                  </button>
                </div>
              </div>

              <div className="game-created-qr">
                <p className="game-created-qr-title">QR Botoneras / Buzzers</p>
                <div className="game-created-qr-grid">
                  <div className="qr-item">
                    <QRCodeSVG
                      value={`${getBaseUrl()}/buzzer/${createdGameId}`}
                      size={140}
                      level="M"
                      includeMargin
                    />
                    <span className="qr-label qr-label-dual">Dual (2 botones)</span>
                  </div>
                  <div className="qr-item">
                    <QRCodeSVG
                      value={`${getBaseUrl()}/buzzer/${createdGameId}/a`}
                      size={140}
                      level="M"
                      includeMargin
                    />
                    <span className="qr-label qr-label-a">Equipo A</span>
                  </div>
                  <div className="qr-item">
                    <QRCodeSVG
                      value={`${getBaseUrl()}/buzzer/${createdGameId}/b`}
                      size={140}
                      level="M"
                      includeMargin
                    />
                    <span className="qr-label qr-label-b">Equipo B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameConfigForm;
