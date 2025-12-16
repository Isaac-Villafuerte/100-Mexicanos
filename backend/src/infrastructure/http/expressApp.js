import express from 'express';
import cors from 'cors';
import { gameRoutes } from './routes/gameRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

export function createExpressApp(dependencies) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/game', gameRoutes(dependencies));
  app.use('/api/admin', adminRoutes(dependencies));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '100 Mexicanos Dijeron API' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });

  return app;
}
