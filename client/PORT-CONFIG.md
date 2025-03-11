# Port Configuration and Process Management

This guide explains how to use the new port configuration and process management features in the application.

## Overview

The application has been updated to use environment variables for port configuration instead of hardcoded port values. This makes it easier to run multiple instances of the application and avoid port conflicts.

## Configuration

Ports are configured in the `.env` file:

```
PORT=3000                          # Client development server port
REACT_APP_API_PORT=5000            # API server port
REACT_APP_API_URL=http://localhost:${REACT_APP_API_PORT}/api
```

## Available Scripts

### `npm run dev`

```bash
npm run dev
```

This script:
1. Checks if ports 3000 and 5000 (or ports configured in `.env`) are in use
2. Kills any processes using those ports
3. Starts the client and server processes

### `npm run test:isolated`

```bash
npm run test:isolated
```

This script runs tests using isolated ports (3001 and 5001) to avoid conflicts with development servers.

## Dockerfile Changes

Both Dockerfile and Dockerfile.dev have been updated to use ARG and ENV variables for ports, making them configurable at build time:

```bash
# Build with custom ports
docker build -t my-app --build-arg PORT=3000 --build-arg REACT_APP_API_PORT=5000 .
```

## Tips for AI Tools

When using AI tools like Claude that may start and stop the application multiple times:

1. Always use `npm run dev` instead of `npm start` to avoid port conflicts
2. For running tests, use `npm run test:isolated` instead of `npm test`
3. If you need to modify port values, change them in the `.env` file

## Troubleshooting

If you encounter port conflicts:

1. You can manually stop processes using:
   ```bash
   # On macOS/Linux
   lsof -i:3000 -t | xargs kill -9
   lsof -i:5000 -t | xargs kill -9
   
   # On Windows
   netstat -ano | findstr :3000  # Find PID
   taskkill /F /PID <PID>
   ```

2. Or simply run `npm run dev` which will handle this automatically