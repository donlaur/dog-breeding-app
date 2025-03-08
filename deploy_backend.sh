#!/bin/bash

# Build and push the Docker image
docker build -t dog-breeding-backend .
docker tag dog-breeding-backend your-mcp-registry/dog-breeding-backend
docker push your-mcp-registry/dog-breeding-backend

# Deploy to MCP
mcp deploy --image your-mcp-registry/dog-breeding-backend --name dog-breeding-backend
