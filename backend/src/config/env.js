import dotenv from 'dotenv';

dotenv.config();

// Parsear orígenes CORS desde variable de entorno (separados por coma)
const parseCorsOrigins = () => {
  const origins = process.env.CORS_ORIGINS || '';
  if (!origins) return [];
  return origins.split(',').map(origin => origin.trim()).filter(Boolean);
};

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // CORS: Lista de orígenes permitidos
  corsOrigins: parseCorsOrigins(),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mexicanos_dijeron'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  logger: {
    password: process.env.LOGGER_PASSWORD || 'xido@admin'
  }
};
