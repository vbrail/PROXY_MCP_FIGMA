import type {
  FigmaFile,
  FigmaFileListItem,
  FigmaProject,
  FigmaTeam,
  FigmaImageResponse,
  DesignToken,
  FigmaNode,
} from './types.js';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export class FigmaClient {
  private accessToken: string;
  private baseUrl: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('FIGMA_ACCESS_TOKEN is required');
    }
    this.accessToken = accessToken;
    this.baseUrl = FIGMA_API_BASE;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': this.accessToken,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Figma API error (${response.status}): ${errorText || response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get a list of files in your Figma account
   */
  async getFiles(teamId?: string): Promise<FigmaFileListItem[]> {
    const endpoint = teamId
      ? `/teams/${teamId}/files`
      : '/files';
    const response = await this.request<{ files: FigmaFileListItem[] }>(endpoint);
    return response.files || [];
  }

  /**
   * Get a specific file by ID
   */
  async getFile(fileId: string): Promise<FigmaFile> {
    return this.request<FigmaFile>(`/files/${fileId}`);
  }

  /**
   * Get file nodes (specific parts of a file)
   */
  async getFileNodes(fileId: string, nodeIds: string[]): Promise<{ nodes: Record<string, { document: FigmaNode }> }> {
    const ids = nodeIds.join(',');
    return this.request<{ nodes: Record<string, { document: FigmaNode }> }>(
      `/files/${fileId}/nodes?ids=${ids}`
    );
  }

  /**
   * Get list of teams
   */
  async getTeams(): Promise<FigmaTeam[]> {
    const response = await this.request<{ teams: FigmaTeam[] }>('/teams');
    return response.teams || [];
  }

  /**
   * Get projects for a team
   */
  async getProjects(teamId: string): Promise<FigmaProject[]> {
    const response = await this.request<{ projects: FigmaProject[] }>(
      `/teams/${teamId}/projects`
    );
    return response.projects || [];
  }

  /**
   * Get images from a file
   */
  async getImages(
    fileId: string,
    nodeIds: string[],
    format: 'png' | 'jpg' | 'svg' | 'pdf' = 'png',
    scale: number = 1
  ): Promise<FigmaImageResponse> {
    const ids = nodeIds.join(',');
    const response = await this.request<FigmaImageResponse>(
      `/images/${fileId}?ids=${ids}&format=${format}&scale=${scale}`
    );
    return response;
  }

  /**
   * Extract design tokens from a file
   */
  async extractDesignTokens(fileId: string): Promise<DesignToken> {
    const file = await this.getFile(fileId);
    const tokens: DesignToken = {
      colors: [],
      typography: [],
      spacing: [],
      effects: [],
    };

    // Extract colors from styles
    if (file.styles) {
      for (const [key, style] of Object.entries(file.styles)) {
        if (style.styleType === 'FILL') {
          // Note: We'd need to fetch the actual style value from the file
          // This is a simplified version
          tokens.colors.push({
            name: style.name,
            value: `#${key}`,
            rgba: { r: 0, g: 0, b: 0, a: 1 },
          });
        }
      }
    }

    // Extract colors from fills in nodes
    this.extractColorsFromNode(file.document, tokens.colors);

    // Extract typography from text nodes
    this.extractTypographyFromNode(file.document, tokens.typography);

    return tokens;
  }

  private extractColorsFromNode(node: FigmaNode, colors: DesignToken['colors']): void {
    if (node.fills && Array.isArray(node.fills)) {
      for (const fill of node.fills) {
        if (fill.type === 'SOLID' && fill.color) {
          const rgba = fill.color;
          const hex = this.rgbaToHex(rgba.r, rgba.g, rgba.b);
          colors.push({
            name: `${node.name || 'Color'}_${colors.length}`,
            value: hex,
            rgba: {
              r: Math.round(rgba.r * 255),
              g: Math.round(rgba.g * 255),
              b: Math.round(rgba.b * 255),
              a: rgba.a,
            },
          });
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        this.extractColorsFromNode(child, colors);
      }
    }
  }

  private extractTypographyFromNode(
    node: FigmaNode,
    typography: DesignToken['typography']
  ): void {
    if (node.type === 'TEXT' && node.style) {
      const style = node.style;
      typography.push({
        name: `${node.name || 'Text'}_${typography.length}`,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeightPx,
        letterSpacing: style.letterSpacing?.value,
      });
    }

    if (node.children) {
      for (const child of node.children) {
        this.extractTypographyFromNode(child, typography);
      }
    }
  }

  private rgbaToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Search files by name
   */
  async searchFiles(query: string, teamId?: string): Promise<FigmaFileListItem[]> {
    const allFiles = await this.getFiles(teamId);
    const lowerQuery = query.toLowerCase();
    return allFiles.filter((file) =>
      file.name.toLowerCase().includes(lowerQuery)
    );
  }
}

