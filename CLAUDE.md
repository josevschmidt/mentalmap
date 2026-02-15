# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build locally
```

No test runner or linter is configured. There is no separate Tailwind config file — Tailwind CSS is loaded via CDN in `index.html`.

## Architecture

**MentalMap** is a React 19 + TypeScript mind-mapping app bundled with Vite. It uses D3.js for tree layout calculations, Supabase for auth/storage, and Tailwind CSS (CDN) for styling. Icons come from `lucide-react`.

### Core Data Flow

The app uses a **flat node array** pattern — all nodes live in a single `MindMapNode[]` state in `App.tsx`, with parent-child relationships expressed via `parentId`. This flat array is converted to a visual tree by `utils/treeLayout.ts` using D3's tree layout algorithm. Multiple disconnected root nodes are supported.

`App.tsx` is the central state owner (~600 lines). It holds:
- `nodes` / `relationships` (the map data)
- All UI modal open/close states
- History buffer (50-entry undo stack)
- Auto-save logic (1s debounce to Supabase)

### Key Modules

| Module | Purpose |
|---|---|
| `App.tsx` | Root state, all handlers, auto-save, keyboard shortcuts |
| `components/MindMapCanvas.tsx` | SVG canvas rendering, pan/zoom, drag-and-drop |
| `components/MindNode.tsx` | Individual node rendering, inline editing, context menu |
| `utils/treeLayout.ts` | D3-based layout: flat nodes → positioned tree with bezier paths |
| `utils/export.ts` | Export to JSON, PNG (html-to-image), PDF (jsPDF), plain text |
| `services/auth.tsx` | Google SSO via Supabase, `AuthProvider` context + `useAuth()` hook |
| `services/storage.ts` | CRUD for maps in Supabase, 1MB per-user storage limit |
| `services/supabase.ts` | Safe Supabase client init (graceful fallback if keys missing) |
| `types.ts` | All shared TypeScript interfaces (`MindMapNode`, `Relationship`, etc.) |
| `constants.ts` | Layout dimensions, color palette, themes, root node ID |

### Modal Pattern

All modals follow the same pattern as `ExportModal.tsx`: backdrop at `z-[70]`, centered card, `isOpen` prop for conditional rendering (`if (!isOpen) return null`), close via X button or backdrop click.

### Styling Conventions

- Tailwind utility classes exclusively (no CSS modules or styled-components)
- Three themes defined in `constants.ts`: `modern`, `midnight`, `professional`
- Node branch colors assigned from `COLORS` array by sibling index, inherited by children
- Node fill modes: `outline` (border only) or `filled` (solid background)

### Environment Variables

```
VITE_SUPABASE_URL       # Supabase project URL
VITE_SUPABASE_ANON_KEY  # Supabase anonymous/public key
```

The app works without these (local-only mode with a dummy Supabase client).

### Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) builds on push to `main` and deploys `dist/` to FTP. Supabase credentials are injected as GitHub Secrets during build.

### Import System

`ImportModal.tsx` supports two input methods: file upload (`.json` / `.txt`) and text input. Text format uses numbered outlines (e.g., `1.1 Node Name`) where numbering determines hierarchy. JSON accepts either a node array or `{ nodes, relationships }` object.
