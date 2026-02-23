import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import initializeDatabase from './db.js';
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import papersRoutes from './routes/papers.js';
import projectsRoutes from './routes/projects.js';
import citationsRoutes from './routes/citations.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://0.0.0.0:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize database
await initializeDatabase();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ScholarNaija API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/papers', papersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/citations', citationsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ScholarNaija API running on http://0.0.0.0:${PORT}`);
  console.log('Database initialized and ready');
});

export default app;