import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import getDb from '../db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATASET_DIR = join(__dirname, '..', '..', 'dataset');

const router = Router();

// ─── Export full dataset ───
router.get('/export', (req, res) => {
  const format = req.query.format || 'json';
  const datasetPath = join(DATASET_DIR, 'recipes.json');

  // Combine static dataset file + approved community recipes from DB
  let recipes = [];

  if (existsSync(datasetPath)) {
    try {
      recipes = JSON.parse(readFileSync(datasetPath, 'utf-8'));
    } catch { /* empty dataset */ }
  }

  // Add approved community recipes
  try {
    const db = getDb();
    const community = db.prepare(
      'SELECT * FROM community_recipes WHERE status = ?'
    ).all('approved');

    for (const r of community) {
      recipes.push({
        id: `community-${r.id}`,
        name: r.name,
        culture: r.culture || 'Community',
        description: r.description || '',
        ingredients: tryParse(r.ingredients) || [],
        instructions: tryParse(r.instructions) || [],
        image_url: r.image_path ? `/uploads/${r.image_path}` : null,
        nutrition: tryParse(r.nutrition_json) || {},
        source: 'community',
        submitted_at: r.submitted_at,
        embedding_ready: !!(r.name && r.ingredients && r.image_path),
      });
    }
  } catch { /* DB not available */ }

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="health-heritage-recipes.csv"');

    const headers = ['id', 'name', 'culture', 'description', 'ingredients', 'instructions', 'image_url', 'calories', 'protein_g', 'fat_g', 'carbs_g', 'sodium_mg', 'fiber_g', 'source'];
    const rows = recipes.map((r) => [
      csvEscape(r.id),
      csvEscape(r.name),
      csvEscape(r.culture),
      csvEscape(r.description),
      csvEscape(JSON.stringify(r.ingredients)),
      csvEscape(JSON.stringify(r.instructions)),
      csvEscape(r.image_url || ''),
      r.nutrition?.calories || '',
      r.nutrition?.protein_g || '',
      r.nutrition?.total_fat_g || r.nutrition?.fat_g || '',
      r.nutrition?.carbs_g || '',
      r.nutrition?.sodium_mg || '',
      r.nutrition?.fiber_g || '',
      csvEscape(r.source || 'scraped'),
    ]);

    res.send([headers.join(','), ...rows.map((r) => r.join(','))].join('\n'));
    return;
  }

  // JSON format (HuggingFace Datasets compatible)
  res.json({
    dataset_info: {
      name: 'health-heritage-cultural-recipes',
      description: 'Culturally-rooted recipes with nutrition data for Caribbean, Central American, and Soul Food dishes.',
      version: '0.1.0',
      num_examples: recipes.length,
      features: {
        id: 'string',
        name: 'string',
        culture: 'string',
        ingredients: 'list[string]',
        instructions: 'list[string]',
        image_url: 'string',
        nutrition: 'dict',
        health_tags: 'list[string]',
        embedding_ready: 'bool',
      },
    },
    data: recipes,
  });
});

// ─── Dataset stats ───
router.get('/stats', (req, res) => {
  const datasetPath = join(DATASET_DIR, 'recipes.json');
  let scraped = 0;

  if (existsSync(datasetPath)) {
    try {
      const data = JSON.parse(readFileSync(datasetPath, 'utf-8'));
      scraped = data.length;
    } catch { /* noop */ }
  }

  let community = 0;
  let pending = 0;
  try {
    const db = getDb();
    community = db.prepare('SELECT COUNT(*) as c FROM community_recipes WHERE status = ?').get('approved').c;
    pending = db.prepare('SELECT COUNT(*) as c FROM community_recipes WHERE status = ?').get('pending').c;
  } catch { /* noop */ }

  res.json({
    total: scraped + community,
    scraped,
    community_approved: community,
    community_pending: pending,
  });
});

function csvEscape(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function tryParse(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return str; }
}

export default router;
