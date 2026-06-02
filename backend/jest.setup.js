import { jest } from '@jest/globals';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

// Force NODE_ENV to test
process.env.NODE_ENV = 'test';