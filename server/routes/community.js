import { Router } from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { requireAuth } from '../middleware/auth.js';
import getDb from '../db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: join(__dirname, '..', '..', 'uploads'),
    filename: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      cb(null, `recipe-${Date.now()}.${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─── Submit a community recipe ───
router.post('/submit', requireAuth, upload.single('photo'), (req, res) => {
  const { name, culture, description, ingredients, instructions, nutrition } = req.body;

  if (!name || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Name, ingredients, and instructions are required' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO community_recipes (user_id, name, culture, description, ingredients, instructions, image_path, nutrition_json, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    req.user.id,
    name,
    culture || null,
    description || null,
    typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients),
    typeof instructions === 'string' ? instructions : JSON.stringify(instructions),
    req.file ? req.file.filename : null,
    nutrition || null
  );

  res.status(201).json({
    id: result.lastInsertRowid,
    message: 'Recipe submitted for review. Thank you for contributing!',
  });
});

// ─── List user's submissions ───
router.get('/my-submissions', requireAuth, (req, res) => {
  const db = getDb();
  const recipes = db.prepare(
    'SELECT id, name, culture, status, submitted_at FROM community_recipes WHERE user_id = ? ORDER BY submitted_at DESC'
  ).all(req.user.id);
  res.json(recipes);
});

// ─── List approved community recipes (public) ───
router.get('/approved', (req, res) => {
  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const recipes = db.prepare(
    'SELECT id, name, culture, description, ingredients, instructions, image_path, nutrition_json, submitted_at FROM community_recipes WHERE status = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?'
  ).all('approved', limit, offset);

  res.json(recipes.map((r) => ({
    ...r,
    ingredients: tryParse(r.ingredients),
    instructions: tryParse(r.instructions),
    nutrition: tryParse(r.nutrition_json),
  })));
});

function tryParse(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch { return str; }
}

export default router;
