import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useWakeLock } from '../hooks/useWakeLock';
import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/pages/_host.scss';
import '../styles/pages/_buzzer.scss';

function HostPage() {
  const { gameId } = useParams();
  useWakeLock();
  const { gameState, isConnected, emit, socket } = useSocket(gameId, 'host');
  const [buzzerWinner, setBuzzerWinner] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { team: 'A'|'B' }
  const [showResetModal, setShowResetModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('carnival-dark');
  const [resetForm, setResetForm] = useState({
    teamAScore: 0,
    teamBScore: 0,
    teamAName: '',
    teamBName: ''
  });
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
      setBuzzerWinner(team);
      if (buzzerSound.current) {
        buzzerSound.current.currentTime = 0;
        buzzerSound.current.play().catch(() => {});
      }
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

  const handleBuzzerReset = () => {
    emit('BUZZER_MANUAL_RESET', { gameId });
  };

  const handleRevealAnswer = (answerId) => {
    emit('REVEAL_ANSWER', {
      gameId,
      roundId: gameState.currentRound.id,
      answerId
    });
  };

  const handleHideAnswer = (answerId) => {
    emit('HIDE_ANSWER', {
      gameId,
      roundId: gameState.currentRound.id,
      answerId
    });
  };

  const handleAddStrike = (team) => {
    emit('ADD_STRIKE', {
      gameId,
      roundId: gameState.currentRound.id,
      team
    });
  };

  const handleRemoveStrike = (team) => {
    emit('REMOVE_STRIKE', {
      gameId,
      roundId: gameState.currentRound.id,
      team
    });
  };

  const handleSetTeamInTurn = (team) => {
    emit('SET_TEAM_IN_TURN', {
      gameId,
      roundId: gameState.currentRound.id,
      team
    });
  };

  const handleAssignPoints = (winnerTeam) => {
    setConfirmModal({ team: winnerTeam });
  };

  const confirmAssignPoints = () => {
    if (confirmModal) {
      emit('ASSIGN_ROUND_POINTS', {
        gameId,
        roundId: gameState.currentRound.id,
        winnerTeam: confirmModal.team
      });
      setConfirmModal(null);
    }
  };

  const handleOpenResetModal = () => {
    setResetForm({
      teamAScore: teamA?.score ?? 0,
      teamBScore: teamB?.score ?? 0,
      teamAName: teamA?.name ?? 'Equipo A',
      teamBName: teamB?.name ?? 'Equipo B'
    });
    setShowResetModal(true);
  };

  const handleResetGame = () => {
    const payload = {
      gameId,
      teamAScore: parseInt(resetForm.teamAScore) || 0,
      teamBScore: parseInt(resetForm.teamBScore) || 0,
      teamAName: resetForm.teamAName,
      teamBName: resetForm.teamBName
    };
    console.log('[RESET_GAME] Sending:', payload);
    emit('RESET_GAME', payload, (response) => {
      console.log('[RESET_GAME] Response:', response);
      if (response && !response.success) {
        alert('Error al reiniciar: ' + (response.error || 'desconocido'));
      }
    });
    setShowResetModal(false);
  };

  const handleChangeTheme = (theme) => {
    setCurrentTheme(theme);
    emit('CHANGE_THEME', { gameId, theme });
  };

  const handleResetScoresToZero = () => {
    setResetForm(prev => ({ ...prev, teamAScore: 0, teamBScore: 0 }));
  };

  const handleStartNextRound = (multiplier = 1) => {
    emit('START_NEXT_ROUND', {
      gameId,
      categoryIds: [],
      multiplier
    });
  };

  if (!isConnected) {
    return (
      <div className="host-loading">
        <h2>Conectando...</h2>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="host-loading">
        <h2>Cargando juego...</h2>
      </div>
    );
  }

  const { title, teamA, teamB, currentRound, status } = gameState;

  return (
    <div className="host-page">
      {/* Buzzer Winner Overlay */}
      {buzzerWinner && (
        <div className={`buzzer-winner-overlay team-${buzzerWinner.toLowerCase()}-winner`}>
          <span className={`winner-text team-${buzzerWinner.toLowerCase()}`}>
            {buzzerWinner === 'A' ? teamA.name : teamB.name}
          </span>
        </div>
      )}

      <header className="host-header">
        <h1>{title}</h1>
        <div className="game-info">
          <span className="status">{status}</span>
          <span className="teams">
            {teamA.name}: {teamA.score} | {teamB.name}: {teamB.score}
          </span>
        </div>
      </header>

      <div className="host-content">
        {currentRound ? (
          <>
            <section className="round-control">
              <div className="round-header">
                <h2>{currentRound.questionText}</h2>
                <span className="category">{currentRound.categoryName}</span>
                <span className="multiplier">Multiplicador: x{currentRound.multiplier}</span>
                <span className="round-score">Puntos en juego: {currentRound.roundScore}</span>
              </div>

              <div className="answers-control">
                {currentRound.answers.map((answer) => (
                  <div 
                    key={answer.id} 
                    className={`answer-control-row ${answer.isRevealed ? 'revealed' : 'hidden'}`}
                    onClick={() =>
                      answer.isRevealed
                        ? handleHideAnswer(answer.id)
                        : handleRevealAnswer(answer.id)
                    }
                  >
                    <span className="answer-pos">{answer.position}</span>
                    <span className="answer-text">{answer.text}</span>
                    <span className="answer-points">{answer.points} pts</span>
                  </div>
                ))}
              </div>

              <div className="team-control">
                <div className="team-buttons">
                  <div className={`team-section team-a-section ${currentRound.teamInTurn === 'A' ? 'in-turn' : ''}`}>
                    <div className="team-header">
                      <h4>{teamA.name}</h4>
                      <span className="strikes-badge">{'X'.repeat(teamA.strikes)}</span>
                    </div>
                    <div className="team-actions">
                      <button onClick={() => handleAddStrike('A')} className="btn btn-danger btn-compact">+X</button>
                      <button onClick={() => handleRemoveStrike('A')} className="btn btn-secondary btn-compact">-X</button>
                      <button
                        onClick={() => handleSetTeamInTurn('A')}
                        className={`btn btn-compact ${currentRound.teamInTurn === 'A' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {currentRound.teamInTurn === 'A' ? '✓ Turno' : 'Turno'}
                      </button>
                      <button onClick={() => handleAssignPoints('A')} className="btn btn-success btn-compact">🏆</button>
                    </div>
                  </div>

                  <div className={`team-section team-b-section ${currentRound.teamInTurn === 'B' ? 'in-turn' : ''}`}>
                    <div className="team-header">
                      <h4>{teamB.name}</h4>
                      <span className="strikes-badge">{'X'.repeat(teamB.strikes)}</span>
                    </div>
                    <div className="team-actions">
                      <button onClick={() => handleAddStrike('B')} className="btn btn-danger btn-compact">+X</button>
                      <button onClick={() => handleRemoveStrike('B')} className="btn btn-secondary btn-compact">-X</button>
                      <button
                        onClick={() => handleSetTeamInTurn('B')}
                        className={`btn btn-compact ${currentRound.teamInTurn === 'B' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {currentRound.teamInTurn === 'B' ? '✓ Turno' : 'Turno'}
                      </button>
                      <button onClick={() => handleAssignPoints('B')} className="btn btn-success btn-compact">🏆</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="no-round">
            <h2>No hay ronda activa</h2>
          </div>
        )}

        <section className="buzzer-control">
          <h3>Control de Botonera</h3>
          <div className="buzzer-status">
            {buzzerWinner ? (
              <p className={`winner-indicator team-${buzzerWinner.toLowerCase()}`}>
                🔔 {buzzerWinner === 'A' ? teamA.name : teamB.name} presionó primero
              </p>
            ) : (
              <p>Esperando presión de botón...</p>
            )}
          </div>
          <div className="buzzer-control-buttons">
            <button
              onClick={handleBuzzerReset}
              className="btn btn-secondary"
            >
              Resetear Botonera
            </button>
            <button
              onClick={() => setShowQR(true)}
              className="btn btn-accent"
            >
              QR Botoneras
            </button>
          </div>
        </section>

        {showQR && (
          <div className="host-qr-modal-overlay" onClick={() => setShowQR(false)}>
            <div className="host-qr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="host-qr-modal-header">
                <h3>QR Botoneras / Buzzers</h3>
                <button className="host-qr-close" onClick={() => setShowQR(false)}>✕</button>
              </div>
              <div className="host-qr-grid">
                <div className="host-qr-item">
                  <QRCodeSVG
                    value={`${window.location.origin}/buzzer/${gameId}`}
                    size={150}
                    level="M"
                    includeMargin
                  />
                  <span className="host-qr-label host-qr-label-dual">Dual (2 botones)</span>
                </div>
                <div className="host-qr-item">
                  <QRCodeSVG
                    value={`${window.location.origin}/buzzer/${gameId}/a`}
                    size={150}
                    level="M"
                    includeMargin
                  />
                  <span className="host-qr-label host-qr-label-a">Equipo A</span>
                </div>
                <div className="host-qr-item">
                  <QRCodeSVG
                    value={`${window.location.origin}/buzzer/${gameId}/b`}
                    size={150}
                    level="M"
                    includeMargin
                  />
                  <span className="host-qr-label host-qr-label-b">Equipo B</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="round-navigation">
          <h3>Navegación de Rondas</h3>
          <div className="nav-buttons">
            <button
              onClick={() => handleStartNextRound(1)}
              className="btn btn-primary"
            >
              Siguiente Ronda (x1)
            </button>
            <button
              onClick={() => handleStartNextRound(2)}
              className="btn btn-accent"
            >
              Siguiente Ronda (x2)
            </button>
            <button
              onClick={() => handleStartNextRound(3)}
              className="btn btn-accent"
            >
              Siguiente Ronda (x3)
            </button>
          </div>
        </section>

        <section className="theme-selector-section">
          <h3>Tema del Board</h3>
          <div className="theme-buttons">
            <button
              className={`btn-theme btn-theme-dark ${currentTheme === 'carnival-dark' ? 'active' : ''}`}
              onClick={() => handleChangeTheme('carnival-dark')}
            >
              <span className="theme-preview theme-preview-dark"></span>
              Oscuro
            </button>
            <button
              className={`btn-theme btn-theme-light ${currentTheme === 'carnival-light' ? 'active' : ''}`}
              onClick={() => handleChangeTheme('carnival-light')}
            >
              <span className="theme-preview theme-preview-light"></span>
              Claro
            </button>
          </div>
        </section>

        <section className="game-reset-section">
          <button onClick={handleOpenResetModal} className="btn btn-danger">
            Reiniciar Juego
          </button>
        </section>
      </div>

      {/* Confirm Assign Points Modal */}
      {confirmModal && (
        <div className="host-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="host-modal" onClick={(e) => e.stopPropagation()}>
            <div className="host-modal-header">
              <h3>Confirmar Asignación</h3>
              <button className="host-modal-close" onClick={() => setConfirmModal(null)}>✕</button>
            </div>
            <div className="host-modal-body">
              <p className="host-modal-message">
                ¿Asignar <strong>{currentRound?.roundScore ?? 0} puntos</strong> de esta ronda al equipo{' '}
                <strong className={`team-color-${confirmModal.team.toLowerCase()}`}>
                  {confirmModal.team === 'A' ? teamA.name : teamB.name}
                </strong>?
              </p>
              <div className="host-modal-actions">
                <button className="btn btn-secondary" onClick={() => setConfirmModal(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={confirmAssignPoints}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Game Modal */}
      {showResetModal && (
        <div className="host-modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="host-modal host-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="host-modal-header">
              <h3>Reiniciar Juego</h3>
              <button className="host-modal-close" onClick={() => setShowResetModal(false)}>✕</button>
            </div>
            <div className="host-modal-body">
              <div className="reset-form">
                <div className="reset-section">
                  <h4>Nombres de Equipos</h4>
                  <div className="reset-row">
                    <div className="reset-field">
                      <label>Equipo A</label>
                      <input
                        type="text"
                        value={resetForm.teamAName}
                        onChange={(e) => setResetForm(prev => ({ ...prev, teamAName: e.target.value }))}
                      />
                    </div>
                    <div className="reset-field">
                      <label>Equipo B</label>
                      <input
                        type="text"
                        value={resetForm.teamBName}
                        onChange={(e) => setResetForm(prev => ({ ...prev, teamBName: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="reset-section">
                  <div className="reset-section-header">
                    <h4>Marcadores</h4>
                    <button className="btn btn-secondary btn-compact" onClick={handleResetScoresToZero}>
                      Poner en 0
                    </button>
                  </div>
                  <div className="reset-row">
                    <div className="reset-field">
                      <label>Puntos {resetForm.teamAName}</label>
                      <input
                        type="number"
                        value={resetForm.teamAScore}
                        onChange={(e) => setResetForm(prev => ({ ...prev, teamAScore: e.target.value }))}
                      />
                    </div>
                    <div className="reset-field">
                      <label>Puntos {resetForm.teamBName}</label>
                      <input
                        type="number"
                        value={resetForm.teamBScore}
                        onChange={(e) => setResetForm(prev => ({ ...prev, teamBScore: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <p className="reset-note">Esto limpiará la pregunta actual e iniciará un nuevo juego.</p>
              </div>
              <div className="host-modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleResetGame}>Reiniciar Juego</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HostPage;
