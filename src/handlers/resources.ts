import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { FigmaClient } from '../figma-client.js';

// Cache for file lists (5 minute TTL)
const fileListCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function setupResourceHandlers(server: Server, figmaClient: FigmaClient) {
  // List all available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      // Get teams to list projects
      const teams = await figmaClient.getTeams();
      const resources: Array<{
        uri: string;
        name: string;
        description: string;
        mimeType: string;
      }> = [
        {
          uri: 'figma://files',
          name: 'All Figma Files',
          description: 'List of all Figma files in your account',
          mimeType: 'application/json',
        },
      ];

      // Add team projects as resources
      for (const team of teams) {
        resources.push({
          uri: `figma://team/${team.id}`,
          name: `Team: ${team.name}`,
          description: `Files and projects for team: ${team.name}`,
          mimeType: 'application/json',
        });

        try {
          const projects = await figmaClient.getProjects(team.id);
          for (const project of projects) {
            resources.push({
              uri: `figma://project/${project.id}`,
              name: `Project: ${project.name}`,
              description: `Project: ${project.name} in team ${team.name}`,
              mimeType: 'application/json',
            });
          }
        } catch (error) {
          // Continue if we can't fetch projects for a team
          console.error(`Error fetching projects for team ${team.id}:`, error);
        }
      }

      return { resources };
    } catch (error) {
      throw new Error(`Failed to list resources: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  // Read a specific resource
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    try {
      // Handle figma://files
      if (uri === 'figma://files') {
        const cacheKey = 'files';
        const cached = fileListCache.get(cacheKey);
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_TTL) {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(cached.data, null, 2),
              },
            ],
          };
        }

        const files = await figmaClient.getFiles();
        const data = files.map((file) => ({
          key: file.key,
          name: file.name,
          thumbnailUrl: file.thumbnail_url,
          lastModified: file.last_modified,
        }));

        fileListCache.set(cacheKey, { data, timestamp: now });

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      // Handle figma://file/{file_id}
      if (uri.startsWith('figma://file/')) {
        const fileId = uri.replace('figma://file/', '');
        const file = await figmaClient.getFile(fileId);

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  name: file.name,
                  lastModified: file.lastModified,
                  version: file.version,
                  document: {
                    id: file.document.id,
                    name: file.document.name,
                    type: file.document.type,
                    children: file.document.children?.map((child) => ({
                      id: child.id,
                      name: child.name,
                      type: child.type,
                    })),
                  },
                  components: Object.keys(file.components || {}).length,
                  styles: Object.keys(file.styles || {}).length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Handle figma://team/{team_id}
      if (uri.startsWith('figma://team/')) {
        const teamId = uri.replace('figma://team/', '');
        const files = await figmaClient.getFiles(teamId);
        const projects = await figmaClient.getProjects(teamId);

        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  teamId,
                  files: files.map((f) => ({
                    key: f.key,
                    name: f.name,
                    lastModified: f.last_modified,
                  })),
                  projects: projects.map((p) => ({
                    id: p.id,
                    name: p.name,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Handle figma://project/{project_id}
      if (uri.startsWith('figma://project/')) {
        const projectId = uri.replace('figma://project/', '');
        // Note: Figma API doesn't directly support getting files by project
        // We'd need to iterate through teams and projects
        // For now, return a placeholder
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  projectId,
                  note: 'Project resource - files would be listed here',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      throw new Error(`Unknown resource URI: ${uri}`);
    } catch (error) {
      throw new Error(
        `Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}

