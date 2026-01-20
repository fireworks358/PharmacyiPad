/**
 * Migration Script: CSV to JSONBin.io
 *
 * This script reads your CSV file and creates a new JSONBin with the data.
 *
 * Usage:
 * 1. Get a JSONBin.io account at https://jsonbin.io
 * 2. Copy your Master Key from the API Keys section
 * 3. Run: JSONBIN_API_KEY=your-key node scripts/migrate-to-jsonbin.js
 * 4. Copy the Bin ID from the output and add it to your .env file
 */

import { readFileSync } from 'fs';
import { parse } from 'papaparse';

const API_KEY = process.env.JSONBIN_API_KEY;

if (!API_KEY) {
  console.error('Error: Please provide your JSONBin API key');
  console.error('Usage: JSONBIN_API_KEY=your-key node scripts/migrate-to-jsonbin.js');
  process.exit(1);
}

// Read and parse CSV
const csvPath = new URL('../Items - Items.csv', import.meta.url);
const csvText = readFileSync(csvPath, 'utf-8');

const { data } = parse(csvText, {
  header: true,
  skipEmptyLines: true,
});

// Transform to app's data structure
const drugs = data.map((row) => {
  const barcodes = [row['Barcode'], row['Barcode2'], row['Barcode3']].filter(Boolean);

  return {
    id: row['Item ID'] || Math.random().toString(16).substring(2, 10).toUpperCase(),
    name: row['Name'] || '',
    drugType: row['Drug Type'] || '',
    location: row['Location'] || '',
    outOfStock: row['Out_of_Stock']?.toLowerCase() === 'out of stock',
    notes: row['Notes'] || '',
    hasNotes: Boolean(row['Notes']?.trim()),
    image: row['Image'] || null,
    barcodes,
  };
});

console.log(`Parsed ${drugs.length} drugs from CSV`);

// Create JSONBin
async function createBin() {
  const response = await fetch('https://api.jsonbin.io/v3/b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY,
      'X-Bin-Name': 'pharmacy-drugs',
      'X-Bin-Private': 'false',
    },
    body: JSON.stringify({
      drugs,
      lastUpdated: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create bin:', error);
    process.exit(1);
  }

  const result = await response.json();

  console.log('\n✅ Successfully created JSONBin!');
  console.log('\n📋 Add these to your .env file:\n');
  console.log(`VITE_JSONBIN_BIN_ID=${result.metadata.id}`);
  console.log(`VITE_JSONBIN_API_KEY=${API_KEY}`);
  console.log('\nBin URL:', `https://api.jsonbin.io/v3/b/${result.metadata.id}`);
}

createBin();
