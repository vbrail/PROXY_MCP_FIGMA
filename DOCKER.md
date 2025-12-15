# Docker Deployment Guide

This guide covers Docker-specific deployment instructions for the Figma MCP Proxy Server.

## Quick Start

### Build Locally

```bash
# Build the Docker image
docker build -t figma-mcp-proxy .

# Run the container
docker run -p 3000:3000 \
  -e FIGMA_ACCESS_TOKEN=your_token_here \
  -e PORT=3000 \
  figma-mcp-proxy
```

### Test Locally

```bash
# Health check
curl http://localhost:3000/health

# Should return: {"status":"ok","service":"figma-proxy-mcp-server"}
```

## Dockerfile Overview

The Dockerfile:
1. Uses Node.js 20 Alpine (lightweight)
2. Installs dependencies
3. Builds TypeScript
4. Exposes port 3000
5. Includes health check
6. Runs the server

## Environment Variables

Required:
- `FIGMA_ACCESS_TOKEN` - Your Figma personal access token

Optional:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: production)

## Docker Commands

### Build
```bash
docker build -t figma-mcp-proxy .
```

### Run
```bash
docker run -d \
  --name figma-mcp \
  -p 3000:3000 \
  -e FIGMA_ACCESS_TOKEN=your_token \
  figma-mcp-proxy
```

### View Logs
```bash
docker logs figma-mcp
```

### Stop
```bash
docker stop figma-mcp
```

### Remove
```bash
docker rm figma-mcp
```

## Docker Compose (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  figma-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - FIGMA_ACCESS_TOKEN=${FIGMA_ACCESS_TOKEN}
      - PORT=3000
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Run:
```bash
docker-compose up -d
```

## Production Considerations

1. **Use .env file** (don't pass tokens via command line):
   ```bash
   docker run --env-file .env figma-mcp-proxy
   ```

2. **Use Docker secrets** (for production):
   ```bash
   docker run --secret source=figma_token,target=/run/secrets/figma_token figma-mcp-proxy
   ```

3. **Multi-stage build** (already optimized, but can be improved):
   - Current: Single stage (good for simplicity)
   - Alternative: Multi-stage to reduce final image size

4. **Health checks**: Already included in Dockerfile

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs figma-mcp

# Run interactively to see errors
docker run -it --rm \
  -e FIGMA_ACCESS_TOKEN=your_token \
  figma-mcp-proxy
```

### Port already in use
```bash
# Use different port
docker run -p 3001:3000 figma-mcp-proxy
```

### Build fails
```bash
# Build with no cache
docker build --no-cache -t figma-mcp-proxy .

# Check Dockerfile syntax
docker build --dry-run .
```

## Image Size

Current image size: ~150-200MB (Node.js Alpine + dependencies)

To reduce further:
- Use multi-stage build
- Remove dev dependencies after build
- Use distroless images (advanced)

