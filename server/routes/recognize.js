import { Router } from 'express';
import multer from 'multer';
import { classifyFoodImage, getDefaultFoodLabels, isConfigured } from '../services/clip.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ─── Classify a food photo via CLIP ───
router.post('/', upload.single('image'), async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'HuggingFace API not configured. Set HUGGINGFACE_API_TOKEN in .env',
    });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required. Send as multipart form field "image".' });
  }

  try {
    // Use custom labels if provided, otherwise default cultural food labels
    let labels = getDefaultFoodLabels();
    if (req.body.labels) {
      try {
        labels = JSON.parse(req.body.labels);
      } catch {
        // ignore invalid JSON, use defaults
      }
    }

    const results = await classifyFoodImage(req.file.buffer, labels);
    const top5 = results.slice(0, 5);

    res.json({
      classifications: top5,
      top_match: top5[0] || null,
    });
  } catch (err) {
    const status = err.message.includes('loading') ? 503 : 502;
    res.status(status).json({ error: 'CLIP classification error', detail: err.message });
  }
});

// ─── Get available food labels ───
router.get('/labels', (req, res) => {
  res.json({ labels: getDefaultFoodLabels() });
});

export default router;
