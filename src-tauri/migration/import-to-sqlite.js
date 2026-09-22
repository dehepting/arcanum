#!/usr/bin/env node

/**
 * Import exported data into SQLite database
 *
 * Usage: node import-to-sqlite.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILES_DIR = path.join(__dirname, 'files');
const DB_PATH = path.join(__dirname, '..', '..', 'arcanum.db');
const STORAGE_PATH = path.join(__dirname, '..', '..', 'storage');

/**
 * Import data from a JSON file into a table
 */
function importTable(db, tableName, jsonFile) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(DATA_DIR, jsonFile);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⊘ Skipping ${tableName} (no data file)`);
      resolve({ table: tableName, imported: 0, skipped: 0 });
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`  ⊘ Skipping ${tableName} (empty)`);
      resolve({ table: tableName, imported: 0, skipped: 0 });
      return;
    }

    let imported = 0;
    let failed = 0;

    // Get table schema to know which columns exist
    db.all(`PRAGMA table_info(${tableName})`, (err, tableInfo) => {
      if (err) {
        reject(err);
        return;
      }

      const validColumns = tableInfo.map((col) => col.name);

      // Filter to only columns that exist in the table
      const recordColumns = Object.keys(data[0]);
      let columns = recordColumns.filter((col) => validColumns.includes(col));

      // Add timestamp columns if they exist in schema but not in data
      if (validColumns.includes('created_at') && !columns.includes('created_at')) {
        columns.push('created_at');
      }
      if (validColumns.includes('updated_at') && !columns.includes('updated_at')) {
        columns.push('updated_at');
      }
      // Add file_name with default for sources
      if (
        tableName === 'sources' &&
        validColumns.includes('file_name') &&
        !columns.includes('file_name')
      ) {
        columns.push('file_name');
      }

      const placeholders = columns.map(() => '?').join(', ');
      const columnNames = columns.join(', ');

      const stmt = db.prepare(
        `INSERT OR REPLACE INTO ${tableName} (${columnNames}) VALUES (${placeholders})`
      );

      data.forEach((record) => {
        const values = columns.map((col) => {
          let val = record[col];

          // Provide defaults for missing columns
          if (val === null || val === undefined) {
            if (col === 'created_at' || col === 'updated_at') {
              val = new Date().toISOString();
            } else if (col === 'file_name') {
              val = record['title'] || 'untitled.pdf';
            }
          }

          // Convert objects to JSON strings
          if (val !== null && typeof val === 'object') {
            return JSON.stringify(val);
          }
          return val;
        });

        stmt.run(values, (err) => {
          if (err) {
            failed++;
            console.error(`    ✗ Error inserting record:`, err.message);
          } else {
            imported++;
          }
        });
      });

      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`  ✓ ${tableName}: ${imported} records`);
          resolve({ table: tableName, imported, failed });
        }
      });
    });
  });
}

/**
 * Copy files from migration directory to app storage
 */
function copyFiles() {
  console.log('\nCopying files to storage...');

  const buckets = ['artifacts', 'sources', 'map-overlays', 'entity-pages'];
  let copied = 0;

  buckets.forEach((bucket) => {
    const sourceDir = path.join(FILES_DIR, bucket);
    const destDir = path.join(STORAGE_PATH, bucket);

    if (!fs.existsSync(sourceDir)) {
      return;
    }

    // Create destination directory
    fs.mkdirSync(destDir, { recursive: true });

    // Copy files recursively
    const copyRecursive = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((item) => {
          copyRecursive(path.join(src, item), path.join(dest, item));
        });
      } else {
        fs.copyFileSync(src, dest);
        copied++;
      }
    };

    try {
      copyRecursive(sourceDir, destDir);
    } catch (error) {
      console.error(`  ✗ Error copying ${bucket}:`, error.message);
    }
  });

  console.log(`  ✓ Copied ${copied} files to storage`);
}

/**
 * Main import function
 */
async function importData() {
  console.log('Starting SQLite import...\n');

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error('✗ Data directory not found. Run export-from-supabase.js first.');
    process.exit(1);
  }

  // Create storage directory
  fs.mkdirSync(STORAGE_PATH, { recursive: true });

  // Open or create database
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('✗ Error opening database:', err);
      process.exit(1);
    }
    console.log(`✓ Database: ${DB_PATH}\n`);
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  console.log('Importing tables...\n');

  const results = [];

  // Import in dependency order
  const tables = [
    'projects',
    'places',
    'artifacts',
    'people',
    'events',
    'theories',
    'entity_pages',
    'entity_links',
    'sources',
    'annotations',
    'annotation_people_links',
    'annotation_theories_links',
    'annotation_place_links',
    'map_overlays',
  ];

  for (const table of tables) {
    try {
      const result = await importTable(db, table, `${table}.json`);
      results.push(result);
    } catch (error) {
      console.error(`✗ Error importing ${table}:`, error);
    }
  }

  // Close database
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
  });

  // Copy files
  copyFiles();

  // Summary
  const totalImported = results.reduce((sum, r) => sum + r.imported, 0);

  console.log('\n=== Import Complete ===');
  console.log(`Total records imported: ${totalImported}`);
  console.log(`Database location: ${DB_PATH}`);
  console.log(`Storage location: ${STORAGE_PATH}`);
  console.log('\n✓ Migration complete! You can now run the Tauri app.');
}

// Run import
importData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
