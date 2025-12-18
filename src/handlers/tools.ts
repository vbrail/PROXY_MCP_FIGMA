import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { FigmaClient } from '../figma-client.js';

export function setupToolHandlers(server: Server, figmaClient: FigmaClient) {
  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'export_asset',
          description: 'Export images/assets from Figma designs',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The Figma file ID',
              },
              nodeIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of node IDs to export',
              },
              format: {
                type: 'string',
                enum: ['png', 'jpg', 'svg', 'pdf'],
                default: 'png',
                description: 'Export format',
              },
              scale: {
                type: 'number',
                default: 1,
                description: 'Scale factor (1, 2, 3, etc.)',
              },
            },
            required: ['fileId', 'nodeIds'],
          },
        },
        {
          name: 'get_design_tokens',
          description: 'Extract design tokens (colors, typography, spacing) from a Figma file',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The Figma file ID',
              },
            },
            required: ['fileId'],
          },
        },
        {
          name: 'search_files',
          description: 'Search for Figma files by name',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (file name)',
              },
              teamId: {
                type: 'string',
                description: 'Optional team ID to search within',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_components',
          description: 'Get all components from a Figma file',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The Figma file ID',
              },
            },
            required: ['fileId'],
          },
        },
        {
          name: 'get_styles',
          description: 'Get published styles (colors, text styles) from a Figma file',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The Figma file ID',
              },
            },
            required: ['fileId'],
          },
        },
        {
          name: 'fetch_screenshots',
          description: 'Fetch screenshot images from Figma designs (downloads actual image data)',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The Figma file ID',
              },
              nodeIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of node IDs to fetch screenshots for',
              },
              format: {
                type: 'string',
                enum: ['png', 'jpg', 'svg', 'pdf'],
                default: 'png',
                description: 'Image format',
              },
              scale: {
                type: 'number',
                default: 1,
                description: 'Scale factor (1, 2, 3, etc.)',
              },
            },
            required: ['fileId', 'nodeIds'],
          },
        },
      ],
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'export_asset': {
          const fileId = args?.fileId as string;
          const nodeIds = args?.nodeIds as string[];
          const format = (args?.format as 'png' | 'jpg' | 'svg' | 'pdf') || 'png';
          const scale = (args?.scale as number) || 1;

          if (!fileId || !nodeIds || !Array.isArray(nodeIds)) {
            throw new Error('fileId and nodeIds (array) are required');
          }

          const images = await figmaClient.getImages(fileId, nodeIds, format, scale);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    images: images.images,
                    format,
                    scale,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'get_design_tokens': {
          const fileId = args?.fileId as string;
          if (!fileId) {
            throw new Error('fileId is required');
          }

          const tokens = await figmaClient.extractDesignTokens(fileId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(tokens, null, 2),
              },
            ],
          };
        }

        case 'search_files': {
          const query = args?.query as string;
          const teamId = args?.teamId as string | undefined;

          if (!query) {
            throw new Error('query is required');
          }

          const files = await figmaClient.searchFiles(query, teamId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    query,
                    results: files.map((f) => ({
                      key: f.key,
                      name: f.name,
                      lastModified: f.last_modified,
                      thumbnailUrl: f.thumbnail_url,
                    })),
                    count: files.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'get_components': {
          const fileId = args?.fileId as string;
          if (!fileId) {
            throw new Error('fileId is required');
          }

          const file = await figmaClient.getFile(fileId);
          const components = Object.entries(file.components || {}).map(([key, component]) => ({
            key,
            name: component.name,
            description: component.description,
            componentSetId: component.componentSetId,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    fileId,
                    components,
                    count: components.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'get_styles': {
          const fileId = args?.fileId as string;
          if (!fileId) {
            throw new Error('fileId is required');
          }

          const file = await figmaClient.getFile(fileId);
          const styles = Object.entries(file.styles || {}).map(([key, style]) => ({
            key,
            name: style.name,
            styleType: style.styleType,
            description: style.description,
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    fileId,
                    styles,
                    count: styles.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'fetch_screenshots': {
          const fileId = args?.fileId as string;
          const nodeIds = args?.nodeIds as string[];
          const format = (args?.format as 'png' | 'jpg' | 'svg' | 'pdf') || 'png';
          const scale = (args?.scale as number) || 1;

          if (!fileId || !nodeIds || !Array.isArray(nodeIds)) {
            throw new Error('fileId and nodeIds (array) are required');
          }

          // First get the image URLs
          const images = await figmaClient.getImages(fileId, nodeIds, format, scale);

          // Fetch the actual image data for each URL
          const screenshots = await Promise.all(
            Object.entries(images.images).map(async ([nodeId, imageUrl]) => {
              if (!imageUrl) {
                return {
                  nodeId,
                  error: 'No image URL returned',
                };
              }

              try {
                const imageData = await figmaClient.fetchScreenshotData(imageUrl);
                // Convert ArrayBuffer to base64
                const buffer = Buffer.from(imageData.data);
                const base64 = buffer.toString('base64');
                const dataUri = `data:${imageData.mimeType};base64,${base64}`;

                return {
                  nodeId,
                  url: imageUrl,
                  mimeType: imageData.mimeType,
                  dataUri,
                  size: imageData.data.byteLength,
                };
              } catch (error) {
                return {
                  nodeId,
                  url: imageUrl,
                  error: error instanceof Error ? error.message : String(error),
                };
              }
            })
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    screenshots,
                    format,
                    scale,
                    count: screenshots.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: true,
                message: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  });
}

