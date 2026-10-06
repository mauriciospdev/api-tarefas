module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
};
