/// <reference types="@types/jest" />

declare global {
  const describe: jest.Describe;
  const it: jest.It;
  const expect: jest.Expect;
  const beforeEach: jest.Hook;
  const afterEach: jest.Hook;
  const beforeAll: jest.Hook;
  const afterAll: jest.Hook;
  const jest: typeof import('@jest/globals');
}

export {};