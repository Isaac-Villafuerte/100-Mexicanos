import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config/env.js';
import { gameRoutes } from './routes/gameRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createExpressApp(dependencies) {
  const app = express();

  // CORS Configuration
  const corsOptions = {
    origin: (origin, callback) => {
      // Permitir requests sin origin (como Postman, curl, o mismo servidor)
      if (!origin) return callback(null, true);
      
      // En desarrollo, permitir todo si no hay orígenes configurados
      if (config.nodeEnv === 'development' && config.corsOrigins.length === 0) {
        return callback(null, true);
      }
      
      // Verificar si el origen está en la lista permitida
      if (config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Origin no permitido
      console.warn(`CORS bloqueado para origen: ${origin}`);
      callback(new Error('No permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };

  // Middleware
  app.use(cors(corsOptions));
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
