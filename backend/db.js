import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.db');

let db;

// Initialize database connection
export function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
    db.configure('busyTimeout', 5000);
  }
  return db;
}

// Promise wrapper for database operations
export function runAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function getAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Initialize tables
async function initializeTables() {
  const database = getDatabase();
  
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      institution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createProjectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  const createSavedPapersTable = `
    CREATE TABLE IF NOT EXISTS saved_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      openalex_id TEXT NOT NULL,
      title TEXT NOT NULL,
      authors TEXT,
      doi TEXT,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, openalex_id)
    )
  `;

  const createCachedPapersTable = `
    CREATE TABLE IF NOT EXISTS cached_papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openalex_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      abstract TEXT,
      authors TEXT,
      journal TEXT,
      year INTEGER,
      doi TEXT,
      citation_count INTEGER DEFAULT 0,
      is_oa BOOLEAN DEFAULT 0,
      pdf_url TEXT,
      openalex_data TEXT,
      source TEXT DEFAULT 'OpenAlex',
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_saved_papers_project_id ON saved_papers(project_id)',
    'CREATE INDEX IF NOT EXISTS idx_cached_papers_doi ON cached_papers(doi)',
    'CREATE INDEX IF NOT EXISTS idx_cached_papers_year ON cached_papers(year)'
  ];

  return new Promise((resolve, reject) => {
    database.serialize(() => {
      database.run(createUsersTable, (err) => {
        if (err) console.error('Users table error:', err);
      });
      database.run(createProjectsTable, (err) => {
        if (err) console.error('Projects table error:', err);
      });
      database.run(createSavedPapersTable, (err) => {
        if (err) console.error('SavedPapers table error:', err);
      });
      database.run(createCachedPapersTable, (err) => {
        if (err) console.error('CachedPapers table error:', err);
      });

      createIndexes.forEach((indexQuery) => {
        database.run(indexQuery, (err) => {
          if (err) console.error('Index creation error:', err);
        });
      });

      database.exec('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Foreign keys pragma error:', err);
          reject(err);
        } else {
          console.log('Database tables initialized and foreign keys enabled');
          resolve();
        }
      });
    });
  });
}

export default async function initializeDatabase() {
  try {
    getDatabase();
    await initializeTables();
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}