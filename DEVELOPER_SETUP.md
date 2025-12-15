# Developer Setup Guide

This guide is for developers who will use the Figma MCP Proxy Server with Cursor IDE.

## Prerequisites

- Cursor IDE installed
- Access to the hosted MCP server URL (provided by your team lead)

## Step-by-Step Setup

### 1. Locate Cursor Configuration File

The location depends on your operating system:

**macOS:**
```
~/Library/Application Support/Cursor/mcp.json
```

**Windows:**
```
%APPDATA%\Cursor\mcp.json
```

**Linux:**
```
~/.config/Cursor/mcp.json
```

### 2. Create or Edit MCP Configuration

If the file doesn't exist, create it. If it exists, add the Figma proxy server to the existing configuration.

**Example configuration:**

```json
{
  "mcpServers": {
    "figma-proxy": {
      "transport": "sse",
      "url": "https://your-server-name.onrender.com/sse"
    }
  }
}
```

**Important:** Replace `your-server-name.onrender.com` with the actual server URL provided by your team lead.

### 3. Restart Cursor

After saving the configuration file:
1. **Completely quit** Cursor IDE (not just close the window)
2. Reopen Cursor
3. The MCP server should now be connected

### 4. Verify Connection

To verify the connection is working:

1. Open a chat in Cursor
2. Try asking: "List my Figma files" or "Show me available Figma resources"
3. If connected, Cursor should be able to access your Figma designs

## Troubleshooting

### Connection Issues

**Problem:** Cursor can't connect to the server

**Solutions:**
1. Verify the server URL is correct (check with your team lead)
2. Check that the server is running: Open `https://your-server-url/health` in a browser
3. Verify the JSON syntax in `mcp.json` is valid (use a JSON validator)
4. Check Cursor's console/logs for error messages
5. Try restarting Cursor completely

### No Figma Data Showing

**Problem:** Connected but no files/resources available

**Solutions:**
1. The server might not have access to Figma files (contact team lead)
2. Check server logs for API errors
3. Verify the Figma token is valid and has proper permissions

### Configuration File Not Found

**Problem:** Can't find the `mcp.json` file

**Solutions:**
1. Create the directory if it doesn't exist
2. Create the file with the configuration above
3. Ensure proper file permissions (readable by Cursor)

## Usage Examples

Once connected, you can use natural language in Cursor to interact with Figma:

### List Files
```
"Show me all my Figma files"
"What Figma files do I have access to?"
```

### View File Details
```
"Show me the design for file [file-key]"
"Get components from file [file-key]"
```

### Export Assets
```
"Export node [node-id] from file [file-key] as PNG"
"Get a 2x scale export of [node-id]"
```

### Design Tokens
```
"Extract design tokens from file [file-key]"
"Show me colors and typography from [file-key]"
```

### Search
```
"Search for files named 'dashboard'"
"Find files with 'mobile' in the name"
```

## Getting File IDs and Node IDs

To use the tools effectively, you'll need:
- **File Key/ID**: Found in Figma file URLs: `https://www.figma.com/file/[FILE_KEY]/...`
- **Node ID**: Found by selecting an element in Figma and checking the URL or using the Figma API

You can also ask Cursor to help you find these:
```
"List my Figma files with their IDs"
"Show me the node structure for file [file-key]"
```

## Support

If you encounter issues:
1. Check this troubleshooting guide
2. Contact your team lead
3. Check server status at `/health` endpoint

