# Testing Guide for Figma MCP Proxy Server

## ✅ Server Status

Your server is live at: **https://proxy-mcp-figma.onrender.com**

### Quick Health Check

```bash
curl https://proxy-mcp-figma.onrender.com/health
```

Expected response:
```json
{"status":"ok","service":"figma-proxy-mcp-server"}
```

## 🧪 Testing in Cursor IDE

### 1. Verify Connection

Once Cursor is configured with your MCP server, test the connection:

**In Cursor chat, try:**
```
List my Figma files
```

or

```
Show me available Figma resources
```

### 2. Test Resources

**List all files:**
```
What Figma files do I have access to?
```

**View a specific file:**
```
Show me the design for file [file-key]
```

**List teams:**
```
What teams are in my Figma account?
```

### 3. Test Tools

**Search files:**
```
Search for Figma files named "dashboard"
```

**Get components:**
```
List all components from file [file-key]
```

**Get design tokens:**
```
Extract design tokens from file [file-key]
```

**Export assets:**
```
Export node [node-id] from file [file-key] as PNG
```

## 📊 Expected Behavior

### Successful Connection
- Cursor should connect without errors
- You should see resources and tools available
- Commands should execute and return data

### Common Issues

**"Session not found" error:**
- Server logs show connection established
- This is usually a timing issue - try again
- Check Render logs for session IDs

**"No server info found":**
- Connection might not be established
- Check Cursor MCP configuration
- Verify server URL is correct

**Timeout errors:**
- Free tier services sleep after 15 min
- First request after sleep takes ~30 seconds
- Consider upgrading for always-on service

## 🔍 Debugging

### Check Server Logs

1. Go to Render dashboard
2. Click on your service
3. View "Logs" tab
4. Look for:
   - `[GET /sse] MCP client connected`
   - `[POST /message] Found connection for session`
   - Any error messages

### Check Cursor Logs

Cursor logs show:
- Connection attempts
- Transport type (SSE)
- Error messages
- Session IDs

### Test Endpoints Manually

**Health:**
```bash
curl https://proxy-mcp-figma.onrender.com/health
```

**SSE (will stream continuously):**
```bash
curl -N https://proxy-mcp-figma.onrender.com/sse
```

**POST to /message (requires sessionId):**
```bash
curl -X POST "https://proxy-mcp-figma.onrender.com/message?sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{}}'
```

## ✅ Success Criteria

Your server is working correctly if:

1. ✅ Health endpoint returns `{"status":"ok"}`
2. ✅ SSE endpoint accepts connections
3. ✅ Cursor can list resources
4. ✅ Cursor can execute tools
5. ✅ Figma API calls succeed (check server logs)

## 🎯 Next Steps

Once basic testing passes:

1. **Test with real Figma files:**
   - List your actual files
   - View file contents
   - Export assets

2. **Test with your team:**
   - Have developers configure Cursor
   - Test concurrent connections
   - Verify access control

3. **Monitor performance:**
   - Check Render metrics
   - Monitor API rate limits
   - Review error logs

## 📝 Test Checklist

- [ ] Health endpoint responds
- [ ] SSE endpoint accepts connections
- [ ] Cursor connects successfully
- [ ] Can list Figma resources
- [ ] Can execute MCP tools
- [ ] Figma API calls work
- [ ] Multiple developers can connect
- [ ] Server handles disconnections gracefully

## 🐛 Reporting Issues

If you encounter issues:

1. Check Render service logs
2. Check Cursor MCP logs
3. Verify environment variables (FIGMA_ACCESS_TOKEN)
4. Test endpoints manually with curl
5. Review error messages in logs

Common fixes:
- Restart Cursor after config changes
- Check server is not sleeping (free tier)
- Verify Figma token is valid
- Check network connectivity

