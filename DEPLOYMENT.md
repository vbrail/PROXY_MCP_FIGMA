# Deployment Guide - Render.com

This guide walks you through deploying the Figma MCP Proxy Server to Render.com.

## Prerequisites

1. **Figma Personal Access Token**
   - Go to Figma Settings → Account → Personal Access Tokens
   - Generate a new token
   - Copy it (you won't see it again!)

2. **GitHub Account**
   - Your code needs to be in a GitHub repository

3. **Render Account**
   - Sign up at [render.com](https://render.com) (free tier available)

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

1. Initialize git (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Figma MCP Proxy Server"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Create Render Web Service

1. **Log in to Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign in or create an account

2. **Create New Web Service**
   - Click **"New +"** button
   - Select **"Web Service"**

3. **Connect Repository**
   - Click **"Connect account"** if not connected
   - Authorize Render to access your GitHub
   - Select your repository: `your-username/your-repo-name`
   - Click **"Connect"**

### Step 3: Configure Service Settings

Fill in the service configuration:

**Basic Settings:**
- **Name**: `figma-mcp-proxy` (or your preferred name)
- **Region**: Choose closest to you (Oregon, Frankfurt, Singapore, etc.)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or `./` if needed)

**Build & Deploy:**
- **Runtime**: `Docker`
- **Dockerfile Path**: `Dockerfile` (should auto-detect)
- **Docker Context**: `.` (current directory)

**Environment Variables:**
Click **"Add Environment Variable"** and add:

| Key | Value |
|-----|-------|
| `FIGMA_ACCESS_TOKEN` | Your Figma token (paste it here) |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render's default, or leave empty) |

**Advanced Settings (Optional):**
- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes` (deploys on every push)

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Build the Docker image
   - Start the container
   - This takes 2-5 minutes

3. **Monitor the Build**
   - Watch the build logs in real-time
   - Wait for "Your service is live" message

### Step 5: Get Your Server URL

Once deployed, you'll see:
- **Service URL**: `https://figma-mcp-proxy.onrender.com` (or your service name)
- **SSE Endpoint**: `https://figma-mcp-proxy.onrender.com/sse`
- **Health Check**: `https://figma-mcp-proxy.onrender.com/health`

### Step 6: Test the Deployment

1. **Test Health Endpoint:**
   ```bash
   curl https://your-service-name.onrender.com/health
   ```
   Should return: `{"status":"ok","service":"figma-proxy-mcp-server"}`

2. **Test SSE Endpoint:**
   ```bash
   curl https://your-service-name.onrender.com/sse
   ```
   Should start an SSE stream

### Step 7: Configure Cursor for Developers

Share this configuration with your developers:

**File**: `~/Library/Application Support/Cursor/mcp.json` (Mac)

```json
{
  "mcpServers": {
    "figma-proxy": {
      "transport": "sse",
      "url": "https://your-service-name.onrender.com/sse"
    }
  }
}
```

Replace `your-service-name.onrender.com` with your actual Render service URL.

## Troubleshooting

### Build Fails

**Issue**: Docker build fails

**Solutions:**
1. Check build logs in Render dashboard
2. Verify Dockerfile is in root directory
3. Ensure all dependencies are in `package.json`
4. Check that TypeScript compiles: `npm run build` locally

### Service Won't Start

**Issue**: Service starts but immediately crashes

**Solutions:**
1. Check logs in Render dashboard
2. Verify `FIGMA_ACCESS_TOKEN` is set correctly
3. Check that PORT environment variable is set (Render sets this automatically)
4. Verify health check endpoint works

### Can't Connect from Cursor

**Issue**: Cursor can't connect to the server

**Solutions:**
1. Verify the server URL is correct
2. Test the `/health` endpoint in browser
3. Check that the service is running (not sleeping)
4. Verify CORS is enabled (it is in the code)
5. Check Render service logs for errors

### Service Goes to Sleep (Free Tier)

**Issue**: Service is slow to respond after inactivity

**Solutions:**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to paid plan for always-on service
- Or set up a cron job to ping `/health` every 10 minutes

## Updating the Service

When you push changes to GitHub:

1. Render automatically detects the push
2. Starts a new build
3. Deploys the new version
4. Old version keeps running until new one is ready
5. Zero-downtime deployment!

## Environment Variables

To update environment variables:

1. Go to your service in Render dashboard
2. Click **"Environment"** tab
3. Edit or add variables
4. Click **"Save Changes"**
5. Service will restart automatically

## Monitoring

**View Logs:**
- Go to service dashboard
- Click **"Logs"** tab
- See real-time logs

**Metrics:**
- CPU usage
- Memory usage
- Request count
- Response times

## Security Notes

1. **Never commit** `FIGMA_ACCESS_TOKEN` to git
2. Always use environment variables for secrets
3. The `.dockerignore` file excludes `.env` files
4. Render encrypts environment variables at rest

## Cost

**Free Tier:**
- 750 hours/month free
- Services sleep after 15 min inactivity
- Perfect for development/testing

**Paid Plans:**
- Starts at $7/month
- Always-on service
- Better for production

## Next Steps

After deployment:

1. ✅ Test the health endpoint
2. ✅ Configure Cursor with the server URL
3. ✅ Test with a developer
4. ✅ Monitor logs for any issues
5. ✅ Share server URL with your team

## Support

If you encounter issues:

1. Check Render service logs
2. Test endpoints with curl
3. Verify environment variables
4. Check Figma token is valid
5. Review this troubleshooting section

