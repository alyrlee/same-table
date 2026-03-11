import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DB_PATH = join(__dirname, 'test-auth.db');
const JWT_SECRET = 'test-secret';

let db;

function setupTestDb() {
  db = new Database(TEST_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      avatar_url TEXT,
      lang TEXT DEFAULT 'en',
      auth_provider TEXT DEFAULT 'local',
      provider_id TEXT,
      is_guest INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

beforeEach(() => {
  setupTestDb();
});

afterEach(() => {
  if (db) db.close();
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
  // Clean up WAL/SHM files
  if (existsSync(TEST_DB_PATH + '-wal')) unlinkSync(TEST_DB_PATH + '-wal');
  if (existsSync(TEST_DB_PATH + '-shm')) unlinkSync(TEST_DB_PATH + '-shm');
});

describe('User Registration', () => {
  it('should hash passwords with bcrypt, never store plaintext', () => {
    const password = 'securePassword123';
    const hash = bcrypt.hashSync(password, 10);

    // Hash should NOT equal plaintext
    expect(hash).not.toBe(password);
    // Hash should be verifiable
    expect(bcrypt.compareSync(password, hash)).toBe(true);
    // Wrong password should not verify
    expect(bcrypt.compareSync('wrongPassword', hash)).toBe(false);
  });

  it('should create a user with hashed password in the database', () => {
    const email = 'test@example.com';
    const password = 'securePassword123';
    const hash = bcrypt.hashSync(password, 10);

    db.prepare('INSERT INTO users (email, password_hash, name, auth_provider) VALUES (?, ?, ?, ?)').run(
      email, hash, 'Test User', 'local'
    );

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.password_hash).not.toBe(password);
    expect(bcrypt.compareSync(password, user.password_hash)).toBe(true);
  });

  it('should enforce unique email constraint', () => {
    const email = 'dupe@example.com';
    const hash = bcrypt.hashSync('password123', 10);

    db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(email, hash, 'User 1');

    expect(() => {
      db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(email, hash, 'User 2');
    }).toThrow();
  });
});

describe('JWT Token Security', () => {
  it('should create valid JWT tokens', () => {
    const payload = { id: 1, email: 'test@example.com', name: 'Test' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify valid tokens', () => {
    const payload = { id: 1, email: 'test@example.com' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, JWT_SECRET);

    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('test@example.com');
  });

  it('should reject tokens signed with wrong secret', () => {
    const token = jwt.sign({ id: 1 }, 'different-secret', { expiresIn: '7d' });

    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow();
  });

  it('should reject expired tokens', () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET, { expiresIn: '0s' });

    // Small delay to ensure expiration
    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow();
  });

  it('should reject tampered tokens', () => {
    const token = jwt.sign({ id: 1, role: 'user' }, JWT_SECRET);
    // Tamper with the payload
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ id: 1, role: 'admin' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    expect(() => {
      jwt.verify(tamperedToken, JWT_SECRET);
    }).toThrow();
  });
});

describe('Guest Mode', () => {
  it('should create guest users without email or password', () => {
    const result = db.prepare(
      'INSERT INTO users (name, is_guest, auth_provider) VALUES (?, 1, ?)'
    ).run('Guest_abc123', 'guest');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    expect(user.is_guest).toBe(1);
    expect(user.email).toBeNull();
    expect(user.password_hash).toBeNull();
    expect(user.auth_provider).toBe('guest');
  });

  it('should allow upgrading guest to full account', () => {
    // Create guest
    const result = db.prepare(
      'INSERT INTO users (name, is_guest, auth_provider) VALUES (?, 1, ?)'
    ).run('Guest_xyz', 'guest');

    const guestId = result.lastInsertRowid;
    const hash = bcrypt.hashSync('newPassword123', 10);

    // Upgrade
    db.prepare(
      'UPDATE users SET email = ?, password_hash = ?, is_guest = 0, auth_provider = ? WHERE id = ?'
    ).run('upgraded@example.com', hash, 'local', guestId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(guestId);
    expect(user.is_guest).toBe(0);
    expect(user.email).toBe('upgraded@example.com');
    expect(bcrypt.compareSync('newPassword123', user.password_hash)).toBe(true);
  });
});

describe('SSO Authentication', () => {
  it('should create SSO user with provider info', () => {
    db.prepare(
      'INSERT INTO users (name, auth_provider, provider_id, email) VALUES (?, ?, ?, ?)'
    ).run('Google User', 'google', 'google-123', 'sso@gmail.com');

    const user = db.prepare('SELECT * FROM users WHERE provider_id = ?').get('google-123');
    expect(user.auth_provider).toBe('google');
    expect(user.email).toBe('sso@gmail.com');
    expect(user.password_hash).toBeNull(); // SSO users don't have passwords
  });

  it('should link SSO to existing account by email', () => {
    const hash = bcrypt.hashSync('existing123', 10);
    db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(
      'existing@example.com', hash, 'Existing User'
    );

    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get('existing@example.com');
    db.prepare('UPDATE users SET auth_provider = ?, provider_id = ? WHERE id = ?').run(
      'google', 'google-456', existing.id
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
    expect(updated.auth_provider).toBe('google');
    expect(updated.provider_id).toBe('google-456');
    // Original password should still work
    expect(bcrypt.compareSync('existing123', updated.password_hash)).toBe(true);
  });
});
