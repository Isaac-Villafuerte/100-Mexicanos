import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import '../styles/pages/_host.scss';

function HostPage() {
  const { gameId } = useParams();
  const { gameState, isConnected, emit } = useSocket(gameId, 'host');

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
    if (window.confirm(`¿Asignar puntos de esta ronda al equipo ${winnerTeam}?`)) {
      emit('ASSIGN_ROUND_POINTS', {
        gameId,
        roundId: gameState.currentRound.id,
        winnerTeam
      });
    }
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
                <h3>Respuestas</h3>
                {currentRound.answers.map((answer) => (
                  <div key={answer.id} className="answer-control-row">
                    <span className="answer-pos">{answer.position}</span>
                    <span className="answer-text">{answer.text}</span>
                    <span className="answer-points">{answer.points}</span>
                    <span className={`answer-status ${answer.isRevealed ? 'revealed' : 'hidden'}`}>
                      {answer.isRevealed ? '👁️ Visible' : '🔒 Oculta'}
                    </span>
                    <button
                      onClick={() =>
                        answer.isRevealed
                          ? handleHideAnswer(answer.id)
                          : handleRevealAnswer(answer.id)
                      }
                      className="btn btn-small"
                    >
                      {answer.isRevealed ? 'Ocultar' : 'Revelar'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="team-control">
                <h3>Control de Equipos</h3>
                <div className="team-buttons">
                  <div className="team-section">
                    <h4>{teamA.name}</h4>
                    <p>Strikes: {teamA.strikes}/3</p>
                    <button
                      onClick={() => handleAddStrike('A')}
                      className="btn btn-danger"
                    >
                      Strike
                    </button>
                    <button
                      onClick={() => handleRemoveStrike('A')}
                      className="btn btn-secondary"
                    >
                      Quitar Strike
                    </button>
                    <button
                      onClick={() => handleSetTeamInTurn('A')}
                      className={`btn ${currentRound.teamInTurn === 'A' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {currentRound.teamInTurn === 'A' ? '✓ En turno' : 'Dar turno'}
                    </button>
                    <button
                      onClick={() => handleAssignPoints('A')}
                      className="btn btn-success"
                    >
                      Asignar Puntos
                    </button>
                  </div>

                  <div className="team-section">
                    <h4>{teamB.name}</h4>
                    <p>Strikes: {teamB.strikes}/3</p>
                    <button
                      onClick={() => handleAddStrike('B')}
                      className="btn btn-danger"
                    >
                      Strike
                    </button>
                    <button
                      onClick={() => handleRemoveStrike('B')}
                      className="btn btn-secondary"
                    >
                      Quitar Strike
                    </button>
                    <button
                      onClick={() => handleSetTeamInTurn('B')}
                      className={`btn ${currentRound.teamInTurn === 'B' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {currentRound.teamInTurn === 'B' ? '✓ En turno' : 'Dar turno'}
                    </button>
                    <button
                      onClick={() => handleAssignPoints('B')}
                      className="btn btn-success"
                    >
                      Asignar Puntos
                    </button>
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
      </div>
    </div>
  );
}

export default HostPage;
