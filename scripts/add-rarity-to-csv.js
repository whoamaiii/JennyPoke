#!/usr/bin/env node

/**
 * Add Rarity Data to CSV Script
 *
 * This script reads the downloaded_cards.csv file, fetches rarity and name data
 * from the Pokemon TCG API, and updates the CSV with this information.
 *
 * Usage:
 *   node scripts/add-rarity-to-csv.js
 *
 * Requirements:
 *   - Node.js 18+
 *   - Pokemon TCG API key in .env.local
 */

import fs from 'fs/promises';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_PATH = path.join(__dirname, '../public/downloaded_cards.csv');
const API_BASE = 'https://api.pokemontcg.io/v2';
const RATE_LIMIT_DELAY = 200; // ms between requests to respect API rate limits
const BATCH_SIZE = 10; // Process cards in batches

// Load API key from environment
config({ path: path.join(__dirname, '../.env.local') });
const API_KEY = process.env.VITE_POKEMON_TCG_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: VITE_POKEMON_TCG_API_KEY not found in .env.local');
  process.exit(1);
}

/**
 * Fetch card details from Pokemon TCG API
 */
async function fetchCardDetails(cardId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.pokemontcg.io',
      path: `/v2/cards/${cardId}`,
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({
              name: json.data.name || 'Unknown',
              rarity: json.data.rarity || 'Common'
            });
          } catch (error) {
            reject(new Error(`Parse error for ${cardId}: ${error.message}`));
          }
        } else {
          reject(new Error(`API error ${res.statusCode} for ${cardId}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout for ${cardId}`));
    });

    req.end();
  });
}

/**
 * Parse CSV row
 */
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Escape CSV value
 */
function escapeCSVValue(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting CSV rarity updater...\n');

  try {
    // Step 1: Read existing CSV
    console.log('📖 Reading CSV file...');
    const csvContent = await fs.readFile(CSV_PATH, 'utf-8');
    const rows = csvContent.split('\n').filter(row => row.trim().length > 0);

    const header = rows[0];
    const headerCols = parseCSVRow(header);
    const dataRows = rows.slice(1);

    console.log(`   Found ${dataRows.length} cards\n`);

    // Check if rarity column already exists
    const rarityIndex = headerCols.indexOf('rarity');
    const cardNameIndex = headerCols.indexOf('card_name');
    const hasRarity = rarityIndex !== -1;
    const hasCardName = cardNameIndex !== -1;

    if (hasRarity && hasCardName) {
      console.log('✅ CSV already has rarity and card_name columns');

      // Count how many cards have rarity data
      const cardsWithRarity = dataRows.filter(row => {
        const values = parseCSVRow(row);
        return values[rarityIndex] && values[rarityIndex].trim().length > 0;
      });

      console.log(`   ${cardsWithRarity.length}/${dataRows.length} cards have rarity data`);

      if (cardsWithRarity.length === dataRows.length) {
        console.log('\n✅ All cards already have rarity data. Nothing to do!');
        return;
      }

      console.log(`\n🔄 Will update ${dataRows.length - cardsWithRarity.length} cards without rarity...\n`);
    } else {
      console.log('➕ Adding rarity and card_name columns...\n');
    }

    // Step 2: Process cards
    const updatedRows = [];
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const values = parseCSVRow(row);

      // Get card ID components
      const setId = values[0];
      const cardNumber = values[2];
      const cardId = `${setId}-${cardNumber}`;

      // Check if rarity already exists
      if (hasRarity && values[rarityIndex] && values[rarityIndex].trim().length > 0) {
        updatedRows.push(row);
        skippedCount++;
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r⏭️  Progress: ${i + 1}/${dataRows.length} (${skippedCount} skipped, ${successCount} updated, ${errorCount} errors)`);
        }
        continue;
      }

      try {
        // Fetch rarity from API
        const details = await fetchCardDetails(cardId);

        // Update or add rarity and card_name
        if (hasRarity) {
          values[rarityIndex] = details.rarity;
        } else {
          values.push(details.rarity);
        }

        if (hasCardName) {
          values[cardNameIndex] = details.name;
        } else {
          values.push(details.name);
        }

        // Reconstruct CSV row
        const updatedRow = values.map(escapeCSVValue).join(',');
        updatedRows.push(updatedRow);

        successCount++;
        processedCount++;

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          process.stdout.write(`\r✅ Progress: ${i + 1}/${dataRows.length} (${successCount} updated, ${errorCount} errors)`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error(`\n❌ Error fetching ${cardId}: ${error.message}`);

        // Keep original row or add empty rarity
        if (hasRarity) {
          updatedRows.push(row);
        } else {
          values.push('Unknown');
          values.push('Unknown');
          updatedRows.push(values.map(escapeCSVValue).join(','));
        }

        errorCount++;
        processedCount++;
      }
    }

    console.log(`\n\n📊 Final Stats:`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already had data): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total cards: ${dataRows.length}\n`);

    // Step 3: Write updated CSV
    console.log('💾 Writing updated CSV...');

    // Update header if needed
    let newHeader = header;
    if (!hasRarity || !hasCardName) {
      const newHeaderCols = [...headerCols];
      if (!hasRarity) newHeaderCols.push('rarity');
      if (!hasCardName) newHeaderCols.push('card_name');
      newHeader = newHeaderCols.join(',');
    }

    const updatedCSV = [newHeader, ...updatedRows].join('\n') + '\n';

    // Backup old file
    const backupPath = CSV_PATH + '.backup';
    await fs.copyFile(CSV_PATH, backupPath);
    console.log(`   📦 Backup created: ${backupPath}`);

    // Write new file
    await fs.writeFile(CSV_PATH, updatedCSV, 'utf-8');
    console.log(`   ✅ CSV updated: ${CSV_PATH}`);

    console.log('\n✨ Done! CSV now includes rarity and card name data.\n');
    console.log('Next steps:');
    console.log('  1. Update sessionCardManager.ts to use CSV rarity instead of API fetching');
    console.log('  2. Test pack opening - should be much faster!');
    console.log('  3. Remove the HOTFIX code for API rarity fetching\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
