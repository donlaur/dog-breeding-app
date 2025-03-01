module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  // Configure snapshot settings
  snapshotSerializers: ['jest-serializer-html'],
  // Configure image snapshot settings
  reporters: [
    'default',
    ['jest-image-snapshot/reporter', {
      customSnapshotsDir: '<rootDir>/src/__image_snapshots__',
      customDiffDir: '<rootDir>/src/__image_snapshots__/__diff_output__',
      failureThreshold: 0.01,
      failureThresholdType: 'percent'
    }]
  ]
}; 