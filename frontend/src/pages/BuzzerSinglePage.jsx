import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWakeLock } from '../hooks/useWakeLock';
import { useEffect, useRef, useState } from 'react';
import '../styles/pages/_buzzer.scss';

function BuzzerSinglePage() {
  useWakeLock();
  const { gameId, team } = useParams();
  const { gameState, isConnected, emit, socket } = useSocket(gameId, 'buzzer');
  const [winner, setWinner] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const buzzerSound = useRef(null);

  // Normalizar team a mayúsculas (A o B)
  const normalizedTeam = team?.toUpperCase();
  const isValidTeam = normalizedTeam === 'A' || normalizedTeam === 'B';

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

    const handleBuzzerWinner = ({ team: winnerTeam }) => {
      setWinner(winnerTeam);
      setIsLocked(true);
      // Solo reproducir sonido si este equipo ganó
      if (winnerTeam === normalizedTeam && buzzerSound.current) {
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
  }, [socket, gameId, emit, normalizedTeam]);

  const handlePress = () => {
    if (isLocked || !isValidTeam) return;
    emit('BUZZER_PRESS', { gameId, team: normalizedTeam });
  };

  if (!isValidTeam) {
    return (
      <div className="buzzer-loading">
        <h2>Equipo inválido</h2>
        <p>Usa /buzzer/:gameId/a o /buzzer/:gameId/b</p>
      </div>
    );
  }

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

  const teamData = normalizedTeam === 'A' ? gameState.teamA : gameState.teamB;
  const isWinner = winner === normalizedTeam;
  const isLoser = winner && winner !== normalizedTeam;

  return (
    <div className={`buzzer-single team-${normalizedTeam.toLowerCase()}-bg`}>
      <button
        className={`buzzer-button-full team-${normalizedTeam.toLowerCase()} ${isWinner ? 'winner flash' : ''} ${isLoser ? 'disabled loser' : ''}`}
        onClick={handlePress}
        disabled={isLocked}
      >
        <span className="team-name">{teamData.name}</span>
        {isWinner && <span className="winner-badge">¡PRIMERO!</span>}
        {isLoser && <span className="loser-badge">El otro equipo fue primero</span>}
      </button>
    </div>
  );
}

export default BuzzerSinglePage;
