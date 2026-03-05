/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/game-stardewvalley/tsconfig.test.json' }],
  },
  testMatch: [
    '<rootDir>/game-stardewvalley/__tests__/**/*.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/out/',
  ],
  moduleNameMapper: {
    '^vortex-api$': '<rootDir>/game-stardewvalley/__mocks__/vortex-api.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
