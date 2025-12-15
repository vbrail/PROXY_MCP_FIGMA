// Figma API Response Types

export interface FigmaFile {
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  role: string;
  editorType: string;
  linkAccess: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  strokeWeight?: number;
  cornerRadius?: number;
  characters?: string;
  style?: FigmaTextStyle;
  absoluteBoundingBox?: FigmaBoundingBox;
  backgroundColor?: FigmaColor;
  exportSettings?: FigmaExportSetting[];
  [key: string]: unknown;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks: FigmaDocumentationLink[];
}

export interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
  documentationLinks: FigmaDocumentationLink[];
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description: string;
}

export interface FigmaFill {
  type: string;
  color?: FigmaColor;
  opacity?: number;
  gradientStops?: unknown[];
  [key: string]: unknown;
}

export interface FigmaStroke {
  type: string;
  color?: FigmaColor;
  opacity?: number;
  [key: string]: unknown;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  fontSize: number;
  fontWeight: number;
  textCase?: string;
  textDecoration?: string;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  letterSpacing?: FigmaLetterSpacing;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  [key: string]: unknown;
}

export interface FigmaLetterSpacing {
  value: number;
  unit: string;
}

export interface FigmaExportSetting {
  suffix: string;
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

export interface FigmaDocumentationLink {
  uri: string;
}

export interface FigmaFileListItem {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

export interface FigmaProject {
  id: string;
  name: string;
}

export interface FigmaTeam {
  id: string;
  name: string;
}

export interface FigmaImageResponse {
  images: Record<string, string>;
  error?: boolean;
  status?: number;
}

export interface DesignToken {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  effects: EffectToken[];
}

export interface ColorToken {
  name: string;
  value: string;
  rgba: { r: number; g: number; b: number; a: number };
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface SpacingToken {
  name: string;
  value: number;
}

export interface EffectToken {
  name: string;
  type: string;
  value: unknown;
}

