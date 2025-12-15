# Figma MCP Proxy Server

A Model Context Protocol (MCP) server that provides secure access to your Figma designs through Cursor IDE. This server authenticates with Figma using your personal access token and exposes your designs to your development team without requiring individual Figma accounts.

## Architecture

```
Developer Cursor IDEs → Your MCP Server (Cloud) → Figma API (Your Account)
```

- **Your developers** connect their Cursor IDE to your hosted MCP server
- **Your MCP server** authenticates with Figma using your credentials
- **All Figma requests** go through your server (developers never touch Figma directly)

## Features

### Resources
- `figma://files` - List all your Figma files
- `figma://file/{file_id}` - Get specific file content (frames, layers, components)
- `figma://team/{team_id}` - List files and projects for a team
- `figma://project/{project_id}` - Project information

### Tools
- `export_asset` - Export images from designs (PNG, JPG, SVG, PDF)
- `get_design_tokens` - Extract design tokens (colors, typography, spacing)
- `search_files` - Search across your Figma files by name
- `get_components` - List components from a specific file
- `get_styles` - Get published styles (colors, text styles)

## Setup Instructions

### 1. Get Your Figma Personal Access Token

1. Log in to your Figma account
2. Click your profile picture → **Settings**
3. Go to **Account** tab → **Personal Access Tokens**
4. Click **Generate new token**
5. Give it a name (e.g., "MCP Proxy Server")
6. Copy the token (you won't see it again!)

### 2. Deploy the Server

#### Option A: Deploy to Render with Docker (Recommended)

1. Fork or push this repository to GitHub
2. Sign up at [render.com](https://render.com)
3. Create a new **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (auto-detected)
   - **Environment Variables**:
     - `FIGMA_ACCESS_TOKEN` = (your token from step 1)
     - `NODE_ENV` = `production`
     - `PORT` = `10000` (Render sets this automatically)
6. Deploy!

**📖 Detailed steps**: See [DEPLOYMENT.md](DEPLOYMENT.md) for complete walkthrough.

Your server URL will be: `https://your-service-name.onrender.com`

#### Option B: Deploy to Railway

1. Push to GitHub
2. Sign up at [railway.app](https://railway.app)
3. Create new project from GitHub repo
4. Add environment variable: `FIGMA_ACCESS_TOKEN`
5. Deploy!

#### Option C: Deploy to Other Platforms

Any Node.js hosting platform works:
- **Fly.io**: Use `fly.toml` configuration
- **AWS ECS/Lambda**: Containerize and deploy
- **DigitalOcean App Platform**: Similar to Render
- **Heroku**: Standard Node.js buildpack

### 3. Configure Cursor IDE (For Each Developer)

Each developer needs to add the MCP server to their Cursor configuration:

#### Mac
Edit: `~/Library/Application Support/Cursor/mcp.json`

#### Windows
Edit: `%APPDATA%\Cursor\mcp.json`

#### Linux
Edit: `~/.config/Cursor/mcp.json`

**Configuration:**

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

Replace `your-service-name.onrender.com` with your actual server URL.

**Note:** If your server requires authentication, you may need to add headers or use a different transport method.

### 4. Restart Cursor

After adding the configuration, restart Cursor IDE completely. The MCP server should now be available.

## Usage Examples

Once configured, developers can use natural language in Cursor to interact with Figma:

### List Files
```
"Show me all my Figma files"
"List the files in my Figma account"
```

### View File Content
```
"Show me the design for file [file-id]"
"Get the components from file [file-id]"
```

### Export Assets
```
"Export the logo from file [file-id] as PNG"
"Get a 2x scale export of node [node-id]"
```

### Get Design Tokens
```
"Extract design tokens from file [file-id]"
"Show me the colors and typography from [file-id]"
```

### Search Files
```
"Search for files named 'dashboard'"
"Find all files with 'mobile' in the name"
```

## Local Development

To run the server locally for testing:

```bash
# Install dependencies
npm install

# Create .env file
echo "FIGMA_ACCESS_TOKEN=your_token_here" > .env
echo "PORT=3000" >> .env

# Build
npm run build

# Run
npm start
```

The server will be available at `http://localhost:3000/sse`

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /sse` - SSE endpoint for MCP protocol (used by Cursor)
- `POST /message` - Message endpoint for client-to-server communication

## Security Considerations

1. **Token Security**: Your Figma token is stored in environment variables only - never commit it to git
2. **HTTPS**: Always use HTTPS in production (Render provides this automatically)
3. **Access Control**: Currently, anyone with the server URL can access it. For production, consider:
   - Adding API key authentication
   - IP whitelisting
   - User authentication

## Rate Limits

Figma API has rate limits:
- **120 requests per minute**
- **24,000 requests per day**

The server implements caching for file lists (5-minute cache) to reduce API calls.

## Troubleshooting

### Server won't start
- Check that `FIGMA_ACCESS_TOKEN` is set correctly
- Verify Node.js version (requires Node 20+)
- Check server logs for errors

### Cursor can't connect
- Verify the server URL is correct
- Check that the server is running (`/health` endpoint)
- Ensure Cursor config file syntax is valid JSON
- Restart Cursor completely after config changes

### No files showing
- Verify your Figma token has access to files
- Check server logs for API errors
- Test the Figma API directly with your token

## Project Structure

```
proxy_mcp_fogma/
├── src/
│   ├── index.ts              # Main server with HTTP/SSE transport
│   ├── figma-client.ts       # Figma API wrapper
│   ├── types.ts              # TypeScript types
│   ├── handlers/
│   │   ├── resources.ts      # Resource handlers
│   │   └── tools.ts          # Tool handlers
│   └── transport/
│       └── sse-transport.ts  # SSE transport implementation
├── package.json
├── tsconfig.json
├── render.yaml              # Render deployment config
└── README.md
```

## License

MIT

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Test Figma API access directly
4. Verify Cursor MCP configuration

