# Deployment Checklist

Quick checklist for deploying to Render.com

## Pre-Deployment

- [ ] Get Figma Personal Access Token
  - [ ] Go to Figma Settings → Account → Personal Access Tokens
  - [ ] Generate new token
  - [ ] Copy token (save it securely)

- [ ] Push code to GitHub
  - [ ] `git init` (if not already a repo)
  - [ ] `git add .`
  - [ ] `git commit -m "Initial commit"`
  - [ ] Create GitHub repository
  - [ ] `git remote add origin <your-repo-url>`
  - [ ] `git push -u origin main`

## Render Deployment

- [ ] Sign up/Login to [render.com](https://render.com)

- [ ] Create Web Service
  - [ ] Click "New +" → "Web Service"
  - [ ] Connect GitHub account
  - [ ] Select your repository

- [ ] Configure Service
  - [ ] Name: `figma-mcp-proxy`
  - [ ] Runtime: `Docker`
  - [ ] Dockerfile: `Dockerfile` (auto-detected)
  - [ ] Region: Choose closest to you

- [ ] Set Environment Variables
  - [ ] `FIGMA_ACCESS_TOKEN` = (paste your token)
  - [ ] `NODE_ENV` = `production`
  - [ ] `PORT` = `10000` (or leave empty)

- [ ] Deploy
  - [ ] Click "Create Web Service"
  - [ ] Wait for build to complete (2-5 minutes)
  - [ ] Copy your service URL

## Post-Deployment

- [ ] Test Health Endpoint
  ```bash
  curl https://your-service.onrender.com/health
  ```
  Should return: `{"status":"ok","service":"figma-proxy-mcp-server"}`

- [ ] Get SSE Endpoint URL
  - Your SSE endpoint: `https://your-service.onrender.com/sse`

- [ ] Configure Cursor (for each developer)
  - [ ] Edit `~/Library/Application Support/Cursor/mcp.json`
  - [ ] Add server configuration:
    ```json
    {
      "mcpServers": {
        "figma-proxy": {
          "transport": "sse",
          "url": "https://your-service.onrender.com/sse"
        }
      }
    }
    ```
  - [ ] Restart Cursor completely

- [ ] Test Connection
  - [ ] Open Cursor
  - [ ] Try: "List my Figma files"
  - [ ] Verify it works

## Share with Team

- [ ] Share server URL with developers
- [ ] Share [DEVELOPER_SETUP.md](DEVELOPER_SETUP.md) guide
- [ ] Test with at least one developer

## Monitoring

- [ ] Bookmark Render dashboard
- [ ] Check logs regularly
- [ ] Monitor service health

---

**Need help?** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

