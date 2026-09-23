import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

/**
 * Get the database file path
 * Defaults to Tauri app database location
 * Can be overridden with ARCANUM_DB_PATH environment variable
 */
function getDatabasePath() {
  if (process.env.ARCANUM_DB_PATH) {
    return process.env.ARCANUM_DB_PATH;
  }

  const homeDir = os.homedir();
  return join(homeDir, 'Library', 'Application Support', 'com.arcanum.app', 'arcanum.db');
}

/**
 * Apply schema additions to the database
 * Creates missing tables needed by the MCP server
 */
function applySchemaAdditions(database) {
  try {
    const schemaPath = join(__dirname, '..', 'schema-additions.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    database.exec(schema);
    console.error('Schema additions applied successfully');
  } catch (error) {
    console.error('Warning: Could not apply schema additions:', error.message);
  }
}

/**
 * Get or create the database connection
 * Uses singleton pattern to ensure only one connection exists
 */
export function getDatabase() {
  if (!db) {
    const dbPath = getDatabasePath();
    console.error(`Connecting to database at: ${dbPath}`);

    try {
      db = new Database(dbPath);

      // Enable WAL mode for better concurrency
      db.pragma('journal_mode = WAL');

      // Enable foreign keys
      db.pragma('foreign_keys = ON');

      // Apply schema additions
      applySchemaAdditions(db);

      console.error('Database connection established');
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      throw error;
    }
  }

  return db;
}

/**
 * Close the database connection gracefully
 */
export function closeDatabase() {
  if (db) {
    try {
      db.close();
      console.error('Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error.message);
    }
    db = null;
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
