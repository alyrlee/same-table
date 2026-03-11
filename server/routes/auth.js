import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import getDb from '../db/schema.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, is_guest: user.is_guest },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// ─── Register (email + password) ───
router.post('/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name, auth_provider) VALUES (?, ?, ?, ?)'
  ).run(email, password_hash, name, 'local');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({ token, user: sanitizeUser(user) });
});

// ─── Login (email + password) ───
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND auth_provider = ?').get(email, 'local');

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

// ─── Guest mode ───
router.post('/guest', (req, res) => {
  const db = getDb();
  const guestName = `Guest_${Date.now().toString(36)}`;
  const result = db.prepare(
    'INSERT INTO users (name, is_guest, auth_provider) VALUES (?, 1, ?)'
  ).run(guestName, 'guest');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({ token, user: sanitizeUser(user) });
});

// ─── SSO callback (Google, Apple, etc.) ───
// In production, use passport.js or similar. This endpoint handles
// the token exchange after the OAuth flow completes on the frontend.
router.post('/sso', (req, res) => {
  const { provider, provider_id, email, name, avatar_url } = req.body;

  if (!provider || !provider_id) {
    return res.status(400).json({ error: 'Provider and provider_id are required' });
  }

  const db = getDb();

  // Check if SSO user already exists
  let user = db.prepare(
    'SELECT * FROM users WHERE auth_provider = ? AND provider_id = ?'
  ).get(provider, provider_id);

  if (!user) {
    // Check if email already registered with different method
    if (email) {
      const emailUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (emailUser) {
        // Link SSO to existing account
        db.prepare(
          'UPDATE users SET auth_provider = ?, provider_id = ?, avatar_url = COALESCE(?, avatar_url), updated_at = datetime(\'now\') WHERE id = ?'
        ).run(provider, provider_id, avatar_url, emailUser.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(emailUser.id);
      }
    }

    if (!user) {
      // Create new SSO user
      const result = db.prepare(
        'INSERT INTO users (email, name, avatar_url, auth_provider, provider_id) VALUES (?, ?, ?, ?, ?)'
      ).run(email || null, name || provider_id, avatar_url || null, provider, provider_id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
  }

  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

// ─── Get current user ───
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user) });
});

// ─── Update profile ───
router.patch('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { name, lang } = req.body;
  const db = getDb();
  db.prepare(
    'UPDATE users SET name = COALESCE(?, name), lang = COALESCE(?, lang), updated_at = datetime(\'now\') WHERE id = ?'
  ).run(name, lang, req.user.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: sanitizeUser(user) });
});

// ─── Convert guest to full account ───
router.post('/upgrade', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required to upgrade' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'UPDATE users SET email = ?, password_hash = ?, name = COALESCE(?, name), is_guest = 0, auth_provider = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).run(email, password_hash, name, 'local', req.user.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
});

export default router;
