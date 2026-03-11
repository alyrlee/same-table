import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { optionalAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import nutritionRoutes from './routes/nutrition.js';
import recognizeRoutes from './routes/recognize.js';
import communityRoutes from './routes/community.js';
import datasetRoutes from './routes/dataset.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(optionalAuth);

// Serve uploaded images
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// ─── Recipe Data (in-memory, offline fallback) ───
const recipes = {
  oxtail: {
    id: 'oxtail', culture: 'Jamaican', name: 'Oxtail Stew',
    calories: { original: 720, healthier: 380 },
    tags: ['High Fat', 'High Sodium'],
  },
  'fried-chicken': {
    id: 'fried-chicken', culture: 'Soul Food', name: 'Fried Chicken',
    calories: { original: 680, healthier: 340 },
    tags: ['Deep Fried', 'High Calorie'],
  },
  pernil: {
    id: 'pernil', culture: 'Puerto Rican', name: 'Pernil',
    calories: { original: 640, healthier: 360 },
    tags: ['High Fat', 'High Protein'],
  },
  tamales: {
    id: 'tamales', culture: 'Central American', name: 'Tamales',
    calories: { original: 520, healthier: 310 },
    tags: ['High Fat', 'Refined Carbs'],
  },
  'collard-greens': {
    id: 'collard-greens', culture: 'Soul Food', name: 'Collard Greens',
    calories: { original: 310, healthier: 140 },
    tags: ['High Fiber', 'High Sodium'],
  },
  'gallo-pinto': {
    id: 'gallo-pinto', culture: 'Costa Rican / Nicaraguan', name: 'Gallo Pinto',
    calories: { original: 420, healthier: 290 },
    tags: ['High Fiber', 'High Sodium'],
  },
};

// ─── Mounted Route Modules ───
app.use('/api/auth', authRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/recognize', recognizeRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/dataset', datasetRoutes);

// ─── Legacy Recipe Routes ───
app.get('/api/recipes', (req, res) => {
  const { culture, search } = req.query;
  let results = Object.values(recipes);

  if (culture && culture !== 'all') {
    results = results.filter((r) =>
      r.culture.toLowerCase().includes(culture.toLowerCase())
    );
  }
  if (search) {
    const term = search.toLowerCase();
    results = results.filter((r) =>
      r.name.toLowerCase().includes(term) ||
      r.culture.toLowerCase().includes(term)
    );
  }
  res.json(results);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes[req.params.id];
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json(recipe);
});

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  const term = q.toLowerCase();
  const results = Object.values(recipes).filter((r) =>
    r.name.toLowerCase().includes(term) ||
    r.culture.toLowerCase().includes(term) ||
    r.tags.some((t) => t.toLowerCase().includes(term))
  );
  res.json(results);
});

app.post('/api/pantry/suggest', (req, res) => {
  const { ingredients } = req.body;
  if (!ingredients || !Array.isArray(ingredients)) return res.json([]);

  const suggestions = [
    { id: 'jerk-chicken-bowl', name: 'Baked Jerk Chicken + Black Bean Rice', detail: `Uses ${Math.min(ingredients.length, 5)}/${ingredients.length} ingredients • 35 min • Caribbean`, score: 92, emoji: '🍗' },
    { id: 'plantain-bowls', name: 'Garlic Plantain & Black Bean Bowls', detail: `Uses ${Math.min(ingredients.length, 4)}/${ingredients.length} ingredients • 20 min • Vegan`, score: 88, emoji: '🌱' },
    { id: 'pollo-guisado', name: 'Pollo Guisado (Light Version)', detail: `Uses ${Math.min(ingredients.length, 4)}/${ingredients.length} ingredients • 45 min • Dominican`, score: 85, emoji: '🍲' },
  ];
  res.json(suggestions);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve static files in production ───
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback
app.get('{*path}', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
