import { Router } from 'express';
import { searchFoods, getFoodDetails } from '../services/usda.js';
import { getNaturalNutrients, searchInstant, isConfigured as nxConfigured } from '../services/nutritionix.js';

const router = Router();

// ─── USDA: search foods ───
router.get('/search', async (req, res) => {
  const { q, limit } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

  try {
    const results = await searchFoods(q, parseInt(limit) || 10);
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'USDA API error', detail: err.message });
  }
});

// ─── USDA: get food by FDC ID ───
router.get('/food/:fdcId', async (req, res) => {
  try {
    const food = await getFoodDetails(req.params.fdcId);
    res.json(food);
  } catch (err) {
    res.status(502).json({ error: 'USDA API error', detail: err.message });
  }
});

// ─── Nutritionix: natural language nutrients ───
router.post('/natural', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Body must include "query"' });

  if (!nxConfigured()) {
    return res.status(503).json({ error: 'Nutritionix API not configured. Set NUTRITIONIX_APP_ID and NUTRITIONIX_APP_KEY in .env' });
  }

  try {
    const foods = await getNaturalNutrients(query);
    res.json(foods);
  } catch (err) {
    res.status(502).json({ error: 'Nutritionix API error', detail: err.message });
  }
});

// ─── Nutritionix: instant search ───
router.get('/instant', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });

  if (!nxConfigured()) {
    return res.status(503).json({ error: 'Nutritionix API not configured' });
  }

  try {
    const results = await searchInstant(q);
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'Nutritionix API error', detail: err.message });
  }
});

export default router;
