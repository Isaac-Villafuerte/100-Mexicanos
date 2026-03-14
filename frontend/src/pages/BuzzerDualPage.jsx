import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWakeLock } from '../hooks/useWakeLock';
import { useEffect, useRef, useState } from 'react';
import '../styles/pages/_buzzer.scss';

function BuzzerDualPage() {
  useWakeLock();
  const { gameId } = useParams();
  const { gameState, isConnected, emit, socket } = useSocket(gameId, 'buzzer');
  const [winner, setWinner] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const buzzerSound = useRef(null);

  useEffect(() => {
    buzzerSound.current = new Audio('/sounds/boton.mp3');
    return () => {
      if (buzzerSound.current) {
        buzzerSound.current.pause();
        buzzerSound.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleBuzzerWinner = ({ team }) => {
      setWinner(team);
      setIsLocked(true);
      if (buzzerSound.current) {
        buzzerSound.current.currentTime = 0;
        buzzerSound.current.play().catch(() => {});
      }
    };

    const handleBuzzerReset = () => {
      setWinner(null);
      setIsLocked(false);
    };

    socket.on('BUZZER_WINNER', handleBuzzerWinner);
    socket.on('BUZZER_RESET', handleBuzzerReset);

    // Obtener estado actual al conectar
    emit('BUZZER_GET_STATE', { gameId });

    socket.on('BUZZER_STATE', ({ locked, winner: w }) => {
      setIsLocked(locked);
      setWinner(w);
    });

    return () => {
      socket.off('BUZZER_WINNER', handleBuzzerWinner);
      socket.off('BUZZER_RESET', handleBuzzerReset);
      socket.off('BUZZER_STATE');
    };
  }, [socket, gameId, emit]);

  const handlePress = (team) => {
    if (isLocked) return;
    emit('BUZZER_PRESS', { gameId, team });
  };

  if (!isConnected) {
    return (
      <div className="buzzer-loading">
        <h2>Conectando...</h2>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="buzzer-loading">
        <h2>Cargando juego...</h2>
      </div>
    );
  }

  const { teamA, teamB } = gameState;

  return (
    <div className="buzzer-dual">
      {/* Botón Equipo A (Azul) */}
      <button
        className={`buzzer-button team-a ${winner === 'A' ? 'winner flash' : ''} ${isLocked && winner !== 'A' ? 'disabled' : ''}`}
        onClick={() => handlePress('A')}
        disabled={isLocked}
      >
        <span className="team-name">{teamA.name}</span>
        {winner === 'A' && <span className="winner-badge">¡PRIMERO!</span>}
      </button>

      {/* Botón Equipo B (Rojo) */}
      <button
        className={`buzzer-button team-b ${winner === 'B' ? 'winner flash' : ''} ${isLocked && winner !== 'B' ? 'disabled' : ''}`}
        onClick={() => handlePress('B')}
        disabled={isLocked}
      >
        <span className="team-name">{teamB.name}</span>
        {winner === 'B' && <span className="winner-badge">¡PRIMERO!</span>}
      </button>
    </div>
  );
}

export default BuzzerDualPage;
