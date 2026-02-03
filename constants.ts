
export const NODE_WIDTH = 220; // Default width
export const NODE_HEIGHT = 60; // Default height
export const MIN_WIDTH = 100;
export const MIN_HEIGHT = 40;

export const HORIZONTAL_SPACING = 80; // Gap between parent and child
export const VERTICAL_SPACING = 20;   // Gap between siblings

// MindMeister-ish palette + User Requests
export const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#334155', // dark grey
  '#000000', // black
  'url(#spark-gradient)', // purple fade
];

export const ROOT_NODE_ID = 'root';

export const INITIAL_NODES = [
  { id: ROOT_NODE_ID, parentId: null, text: 'Central Idea', fontSize: 'large' as const },
];

export const THEMES = {
  modern: {
    bg: 'bg-slate-50',
    grid: '#000',
    text: 'text-slate-900',
    nodeBg: '#ffffff',
    stroke: '#cbd5e1'
  },
  midnight: {
    bg: 'bg-slate-950',
    grid: '#fff',
    text: 'text-slate-100',
    nodeBg: '#1e293b',
    stroke: '#475569'
  },
  professional: {
    bg: 'bg-[#f0f2f5]',
    grid: '#94a3b8',
    text: 'text-slate-800 font-serif',
    nodeBg: '#ffffff',
    stroke: '#cbd5e1'
  }
};
