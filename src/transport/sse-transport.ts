import type { Transport } from '@modelcontextprotocol/sdk/types.js';
import type { Response } from 'express';
import { EventEmitter } from 'events';

/**
 * Custom SSE (Server-Sent Events) transport for MCP over HTTP
 * Handles server-to-client communication via SSE
 * Client-to-server communication handled via POST /message endpoint
 */
export class SSETransport extends EventEmitter implements Transport {
  private response: Response;
  private closed = false;
  private messageHandler?: (message: string) => void;

  constructor(response: Response) {
    super();
    this.response = response;
  }

  async send(message: string): Promise<void> {
    if (this.closed) {
      throw new Error('Transport is closed');
    }

    try {
      // Send message via SSE
      this.response.write(`data: ${message}\n\n`);
    } catch (error) {
      console.error('Error sending SSE message:', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Handle incoming messages from client (via POST)
  handleMessage(message: string): void {
    if (this.messageHandler) {
      this.messageHandler(message);
    } else {
      // Queue message if handler not set yet
      process.nextTick(() => {
        if (this.messageHandler) {
          this.messageHandler(message);
        }
      });
    }
  }

  // Set the message handler (called by server)
  setMessageHandler(handler: (message: string) => void): void {
    this.messageHandler = handler;
  }

  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    try {
      this.response.end();
      this.emit('close');
    } catch (error) {
      console.error('Error closing SSE transport:', error);
    }
  }

  onclose?: () => void;
  onerror?: (error: Error) => void;
}
