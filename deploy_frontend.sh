#!/bin/bash

# Build the React app
cd client
npm install
npm run build

# Deploy to MCP
mcp deploy-static --dir build --name dog-breeding-frontend
