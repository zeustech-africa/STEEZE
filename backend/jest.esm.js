// Set test environment variables BEFORE any modules load
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = 'true';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Also load .env.test for any other missing vars (override to ensure test values win)
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.test'), override: true });

// Polyfill __dirname and __filename for ES module compatibility in tests.
// Source files using __dirname will get the backend/ directory as base.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.__dirname = __dirname;
global.__filename = __filename;
