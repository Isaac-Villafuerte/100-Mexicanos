import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useEffect, useRef, useState } from 'react';
import '../styles/pages/_board.scss';
import '../styles/pages/_buzzer.scss';

function GameBoardPage() {
  const { gameId } = useParams();
  const { gameState, isConnected, socket } = useSocket(gameId, 'board');
  
  const correctSound = useRef(null);
  const strikeSound = useRef(null);
  const roundEndSound = useRef(null);
  const gameStartSound = useRef(null);
  const buzzerSound = useRef(null);
  const prevGameStateRef = useRef(null);
  const [buzzerWinner, setBuzzerWinner] = useState(null);
  const [strikeOverlay, setStrikeOverlay] = useState(null); // { count: 1|2|3, team: 'A'|'B' }

  const playSound = (soundRef) => {
    if (!soundRef?.current) return;
    try {
      soundRef.current.currentTime = 0;
      const maybePromise = soundRef.current.play();
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {});
      }
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    // Initialize audio with preload for better playback
    const initAudio = (src) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.load();
      return audio;
    };

    correctSound.current = initAudio('/sounds/correcto.mp3');
    strikeSound.current = initAudio('/sounds/incorrecto.mp3');
    roundEndSound.current = initAudio('/sounds/triunfo_fadeout.mp3');
    gameStartSound.current = initAudio('/sounds/a_jugar_fadeout.mp3');
    buzzerSound.current = initAudio('/sounds/boton.mp3');

    // Preload all sounds by playing them silently
    const preloadSounds = () => {
      [correctSound, strikeSound, roundEndSound, gameStartSound, buzzerSound].forEach((ref) => {
        if (ref.current) {
          ref.current.volume = 0;
          ref.current.play().then(() => {
            ref.current.pause();
            ref.current.currentTime = 0;
            ref.current.volume = 1;
          }).catch(() => {});
        }
      });
    };

    // Try to preload on first user interaction
    const handleInteraction = () => {
      preloadSounds();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      [correctSound, strikeSound, roundEndSound, gameStartSound, buzzerSound].forEach((ref) => {
        if (ref.current) {
          try {
            ref.current.pause();
          } catch {
            // no-op
          }
          ref.current = null;
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!gameState) return;

    const prev = prevGameStateRef.current;

    // Game start sound: first time we receive a running state, or pending -> running.
    if (!prev) {
      if (gameState.status === 'running') {
        playSound(gameStartSound);
      }
    } else if (prev.status !== 'running' && gameState.status === 'running') {
      playSound(gameStartSound);
    }

    // Game start sound: also when a new round starts (new currentRound.id)
    const prevRoundId = prev?.currentRound?.id ?? null;
    const nextRoundId = gameState.currentRound?.id ?? null;
    if (prev && nextRoundId && prevRoundId !== nextRoundId) {
      playSound(gameStartSound);
    }

    // Correct sound: when a new answer becomes revealed
    const prevRevealedCount = prev?.currentRound?.answers
      ? prev.currentRound.answers.filter((a) => a.isRevealed).length
      : 0;
    const nextRevealedCount = gameState.currentRound?.answers
      ? gameState.currentRound.answers.filter((a) => a.isRevealed).length
      : 0;
    if (prev && nextRevealedCount > prevRevealedCount) {
      playSound(correctSound);
    }

    // Strike sound and overlay: when strikes increase for either team
    const prevStrikesA = prev?.teamA?.strikes ?? 0;
    const prevStrikesB = prev?.teamB?.strikes ?? 0;
    const nextStrikesA = gameState.teamA?.strikes ?? 0;
    const nextStrikesB = gameState.teamB?.strikes ?? 0;
    
    if (prev && nextStrikesA > prevStrikesA) {
      playSound(strikeSound);
      setStrikeOverlay({ count: nextStrikesA, team: 'A' });
      setTimeout(() => setStrikeOverlay(null), 2000);
    }
    if (prev && nextStrikesB > prevStrikesB) {
      playSound(strikeSound);
      setStrikeOverlay({ count: nextStrikesB, team: 'B' });
      setTimeout(() => setStrikeOverlay(null), 2000);
    }

    prevGameStateRef.current = gameState;
  }, [gameState]);

  // Round end sound: only when points are assigned (ROUND_FINISHED event)
  useEffect(() => {
    if (!socket) return;

    const handleRoundFinished = () => {
      playSound(roundEndSound);
    };

    socket.on('ROUND_FINISHED', handleRoundFinished);

    return () => {
      socket.off('ROUND_FINISHED', handleRoundFinished);
    };
  }, [socket]);

  // Buzzer winner effect
  useEffect(() => {
    if (!socket) return;

    const handleBuzzerWinner = ({ team }) => {
      setBuzzerWinner(team);
      playSound(buzzerSound);
      // Auto-clear after 5 seconds
      setTimeout(() => {
        setBuzzerWinner(null);
      }, 5000);
    };

    const handleBuzzerReset = () => {
      setBuzzerWinner(null);
    };

    socket.on('BUZZER_WINNER', handleBuzzerWinner);
    socket.on('BUZZER_RESET', handleBuzzerReset);

    return () => {
      socket.off('BUZZER_WINNER', handleBuzzerWinner);
      socket.off('BUZZER_RESET', handleBuzzerReset);
    };
  }, [socket]);

  if (!isConnected) {
    return (
      <div className="board-loading">
        <h2>Conectando...</h2>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="board-loading">
        <h2>Esperando inicio del juego...</h2>
      </div>
    );
  }

  const { title, teamA, teamB, currentRound } = gameState;

  // Ordenar respuestas por columnas: columna 1 (1,2,3,4) | columna 2 (5,6,7,8)
  // Distribuidas equitativamente
  const getOrderedAnswers = (answers) => {
    if (!answers || answers.length === 0) return { col1: [], col2: [] };
    const sorted = [...answers].sort((a, b) => a.position - b.position);
    const half = Math.ceil(sorted.length / 2);
    return {
      col1: sorted.slice(0, half),
      col2: sorted.slice(half)
    };
  };

  const orderedAnswers = currentRound ? getOrderedAnswers(currentRound.answers) : { col1: [], col2: [] };

  return (
    <div className="game-board">
      {/* Decorative lights */}
      <div className="carnival-lights top-lights">
        {[...Array(20)].map((_, i) => (
          <span key={i} className="light" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>

      {/* Buzzer Winner Overlay */}
      {buzzerWinner && (
        <div className={`buzzer-winner-overlay team-${buzzerWinner.toLowerCase()}-winner`}>
          <span className={`winner-text team-${buzzerWinner.toLowerCase()}`}>
            {buzzerWinner === 'A' ? teamA.name : teamB.name}
          </span>
        </div>
      )}

      {/* Strike Overlay */}
      {strikeOverlay && (
        <div className="strike-overlay">
          <div className="strike-x-container">
            {'X'.repeat(strikeOverlay.count).split('').map((x, i) => (
              <span key={i} className="strike-x">X</span>
            ))}
          </div>
        </div>
      )}

      <header className="board-header">
        <h1 className="board-title">{title}</h1>
        {/* Round score display */}
        {currentRound && (
          <div className="round-points-display">
            <span className="round-points-value">{currentRound.roundScore}</span>
          </div>
        )}
      </header>

      <div className="board-content">
        {/* Team A Score */}
        <aside className={`team-sidebar team-a ${currentRound?.teamInTurn === 'A' ? 'in-turn' : ''}`}>
          <div className="team-info">
            <h2>{teamA.name}</h2>
            <div className="team-score">{teamA.score}</div>
          </div>
        </aside>

        {/* Main Board */}
        <main className="board-main">
          {currentRound ? (
            <>
              <div className="round-info">
                <h3 className="question-text">{currentRound.questionText}</h3>
                <div className="round-meta">
                  <span className="category">{currentRound.categoryName}</span>
                  <span className="multiplier">x{currentRound.multiplier}</span>
                </div>
              </div>

              <div className="answers-grid">
                <div className="answers-column">
                  {orderedAnswers.col1.map((answer) => (
                    <div
                      key={answer.id}
                      className={`answer-row ${answer.isRevealed ? 'revealed' : 'hidden'}`}
                    >
                      <span className="answer-position">{answer.position}</span>
                      <span className="answer-text">
                        {answer.isRevealed ? answer.text : ''}
                      </span>
                      <span className="answer-points">
                        {answer.isRevealed ? answer.points : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="answers-column">
                  {orderedAnswers.col2.map((answer) => (
                    <div
                      key={answer.id}
                      className={`answer-row ${answer.isRevealed ? 'revealed' : 'hidden'}`}
                    >
                      <span className="answer-position">{answer.position}</span>
                      <span className="answer-text">
                        {answer.isRevealed ? answer.text : ''}
                      </span>
                      <span className="answer-points">
                        {answer.isRevealed ? answer.points : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="strikes-container">
                <div className="strikes">
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className={`strike ${
                        i < (currentRound.teamInTurn === 'A' ? teamA.strikes : teamB.strikes)
                          ? 'active'
                          : ''
                      }`}
                    >
                      ✕
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="waiting-round">
              <h2>Esperando siguiente ronda...</h2>
            </div>
          )}
        </main>

        {/* Team B Score */}
        <aside className={`team-sidebar team-b ${currentRound?.teamInTurn === 'B' ? 'in-turn' : ''}`}>
          <div className="team-info">
            <h2>{teamB.name}</h2>
            <div className="team-score">{teamB.score}</div>
          </div>
        </aside>
      </div>

      {/* Bottom decorative lights */}
      <div className="carnival-lights bottom-lights">
        {[...Array(20)].map((_, i) => (
          <span key={i} className="light" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

export default GameBoardPage;
