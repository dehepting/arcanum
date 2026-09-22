#!/usr/bin/env node

/**
 * Verify data migration by comparing counts between exported JSON and SQLite
 *
 * Usage: node verify-migration.js
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(__dirname, '..', '..', 'arcanum.db'); // Adjust path as needed

/**
 * Count records in a JSON file
 */
function countJsonRecords(tableName) {
  try {
    const filePath = path.join(DATA_DIR, `${tableName}.json`);
    if (!fs.existsSync(filePath)) {
      return 0;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.error(`Error reading ${tableName}.json:`, error.message);
    return -1;
  }
}

/**
 * Count records in SQLite table
 */
function countSqliteRecords(db, tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
      if (err) {
        resolve(-1);
      } else {
        resolve(row.count);
      }
    });
  });
}

/**
 * Verify a single table
 */
async function verifyTable(db, tableName) {
  const jsonCount = countJsonRecords(tableName);
  const sqliteCount = await countSqliteRecords(db, tableName);

  const match = jsonCount === sqliteCount;
  const status = match ? '✓' : '✗';

  return {
    table: tableName,
    json: jsonCount,
    sqlite: sqliteCount,
    match,
    status,
  };
}

/**
 * Main verification function
 */
async function verifyMigration() {
  console.log('Starting migration verification...\n');

  // Check if DB exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`✗ SQLite database not found at: ${DB_PATH}`);
    console.error('Make sure migration has been run and DB path is correct');
    process.exit(1);
  }

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`✗ Data directory not found at: ${DATA_DIR}`);
    console.error('Run export-from-supabase.js first');
    process.exit(1);
  }

  const db = new sqlite3.Database(DB_PATH);

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

  const results = [];
  let allMatch = true;

  console.log('Table                          | JSON  | SQLite | Status');
  console.log('-------------------------------|-------|--------|-------');

  for (const table of tables) {
    const result = await verifyTable(db, table);
    results.push(result);

    if (!result.match) {
      allMatch = false;
    }

    const jsonStr = result.json >= 0 ? result.json.toString() : 'ERR';
    const sqliteStr = result.sqlite >= 0 ? result.sqlite.toString() : 'ERR';

    console.log(
      `${table.padEnd(30)} | ${jsonStr.padStart(5)} | ${sqliteStr.padStart(6)} | ${result.status}`
    );
  }

  db.close();

  console.log('\n=== Verification Summary ===');

  if (allMatch) {
    console.log('✓ All tables match! Migration successful.');
  } else {
    console.log('✗ Some tables do not match. Review results above.');
    const mismatched = results.filter((r) => !r.match);
    console.log('\nMismatched tables:');
    mismatched.forEach((r) => {
      console.log(`  ${r.table}: JSON=${r.json}, SQLite=${r.sqlite}`);
    });
  }

  // Save results
  const resultsPath = path.join(DATA_DIR, '_verification_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);

  process.exit(allMatch ? 0 : 1);
}

// Run verification
verifyMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
