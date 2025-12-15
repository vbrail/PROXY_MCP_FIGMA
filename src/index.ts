#!/usr/bin/env node

import express, { type Request, type Response } from 'express';
import type { ServerResponse, IncomingMessage } from 'node:http';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { FigmaClient } from './figma-client.js';
import { setupResourceHandlers } from './handlers/resources.js';
import { setupToolHandlers } from './handlers/tools.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_ACCESS_TOKEN) {
  console.error('ERROR: FIGMA_ACCESS_TOKEN environment variable is required');
  console.error('Set it in your .env file or environment variables');
  process.exit(1);
}

// Initialize Figma client
const figmaClient = new FigmaClient(FIGMA_ACCESS_TOKEN);

// Create MCP server
const server = new Server(
  {
    name: 'figma-proxy-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Setup handlers
setupResourceHandlers(server, figmaClient);
setupToolHandlers(server, figmaClient);

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'figma-proxy-mcp-server' });
});

// Store active connections (sessionId -> { transport, server })
const activeConnections = new Map<string, { transport: SSEServerTransport; server: Server }>();

// SSE endpoint for MCP (server-to-client)
app.get('/sse', async (req: Request, res: Response) => {
  // Create a new server instance for this connection
  const connectionServer = new Server(
    {
      name: 'figma-proxy-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  // Setup handlers for this server instance
  setupResourceHandlers(connectionServer, figmaClient);
  setupToolHandlers(connectionServer, figmaClient);

  // Create SSE transport using the SDK's built-in transport
  // Express Response extends Node.js ServerResponse, so this is compatible
  const transport = new SSEServerTransport('/message', res as unknown as ServerResponse);

  try {
    // Start the transport (sets up SSE connection)
    await transport.start();
    
    // Connect server to transport
    await connectionServer.connect(transport);
    
    // Store connection by session ID
    activeConnections.set(transport.sessionId, { transport, server: connectionServer });
    
    console.log(`MCP client connected via SSE [session: ${transport.sessionId}]`);
  } catch (error) {
    console.error('Error connecting MCP client:', error);
    res.status(500).end();
    return;
  }

  // Handle client disconnect
  req.on('close', () => {
    const sessionId = transport.sessionId;
    console.log(`MCP client disconnected [session: ${sessionId}]`);
    activeConnections.delete(sessionId);
    transport.close();
  });
});

// Message endpoint for receiving messages from client (client-to-server)
app.post('/message', express.raw({ type: '*/*' }), async (req: Request, res: Response) => {
  try {
    // Extract session ID from query string (SSEServerTransport sends it in the endpoint event)
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required in query string' });
    }

    const connection = activeConnections.get(sessionId);
    if (!connection) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Use the transport's built-in POST handler
    // It expects Node.js IncomingMessage and ServerResponse
    await connection.transport.handlePostMessage(
      req as unknown as IncomingMessage,
      res as unknown as ServerResponse
    );
  } catch (error) {
    console.error('Error handling message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Figma MCP Proxy Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

