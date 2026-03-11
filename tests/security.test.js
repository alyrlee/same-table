import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

describe('Security: No Hardcoded Secrets', () => {
  const serverFiles = [
    'server/index.js',
    'server/routes/auth.js',
    'server/routes/nutrition.js',
    'server/routes/recognize.js',
    'server/routes/community.js',
    'server/routes/dataset.js',
    'server/services/usda.js',
    'server/services/nutritionix.js',
    'server/services/clip.js',
    'server/middleware/auth.js',
    'server/db/schema.js',
  ];

  for (const file of serverFiles) {
    it(`${file} should not contain hardcoded API keys`, () => {
      const content = readFileSync(join(ROOT, file), 'utf-8');

      // Check for common API key patterns
      expect(content).not.toMatch(/['"]sk-[a-zA-Z0-9]{20,}['"]/);          // OpenAI keys
      expect(content).not.toMatch(/['"]hf_[a-zA-Z0-9]{20,}['"]/);          // HuggingFace tokens
      expect(content).not.toMatch(/['"][a-f0-9]{32,}['"]/);                 // Generic hex API keys
      expect(content).not.toMatch(/api_key\s*[:=]\s*['"][^'"]{20,}['"]/i);  // Inline API keys

      // Ensure keys come from process.env (check for actual key usage, not error messages)
      if (content.match(/(?:api_key|API_KEY|APP_KEY)\s*[=:]/)) {
        expect(content).toMatch(/process\.env/);
      }
    });
  }

  it('.env.example should exist but .env should be gitignored', () => {
    const envExample = readFileSync(join(ROOT, '.env.example'), 'utf-8');
    expect(envExample).toContain('USDA_API_KEY');
    expect(envExample).toContain('NUTRITIONIX_APP_ID');
    expect(envExample).toContain('HUGGINGFACE_API_TOKEN');
    expect(envExample).toContain('JWT_SECRET');

    // Verify no real keys in .env.example
    expect(envExample).not.toMatch(/=[a-zA-Z0-9]{20,}/);

    const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('.env');
  });
});

describe('Security: Password Handling', () => {
  it('auth routes should use bcrypt for password hashing', () => {
    const authContent = readFileSync(join(ROOT, 'server/routes/auth.js'), 'utf-8');
    expect(authContent).toContain('bcrypt');
    expect(authContent).toContain('hashSync');
    expect(authContent).toContain('compareSync');
    // Should never store raw password
    expect(authContent).not.toMatch(/password_hash\s*=\s*password/);
  });
});

describe('Security: JWT Configuration', () => {
  it('JWT secret should come from environment variable', () => {
    const authContent = readFileSync(join(ROOT, 'server/routes/auth.js'), 'utf-8');
    expect(authContent).toContain('process.env.JWT_SECRET');
  });

  it('auth middleware should validate Bearer token format', () => {
    const middleware = readFileSync(join(ROOT, 'server/middleware/auth.js'), 'utf-8');
    expect(middleware).toContain('Bearer');
    expect(middleware).toContain('jwt.verify');
  });
});

describe('Security: Input Validation', () => {
  it('auth register should validate required fields', () => {
    const authContent = readFileSync(join(ROOT, 'server/routes/auth.js'), 'utf-8');
    expect(authContent).toContain('!email');
    expect(authContent).toContain('!password');
    expect(authContent).toContain('password.length');
  });

  it('file uploads should restrict to image types', () => {
    const recognize = readFileSync(join(ROOT, 'server/routes/recognize.js'), 'utf-8');
    expect(recognize).toContain('image/');
    expect(recognize).toContain('fileSize');
  });

  it('community uploads should restrict to image types with size limit', () => {
    const community = readFileSync(join(ROOT, 'server/routes/community.js'), 'utf-8');
    expect(community).toContain('image/');
    expect(community).toContain('fileSize');
  });
});

describe('Security: Database', () => {
  it('database schema should use parameterized queries (no string interpolation)', () => {
    const authContent = readFileSync(join(ROOT, 'server/routes/auth.js'), 'utf-8');
    // Should use ? placeholders, not template literals in SQL
    expect(authContent).toContain('.prepare(');
    expect(authContent).not.toMatch(/`SELECT.*\$\{/); // No template literals in SQL
    expect(authContent).not.toMatch(/`INSERT.*\$\{/);
    expect(authContent).not.toMatch(/`UPDATE.*\$\{/);
  });

  it('database should be in gitignore', () => {
    const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('*.db');
  });
});

describe('Security: CORS & Headers', () => {
  it('server should use CORS middleware', () => {
    const serverContent = readFileSync(join(ROOT, 'server/index.js'), 'utf-8');
    expect(serverContent).toContain('cors()');
  });
});
