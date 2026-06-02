export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  transformIgnorePatterns: [],
  moduleFileExtensions: ['js', 'mjs', 'cjs'],
  testTimeout: 30000,
  setupFilesAfterEnv: ['./jest.setup.js'],
};