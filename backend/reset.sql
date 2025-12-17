-- Reset completo de la base de datos 100 Mexicanos Dijeron
-- Ejecutar con: mysql -u usuario -p nombre_db < reset.sql

-- Eliminar datos en orden correcto (hijos primero)
DELETE FROM round_answer_state;
DELETE FROM rounds;
DELETE FROM games;
DELETE FROM question_answers;
DELETE FROM questions;
DELETE FROM categories;

-- Reiniciar AUTO_INCREMENT
ALTER TABLE round_answer_state AUTO_INCREMENT = 1;
ALTER TABLE rounds AUTO_INCREMENT = 1;
ALTER TABLE games AUTO_INCREMENT = 1;
ALTER TABLE question_answers AUTO_INCREMENT = 1;
ALTER TABLE questions AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;

-- Listo para empezar desde cero
