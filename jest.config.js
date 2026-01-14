module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',

  // resolve src/* imports
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
