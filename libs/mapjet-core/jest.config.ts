/* eslint-disable */
export default {
  displayName: 'mapjet-core',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  setupFilesAfterEnv: ["jest-extended/all"],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
