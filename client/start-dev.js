#!/usr/bin/env node

/**
 * Script to manage the development environment
 * - Checks if specified ports are in use
 * - Kills any processes using those ports
 * - Starts the client and server processes
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
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

// Default ports if not specified in .env
const CLIENT_PORT = process.env.PORT || 3000;
const API_PORT = process.env.REACT_APP_API_PORT || 5000;

// Function to check if a port is in use
function isPortInUse(port) {
  try {
    // Platform-specific command to check ports
    let command;
    if (process.platform === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i:${port} -t`;
    }
    
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim().length > 0;
  } catch (error) {
    // If the command fails, the port is likely not in use
    return false;
  }
}

// Function to kill processes using a port
function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows version
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match && match[1]) {
          pids.add(match[1]);
        }
      }
      
      for (const pid of pids) {
        console.log(`Killing process ${pid} using port ${port}`);
        execSync(`taskkill /F /PID ${pid}`);
      }
    } else {
      // Unix version
      const output = execSync(`lsof -i:${port} -t`, { encoding: 'utf8' });
      const pids = output.trim().split('\n');
      
      for (const pid of pids) {
        if (pid) {
          console.log(`Killing process ${pid} using port ${port}`);
          execSync(`kill -9 ${pid}`);
        }
      }
    }
    return true;
  } catch (error) {
    console.error(`Error killing process on port ${port}:`, error.message);
    return false;
  }
}

// Check ports and kill processes if necessary
function checkAndClearPorts() {
  // Check client port
  if (isPortInUse(CLIENT_PORT)) {
    console.log(`Port ${CLIENT_PORT} is in use. Attempting to free it...`);
    if (killProcessOnPort(CLIENT_PORT)) {
      console.log(`Successfully freed port ${CLIENT_PORT}`);
    } else {
      console.error(`Failed to free port ${CLIENT_PORT}. Please close the process manually.`);
      process.exit(1);
    }
  }

  // Check API port
  if (isPortInUse(API_PORT)) {
    console.log(`Port ${API_PORT} is in use. Attempting to free it...`);
    if (killProcessOnPort(API_PORT)) {
      console.log(`Successfully freed port ${API_PORT}`);
    } else {
      console.error(`Failed to free port ${API_PORT}. Please close the process manually.`);
      process.exit(1);
    }
  }
}

// Start the client process
function startClient() {
  console.log(`Starting client on port ${CLIENT_PORT}...`);
  
  // Set the port environment variable
  const env = { ...process.env, PORT: CLIENT_PORT };
  
  const client = spawn('npm', ['start'], { 
    env,
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  client.on('error', (error) => {
    console.error('Failed to start client process:', error);
  });
  
  return client;
}

// Start the server process (if it exists)
function startServer() {
  // Check if we're in a workspace with a server directory
  const serverDir = path.resolve(__dirname, '../server');
  
  if (!fs.existsSync(serverDir)) {
    console.log('No server directory found, skipping server startup');
    return null;
  }
  
  console.log(`Starting server on port ${API_PORT}...`);
  
  // Set environment variables for the server
  const env = { ...process.env, PORT: API_PORT };
  
  // Determine how to start the server based on what files exist
  let serverCmd = 'npm';
  let serverArgs = ['start'];
  
  if (fs.existsSync(path.join(serverDir, 'package.json'))) {
    serverCmd = 'npm';
    serverArgs = ['start'];
  } else if (fs.existsSync(path.join(serverDir, 'app.py'))) {
    serverCmd = 'python3';
    serverArgs = ['app.py'];
  } else if (fs.existsSync(path.join(serverDir, 'main.py'))) {
    serverCmd = 'python3';
    serverArgs = ['main.py'];
  }
  
  const server = spawn(serverCmd, serverArgs, {
    env,
    stdio: 'inherit',
    cwd: serverDir
  });
  
  server.on('error', (error) => {
    console.error('Failed to start server process:', error);
  });
  
  return server;
}

// Main function
function main() {
  console.log('========================================');
  console.log('Starting development environment');
  console.log(`Client port: ${CLIENT_PORT}`);
  console.log(`API port: ${API_PORT}`);
  console.log('========================================');
  
  // Check and clear ports
  checkAndClearPorts();
  
  // Start processes
  const clientProcess = startClient();
  const serverProcess = startServer();
  
  // Handle cleanup on exit
  const cleanup = () => {
    console.log('\nShutting down processes...');
    if (clientProcess) clientProcess.kill();
    if (serverProcess) serverProcess.kill();
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// Run the script
main();