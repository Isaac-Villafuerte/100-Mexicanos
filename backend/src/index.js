import http from 'http';
import './logger.js'; // Captura console.log y errores desde el inicio
import { config } from './config/env.js';
import { testConnection } from './infrastructure/db/mysqlClient.js';
import { createExpressApp } from './infrastructure/http/expressApp.js';
import { createSocketServer } from './infrastructure/realtime/socketServer.js';

// Repositories
import { CategoryRepositoryMySQL } from './infrastructure/db/CategoryRepositoryMySQL.js';
import { QuestionRepositoryMySQL } from './infrastructure/db/QuestionRepositoryMySQL.js';
import { GameRepositoryMySQL } from './infrastructure/db/GameRepositoryMySQL.js';

// AI Services
import { ImageQuestionExtractor } from './infrastructure/ai/imageQuestionExtractor.js';
import { AnswersSuggester } from './infrastructure/ai/answersSuggester.js';

// Use Cases
import { CreateGameUseCase } from './application/usecases/CreateGameUseCase.js';
import { StartNextRoundUseCase } from './application/usecases/StartNextRoundUseCase.js';
import { ToggleAnswerUseCase } from './application/usecases/ToggleAnswerUseCase.js';
import { AddStrikeUseCase } from './application/usecases/AddStrikeUseCase.js';
import { SetTeamInTurnUseCase } from './application/usecases/SetTeamInTurnUseCase.js';
import { AssignRoundPointsUseCase } from './application/usecases/AssignRoundPointsUseCase.js';
import { CreateQuestionUseCase } from './application/usecases/CreateQuestionUseCase.js';
import { ImportQuestionFromImageUseCase } from './application/usecases/ImportQuestionFromImageUseCase.js';
import { SuggestAnswersWithAIUseCase } from './application/usecases/SuggestAnswersWithAIUseCase.js';
import { GetGameStateUseCase } from './application/usecases/GetGameStateUseCase.js';
import logger from './logger.js';

async function bootstrap() {
  console.log('🚀 Starting 100 Mexicanos Dijeron backend...');

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Initialize repositories
  const categoryRepository = new CategoryRepositoryMySQL();
  const questionRepository = new QuestionRepositoryMySQL();
  const gameRepository = new GameRepositoryMySQL();

  // Initialize AI services
  const imageQuestionExtractor = new ImageQuestionExtractor();
  const answersSuggester = new AnswersSuggester();

  // Initialize use cases
  const createGameUseCase = new CreateGameUseCase(gameRepository);
  const startNextRoundUseCase = new StartNextRoundUseCase(gameRepository, questionRepository);
  const toggleAnswerUseCase = new ToggleAnswerUseCase(gameRepository);
  const addStrikeUseCase = new AddStrikeUseCase(gameRepository);
  const setTeamInTurnUseCase = new SetTeamInTurnUseCase(gameRepository);
  const assignRoundPointsUseCase = new AssignRoundPointsUseCase(gameRepository, questionRepository);
  const createQuestionUseCase = new CreateQuestionUseCase(questionRepository);
  const importQuestionFromImageUseCase = new ImportQuestionFromImageUseCase(
    imageQuestionExtractor,
    categoryRepository
  );
  const suggestAnswersWithAIUseCase = new SuggestAnswersWithAIUseCase(answersSuggester);
  const getGameStateUseCase = new GetGameStateUseCase(gameRepository, questionRepository);

  // Bundle dependencies
  const dependencies = {
    // Repositories
    categoryRepository,
    questionRepository,
    gameRepository,
    // Use cases
    createGameUseCase,
    startNextRoundUseCase,
    toggleAnswerUseCase,
    addStrikeUseCase,
    setTeamInTurnUseCase,
    assignRoundPointsUseCase,
    createQuestionUseCase,
    importQuestionFromImageUseCase,
    suggestAnswersWithAIUseCase,
    getGameStateUseCase
  };

  // Create Express app
  const app = createExpressApp(dependencies);

  // Configure logger routes
  logger(app);

  // Create HTTP server
  const httpServer = http.createServer(app);

  // Create Socket.IO server
  const io = createSocketServer(httpServer, dependencies);

  // Add io to dependencies for HTTP routes
  dependencies.io = io;

  // Start server
  httpServer.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`📡 HTTP API: http://localhost:${config.port}`);
    console.log(`🔌 Socket.IO: ws://localhost:${config.port}`);
    console.log(`🎮 Ready to play!`);
  });
}

bootstrap().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
