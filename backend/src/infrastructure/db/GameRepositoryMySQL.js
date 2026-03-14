import { GameRepository } from '../../domain/repositories/GameRepository.js';
import { Game } from '../../domain/entities/Game.js';
import { Round } from '../../domain/entities/Round.js';
import { getPool } from './mysqlClient.js';

export class GameRepositoryMySQL extends GameRepository {
  async create(game) {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO games (title, target_score, status, team_a_name, team_b_name, team_a_score, team_b_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        game.title,
        game.targetScore,
        game.status,
        game.teamAName,
        game.teamBName,
        game.teamAScore,
        game.teamBScore
      ]
    );
    return { ...game, id: result.insertId };
  }

  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM games WHERE id = ?', [id]);
    
    if (rows.length === 0) return null;

    return Game.create({
      id: rows[0].id,
      title: rows[0].title,
      targetScore: rows[0].target_score,
      status: rows[0].status,
      currentRoundNumber: rows[0].current_round_number,
      teamAName: rows[0].team_a_name,
      teamBName: rows[0].team_b_name,
      teamAScore: rows[0].team_a_score,
      teamBScore: rows[0].team_b_score
    });
  }

  async update(id, data) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.currentRoundNumber !== undefined) {
      fields.push('current_round_number = ?');
      values.push(data.currentRoundNumber);
    }
    if (data.teamAScore !== undefined) {
      fields.push('team_a_score = ?');
      values.push(data.teamAScore);
    }
    if (data.teamBScore !== undefined) {
      fields.push('team_b_score = ?');
      values.push(data.teamBScore);
    }
    if (data.teamAName !== undefined) {
      fields.push('team_a_name = ?');
      values.push(data.teamAName);
    }
    if (data.teamBName !== undefined) {
      fields.push('team_b_name = ?');
      values.push(data.teamBName);
    }

    if (fields.length === 0) return;

    values.push(id);
    await pool.execute(
      `UPDATE games SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async createRound(round) {
    const pool = getPool();
    const [result] = await pool.execute(
      `INSERT INTO rounds (game_id, question_id, round_number, multiplier, team_in_turn, state) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        round.gameId,
        round.questionId,
        round.roundNumber,
        round.multiplier,
        round.teamInTurn,
        round.state
      ]
    );
    return result.insertId;
  }

  async findRoundById(roundId) {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM rounds WHERE id = ?', [roundId]);
    
    if (rows.length === 0) return null;

    const answerStates = await this.getAnswerStates(roundId);

    return Round.create({
      id: rows[0].id,
      gameId: rows[0].game_id,
      questionId: rows[0].question_id,
      roundNumber: rows[0].round_number,
      multiplier: rows[0].multiplier,
      teamInTurn: rows[0].team_in_turn,
      teamARoundPoints: rows[0].team_a_round_points,
      teamBRoundPoints: rows[0].team_b_round_points,
      state: rows[0].state,
      strikesTeamA: rows[0].strikes_team_a,
      strikesTeamB: rows[0].strikes_team_b,
      answerStates
    });
  }

  async findCurrentRound(gameId) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM rounds WHERE game_id = ? AND state != ? ORDER BY round_number DESC LIMIT 1',
      [gameId, 'finished']
    );
    
    if (rows.length === 0) return null;

    return this.findRoundById(rows[0].id);
  }

  async updateRound(roundId, data) {
    const pool = getPool();
    const fields = [];
    const values = [];
    
    if (data.state !== undefined) {
      fields.push('state = ?');
      values.push(data.state);
    }
    if (data.teamInTurn !== undefined) {
      fields.push('team_in_turn = ?');
      values.push(data.teamInTurn);
    }
    if (data.strikesTeamA !== undefined) {
      fields.push('strikes_team_a = ?');
      values.push(data.strikesTeamA);
    }
    if (data.strikesTeamB !== undefined) {
      fields.push('strikes_team_b = ?');
      values.push(data.strikesTeamB);
    }

    if (fields.length === 0) return;

    values.push(roundId);
    await pool.execute(
      `UPDATE rounds SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async setAnswerState(roundId, answerId, isRevealed) {
    const pool = getPool();
    await pool.execute(
      `INSERT INTO round_answer_state (round_id, question_answer_id, is_revealed) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE is_revealed = ?`,
      [roundId, answerId, isRevealed, isRevealed]
    );
  }

  async getAnswerStates(roundId) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM round_answer_state WHERE round_id = ?',
      [roundId]
    );
    
    return rows.map(row => ({
      id: row.id,
      roundId: row.round_id,
      questionAnswerId: row.question_answer_id,
      isRevealed: row.is_revealed
    }));
  }
}
