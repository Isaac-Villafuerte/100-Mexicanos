import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { gameRoutes } from './routes/gameRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp(dependencies) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/game', gameRoutes(dependencies));
  app.use('/api/admin', adminRoutes(dependencies));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: '100 Mexicanos Dijeron API' });
  });

  // Serve static frontend files (production)
  const publicPath = path.join(__dirname, '../../../public');
  app.use(express.static(publicPath));

  // SPA fallback - serve index.html for any non-API route
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
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
