module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|firebase|@firebase)',
  ],
  moduleNameMapper: {
    '^firebase/app$': '<rootDir>/src/__tests__/__mocks__/firebase-app.ts',
    '^firebase/auth$': '<rootDir>/src/__tests__/__mocks__/firebase-auth.ts',
    '^firebase/firestore$': '<rootDir>/src/__tests__/__mocks__/firebase-firestore.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      // Goal: 70%+. Current: ~7% (components/screens not yet tested).
      // Raise these as component tests are added.
      statements: 5,
      branches: 5,
      functions: 5,
      lines: 5,
    },
  },
};
