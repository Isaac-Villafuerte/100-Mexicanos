-- Database schema for 100 Mexicanos Dijeron

CREATE DATABASE IF NOT EXISTS mexicanos_dijeron CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mexicanos_dijeron;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_active (category_id, is_active)
) ENGINE=InnoDB;

-- Question answers table
CREATE TABLE IF NOT EXISTS question_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  text VARCHAR(255) NOT NULL,
  points INT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_question (question_id)
) ENGINE=InnoDB;

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  target_score INT NOT NULL DEFAULT 300,
  status ENUM('pending', 'running', 'finished') DEFAULT 'pending',
  current_round_number INT DEFAULT 0,
  team_a_name VARCHAR(100) NOT NULL,
  team_b_name VARCHAR(100) NOT NULL,
  team_a_score INT DEFAULT 0,
  team_b_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  question_id INT NOT NULL,
  round_number INT NOT NULL,
  multiplier INT DEFAULT 1,
  team_in_turn ENUM('A', 'B') DEFAULT 'A',
  team_a_round_points INT DEFAULT 0,
  team_b_round_points INT DEFAULT 0,
  state ENUM('not_started', 'in_progress', 'finished') DEFAULT 'not_started',
  strikes_team_a INT DEFAULT 0,
  strikes_team_b INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id),
  INDEX idx_game_round (game_id, round_number)
) ENGINE=InnoDB;

-- Round answer states table
CREATE TABLE IF NOT EXISTS round_answer_state (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_id INT NOT NULL,
  question_answer_id INT NOT NULL,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (question_answer_id) REFERENCES question_answers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_round_answer (round_id, question_answer_id)
) ENGINE=InnoDB;

-- Insert some default categories
INSERT INTO categories (name, description) VALUES 
  ('General', 'Preguntas de cultura general'),
  ('Familia', 'Preguntas sobre la vida familiar'),
  ('Comida', 'Preguntas sobre alimentos y bebidas'),
  ('Entretenimiento', 'Preguntas sobre películas, música y TV');

-- Insert a sample question
INSERT INTO questions (category_id, text) VALUES 
  (1, '¿Qué es lo primero que haces al despertar?');

-- Insert sample answers
INSERT INTO question_answers (question_id, text, points, position) VALUES 
  (1, 'Revisar el celular', 45, 1),
  (1, 'Ir al baño', 30, 2),
  (1, 'Desayunar', 12, 3),
  (1, 'Bañarse', 8, 4),
  (1, 'Estirarse', 5, 5);
