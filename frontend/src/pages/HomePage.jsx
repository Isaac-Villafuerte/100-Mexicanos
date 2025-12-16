import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/_home.scss';

function HomePage() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState('');

  return (
    <div className="home-page">
      <div className="home-container">
        <h1 className="home-title">100 Mexicanos Dijeron</h1>
        <p className="home-subtitle">Plataforma de juego familiar</p>

        <div className="home-actions">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin')}
          >
            Panel de Administración
          </button>

          <div className="game-join">
            <input
              type="number"
              placeholder="ID del juego"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="input"
            />
            <button
              className="btn btn-secondary"
              onClick={() => gameId && navigate(`/board/${gameId}`)}
              disabled={!gameId}
            >
              Ver Tablero
            </button>
            <button
              className="btn btn-accent"
              onClick={() => gameId && navigate(`/host/${gameId}`)}
              disabled={!gameId}
            >
              Pantalla de Presentador
            </button>
          </div>
        </div>

        <div className="home-instructions">
          <h3>¿Cómo empezar?</h3>
          <ol>
            <li>Ve al panel de administración para crear un juego</li>
            <li>Configura los equipos y selecciona las categorías</li>
            <li>Abre la pantalla del presentador con el ID del juego</li>
            <li>Abre el tablero en otra pantalla o proyector</li>
            <li>¡Que comience el juego!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
