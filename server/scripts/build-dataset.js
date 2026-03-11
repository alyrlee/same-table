#!/usr/bin/env node

/**
 * Dataset Builder CLI
 *
 * Scrapes recipes from free public APIs, enriches with USDA nutrition data,
 * and exports as JSON + CSV for Kaggle/HuggingFace hosting.
 *
 * Usage:
 *   node server/scripts/build-dataset.js                    # full pipeline
 *   node server/scripts/build-dataset.js --scrape-only      # just scrape, no USDA enrichment
 *   node server/scripts/build-dataset.js --enrich-only      # enrich existing dataset with USDA
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrapeMealDB, scrapeOpenFoodFacts, enrichWithUSDA } from '../services/scraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATASET_DIR = join(__dirname, '..', '..', 'dataset');

const args = process.argv.slice(2);
const SCRAPE_ONLY = args.includes('--scrape-only');
const ENRICH_ONLY = args.includes('--enrich-only');

async function main() {
  console.log('=== Health + Heritage Dataset Builder ===\n');

  // Ensure dataset directory exists
  if (!existsSync(DATASET_DIR)) {
    mkdirSync(DATASET_DIR, { recursive: true });
  }

  let recipes = [];
  const recipesPath = join(DATASET_DIR, 'recipes.json');

  if (ENRICH_ONLY) {
    // Load existing dataset
    if (!existsSync(recipesPath)) {
      console.error('No existing dataset found. Run without --enrich-only first.');
      process.exit(1);
    }
    recipes = JSON.parse(readFileSync(recipesPath, 'utf-8'));
    console.log(`Loaded ${recipes.length} existing recipes for enrichment.\n`);
  } else {
    // ─── Phase 1: Scrape ───
    console.log('Phase 1: Scraping recipes from free public APIs...\n');

    // MealDB
    console.log('  Fetching from TheMealDB (Creative Commons)...');
    const mealdbRecipes = await scrapeMealDB();
    console.log(`  Found ${mealdbRecipes.length} recipes from MealDB.`);
    recipes.push(...mealdbRecipes);

    // Open Food Facts (ingredient nutrition data)
    console.log('  Fetching ingredient nutrition from Open Food Facts...');
    const offFoods = await scrapeOpenFoodFacts();
    console.log(`  Found ${offFoods.length} ingredient nutrition entries from OFF.\n`);

    // Save ingredient nutrition separately
    writeFileSync(
      join(DATASET_DIR, 'ingredients-nutrition.json'),
      JSON.stringify(offFoods, null, 2)
    );

    // Deduplicate by ID
    const seen = new Set();
    recipes = recipes.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    console.log(`Total unique recipes scraped: ${recipes.length}\n`);
  }

  // ─── Phase 2: Enrich with USDA nutrition ───
  if (!SCRAPE_ONLY) {
    console.log('Phase 2: Enriching with USDA FoodData Central nutrition...');
    console.log('  (This may take a few minutes due to API rate limits)\n');
    recipes = await enrichWithUSDA(recipes);
    const enrichedCount = recipes.filter((r) => r.nutrition).length;
    console.log(`  Enriched ${enrichedCount}/${recipes.length} recipes with USDA data.\n`);
  }

  // ─── Phase 3: Export ───
  console.log('Phase 3: Exporting dataset...\n');

  // JSON export
  writeFileSync(recipesPath, JSON.stringify(recipes, null, 2));
  console.log(`  JSON: ${recipesPath}`);

  // CSV export
  const csvPath = join(DATASET_DIR, 'recipes.csv');
  const headers = ['id', 'name', 'culture', 'category', 'description', 'ingredients', 'instructions', 'image_url', 'calories', 'protein_g', 'fat_g', 'carbs_g', 'sodium_mg', 'fiber_g', 'source', 'embedding_ready'];
  const csvRows = recipes.map((r) => {
    const n = r.nutrition || {};
    return [
      esc(r.id), esc(r.name), esc(r.culture), esc(r.category),
      esc(r.description), esc(JSON.stringify(r.ingredients)),
      esc(JSON.stringify(r.instructions)), esc(r.image_url),
      n.calories || '', n.protein_g || '', n.total_fat_g || '',
      n.carbs_g || '', n.sodium_mg || '', n.fiber_g || '',
      esc(r.source), r.embedding_ready ? 'true' : 'false',
    ].join(',');
  });
  writeFileSync(csvPath, [headers.join(','), ...csvRows].join('\n'));
  console.log(`  CSV:  ${csvPath}`);

  // HuggingFace dataset_info.json
  const datasetInfo = {
    name: 'health-heritage-cultural-recipes',
    description: 'Culturally-rooted recipes with nutrition data for Caribbean, Central American, and Soul Food dishes. Built for training joint image-text embeddings.',
    version: '0.1.0',
    license: 'cc-by-4.0',
    num_examples: recipes.length,
    features: {
      id: { dtype: 'string' },
      name: { dtype: 'string' },
      culture: { dtype: 'string' },
      ingredients: { sequence: { dtype: 'string' } },
      instructions: { sequence: { dtype: 'string' } },
      image_url: { dtype: 'string' },
      nutrition: {
        struct: ['calories', 'protein_g', 'total_fat_g', 'carbs_g', 'sodium_mg', 'fiber_g'],
      },
      source: { dtype: 'string' },
      embedding_ready: { dtype: 'bool' },
    },
    splits: {
      train: { num_examples: recipes.length },
    },
    cultural_categories: [...new Set(recipes.map((r) => r.culture).filter(Boolean))],
    sources: ['themealdb', 'openfoodfacts', 'usda-fdc', 'community'],
  };
  writeFileSync(join(DATASET_DIR, 'dataset_info.json'), JSON.stringify(datasetInfo, null, 2));
  console.log(`  Meta: ${join(DATASET_DIR, 'dataset_info.json')}`);

  // ─── Summary ───
  console.log('\n=== Dataset Build Complete ===');
  console.log(`Total recipes: ${recipes.length}`);
  console.log(`With nutrition: ${recipes.filter((r) => r.nutrition).length}`);
  console.log(`With images: ${recipes.filter((r) => r.image_url).length}`);
  console.log(`Embedding-ready: ${recipes.filter((r) => r.embedding_ready).length}`);
  console.log(`\nCultures: ${[...new Set(recipes.map((r) => r.culture))].join(', ')}`);
  console.log('\nNext steps:');
  console.log('  1. Upload dataset/ to HuggingFace: huggingface-cli upload <repo> dataset/');
  console.log('  2. Upload to Kaggle: kaggle datasets create -p dataset/');
  console.log('  3. Review and curate — quality over quantity!');
}

function esc(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

main().catch((err) => {
  console.error('Dataset build failed:', err);
  process.exit(1);
});
