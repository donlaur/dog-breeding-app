#!/usr/bin/env node

/**
 * Script to run tests without port conflicts
 * - Sets environment variables to use alternative ports for tests
 * - Ensures clean test environment
 */

const { spawn } = require('child_process');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');

try {
  // Parse .env file
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  
  // Set environment variables
  for (const key in envConfig) {
    process.env[key] = envConfig[key];
  }
} catch (err) {
  console.warn('No .env file found or error parsing it. Using default values.');
}

// Use different ports for testing to avoid conflicts
const TEST_CLIENT_PORT = 3001;
const TEST_API_PORT = 5001;

// Run tests with the appropriate test environment
function runTests() {
  console.log('========================================');
  console.log('Running tests with isolated environment');
  console.log(`Test client port: ${TEST_CLIENT_PORT}`);
  console.log(`Test API port: ${TEST_API_PORT}`);
  console.log('========================================');
  
  // Set test-specific environment variables
  const env = {
    ...process.env,
    PORT: TEST_CLIENT_PORT,
    REACT_APP_API_PORT: TEST_API_PORT,
    NODE_ENV: 'test'
  };
  
  // Get any additional arguments passed to this script
  const additionalArgs = process.argv.slice(2);
  
  // Construct the test command arguments
  const testArgs = ['test', '--env=jsdom', ...additionalArgs];
  
  // Spawn the test process
  const testProcess = spawn('react-scripts', testArgs, {
    env,
    stdio: 'inherit',
    cwd: __dirname
  });
  
  testProcess.on('error', (error) => {
    console.error('Failed to start test process:', error);
    process.exit(1);
  });
  
  testProcess.on('exit', (code) => {
    process.exit(code);
  });
}

// Run the script
runTests();