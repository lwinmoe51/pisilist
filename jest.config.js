module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|firebase|@firebase)',
  ],
  moduleNameMapper: {
    '^firebase/app$': '<rootDir>/src/__tests__/__mocks__/firebase-app.ts',
    '^firebase/auth$': '<rootDir>/src/__tests__/__mocks__/firebase-auth.ts',
    '^firebase/firestore$': '<rootDir>/src/__tests__/__mocks__/firebase-firestore.ts',
    '^expo-notifications$': '<rootDir>/src/__tests__/__mocks__/expo-notifications.ts',
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
      // Goal: 70%+. Coverage improves as more components/screens get tests.
      statements: 15,
      branches: 10,
      functions: 12,
      lines: 15,
    },
  },
};
