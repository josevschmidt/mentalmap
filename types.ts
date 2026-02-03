
export interface MindMapNode {
  id: string;
  parentId: string | null;
  text: string;
  // Visual properties
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  depth?: number;
  children?: MindMapNode[];
  color?: string;
  collapsed?: boolean;
  image?: string;
  imageHeight?: number; // Customizable image height

  // Style Mode
  fillStyle?: 'outline' | 'filled';

  // Text Styling
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large' | 'gargantuan';
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;

  // Task Management
  isTask?: boolean;
  checked?: boolean;

  // Notes
  note?: string;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
}

export type ThemeType = 'modern' | 'midnight' | 'professional';

export interface Point {
  x: number;
  y: number;
}

export interface ViewState {
  scale: number;
  x: number;
  y: number;
}

export enum LayoutDirection {
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
  TOP_TO_BOTTOM = 'TB',
}

export interface AIRequestStatus {
  loading: boolean;
  error: string | null;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  nodes: MindMapNode[];
  relationships?: Relationship[]; // Save connections in history too
}
