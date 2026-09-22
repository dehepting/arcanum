#!/usr/bin/env node

/**
 * Export all data from Supabase to JSON files for migration to local SQLite
 *
 * Usage: node export-from-supabase.js
 *
 * Requires:
 * - VITE_SUPABASE_URL env var
 * - VITE_SUPABASE_ANON_KEY env var
 * - @supabase/supabase-js package
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Output directory for exported data
const OUTPUT_DIR = path.join(__dirname, 'data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Export data from a table to a JSON file
 */
async function exportTable(tableName, selectQuery = '*') {
  console.log(`Exporting ${tableName}...`);

  try {
    const { data, error } = await supabase.from(tableName).select(selectQuery);

    if (error) throw error;

    const filePath = path.join(OUTPUT_DIR, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✓ Exported ${data?.length || 0} records from ${tableName}`);
    return data?.length || 0;
  } catch (error) {
    console.error(`✗ Error exporting ${tableName}:`, error.message);
    return 0;
  }
}

/**
 * Export list of files from a storage bucket
 */
async function exportBucketFileList(bucketName) {
  console.log(`Listing files in bucket: ${bucketName}...`);

  try {
    const { data, error } = await supabase.storage.from(bucketName).list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;

    const filePath = path.join(OUTPUT_DIR, `${bucketName}_files.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`✓ Listed ${data?.length || 0} files from ${bucketName}`);
    return data?.length || 0;
  } catch (error) {
    console.error(`✗ Error listing ${bucketName}:`, error.message);
    return 0;
  }
}

/**
 * Main export function
 */
async function exportAllData() {
  console.log('Starting Supabase data export...\n');

  const stats = {
    tables: {},
    buckets: {},
    total: 0,
  };

  // Export all tables
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
    'provenance_records',
  ];

  for (const table of tables) {
    const count = await exportTable(table);
    stats.tables[table] = count;
    stats.total += count;
  }

  console.log('\n');

  // Export storage bucket file lists
  const buckets = ['artifacts', 'sources', 'map-overlays', 'entity-pages'];

  for (const bucket of buckets) {
    const count = await exportBucketFileList(bucket);
    stats.buckets[bucket] = count;
  }

  // Save export statistics
  const statsPath = path.join(OUTPUT_DIR, '_export_stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

  console.log('\n=== Export Complete ===');
  console.log(`Total records exported: ${stats.total}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('\nTable breakdown:');
  Object.entries(stats.tables).forEach(([table, count]) => {
    console.log(`  ${table}: ${count}`);
  });
  console.log('\nStorage buckets:');
  Object.entries(stats.buckets).forEach(([bucket, count]) => {
    console.log(`  ${bucket}: ${count} files`);
  });
}

// Run export
exportAllData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
