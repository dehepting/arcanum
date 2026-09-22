#!/usr/bin/env node

/**
 * Download all files from Supabase Storage buckets
 *
 * Usage: node download-files.js
 *
 * This script downloads all files from Supabase Storage and saves them
 * in the same structure that will be used in local storage
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Output directory for downloaded files
const OUTPUT_DIR = path.join(__dirname, 'files');

/**
 * Download a single file
 */
async function downloadFile(bucket, filePath, outputPath) {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(filePath);

    if (error) throw error;

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Convert blob to buffer and save
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);

    return true;
  } catch (error) {
    console.error(`  ✗ Error downloading ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Recursively list all files in a bucket
 */
async function listAllFiles(bucket, prefix = '') {
  const allFiles = [];

  try {
    const { data: files, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;

    for (const file of files || []) {
      const filePath = prefix ? `${prefix}/${file.name}` : file.name;

      if (file.id === null) {
        // This is a folder, recurse into it
        const subFiles = await listAllFiles(bucket, filePath);
        allFiles.push(...subFiles);
      } else {
        // This is a file
        allFiles.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error listing files in ${bucket}/${prefix}:`, error.message);
  }

  return allFiles;
}

/**
 * Download all files from a bucket
 */
async function downloadBucket(bucketName) {
  console.log(`\nDownloading files from bucket: ${bucketName}`);

  const files = await listAllFiles(bucketName);
  console.log(`Found ${files.length} files`);

  let downloaded = 0;
  let failed = 0;

  for (const filePath of files) {
    const outputPath = path.join(OUTPUT_DIR, bucketName, filePath);
    process.stdout.write(`  Downloading ${filePath}...`);

    const success = await downloadFile(bucketName, filePath, outputPath);

    if (success) {
      console.log(' ✓');
      downloaded++;
    } else {
      console.log(' ✗');
      failed++;
    }
  }

  console.log(`✓ Downloaded ${downloaded} files from ${bucketName}`);
  if (failed > 0) {
    console.log(`✗ Failed to download ${failed} files`);
  }

  return { downloaded, failed, total: files.length };
}

/**
 * Main download function
 */
async function downloadAllFiles() {
  console.log('Starting file download from Supabase Storage...');

  const buckets = ['artifacts', 'sources', 'map-overlays', 'entity-pages'];

  const stats = {};

  for (const bucket of buckets) {
    stats[bucket] = await downloadBucket(bucket);
  }

  // Save download statistics
  const statsPath = path.join(OUTPUT_DIR, '_download_stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

  console.log('\n=== Download Complete ===');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log('\nBucket breakdown:');
  Object.entries(stats).forEach(([bucket, stat]) => {
    console.log(`  ${bucket}: ${stat.downloaded}/${stat.total} files`);
  });
}

// Run download
downloadAllFiles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
