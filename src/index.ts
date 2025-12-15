#!/usr/bin/env node

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { FigmaClient } from './figma-client.js';
import { setupResourceHandlers } from './handlers/resources.js';
import { setupToolHandlers } from './handlers/tools.js';
import { SSETransport } from './transport/sse-transport.js';

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

// Store active connections (connectionId -> { transport, server })
const activeConnections = new Map<string, { transport: SSETransport; server: Server }>();

// SSE endpoint for MCP (server-to-client)
app.get('/sse', async (req: Request, res: Response) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  const connectionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

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

  // Create SSE transport
  const transport = new SSETransport(res);

  // Set up message handler to route incoming messages to the server
  transport.setMessageHandler(async (message: string) => {
    try {
      // The MCP server expects to receive messages through its transport
      // We need to manually handle the JSON-RPC protocol
      const jsonMessage = JSON.parse(message);
      
      // Use the server's request handler to process the message
      // This is a simplified approach - in production you'd use the SDK's message routing
      if (jsonMessage.method) {
        // Handle the request through the server
        // Note: This is a workaround - the SDK's transport interface expects different handling
        console.log('Received message:', jsonMessage.method);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  try {
    // Connect server to transport
    // Note: The MCP SDK's connect method expects a transport that implements both send and receive
    // For SSE, we handle receive via POST endpoint below
    await connectionServer.connect(transport);
    activeConnections.set(connectionId, { transport, server: connectionServer });
    
    // Send connection ID to client
    res.write(`data: ${JSON.stringify({ type: 'connection', id: connectionId })}\n\n`);
    
    console.log(`MCP client connected via SSE [${connectionId}]`);
  } catch (error) {
    console.error('Error connecting MCP client:', error);
    res.status(500).end();
    return;
  }

  // Handle client disconnect
  req.on('close', () => {
    console.log(`MCP client disconnected [${connectionId}]`);
    activeConnections.delete(connectionId);
    transport.close();
  });
});

// Message endpoint for receiving messages from client (client-to-server)
app.post('/message', express.text({ type: '*/*' }), async (req: Request, res: Response) => {
  try {
    const message = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message body required' });
    }

    const connectionId = req.headers['x-connection-id'] as string || req.query.connectionId as string;

    if (!connectionId) {
      return res.status(400).json({ error: 'Connection ID required (x-connection-id header or connectionId query param)' });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Route message to the transport's message handler
    connection.transport.handleMessage(message);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ error: 'Internal server error' });
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

