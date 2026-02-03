import * as d3 from 'd3';
import { MindMapNode } from '../types';
import { NODE_HEIGHT, NODE_WIDTH, HORIZONTAL_SPACING, VERTICAL_SPACING, COLORS } from '../constants';

/**
 * Transforms a flat list of nodes into a hierarchical tree structure with x,y coordinates.
 * Supports multiple disconnected trees (roots).
 * Respects individual node width/height.
 */
export const calculateLayout = (
  flatNodes: MindMapNode[]
): { nodes: MindMapNode[]; width: number; height: number } => {
  if (flatNodes.length === 0) return { nodes: [], width: 0, height: 0 };

  // Identify all roots (nodes with no parent)
  const rootNodes = flatNodes.filter(n => !n.parentId);

  let allLayoutNodes: MindMapNode[] = [];
  let globalMinX = Infinity, globalMaxX = -Infinity;
  let globalMinY = Infinity, globalMaxY = -Infinity;

  // Process each tree independently
  rootNodes.forEach(rootNode => {
    // Get all descendants for this root
    const descendantsIds = new Set<string>();
    const getDescendants = (id: string) => {
      flatNodes.filter(n => n.parentId === id).forEach(child => {
        descendantsIds.add(child.id);
        getDescendants(child.id);
      });
    };
    getDescendants(rootNode.id);

    // Filter nodes for this specific tree
    const treeNodes = flatNodes.filter(n => n.id === rootNode.id || descendantsIds.has(n.id));

    if (treeNodes.length === 0) return;

    try {
      const stratify = d3.stratify<MindMapNode>()
        .id((d) => d.id)
        .parentId((d) => d.parentId);

      const root = stratify(treeNodes);

      // Prune collapsed branches
      root.each((node) => {
        if (node.data.collapsed && node.children) {
          // @ts-ignore
          node._children = node.children;
          node.children = undefined;
        }
        // Ensure dimensions exist
        node.data.width = node.data.width || NODE_WIDTH;
        node.data.height = node.data.height || NODE_HEIGHT;
      });

      // Configure tree layout
      const treeLayout = d3.tree<MindMapNode>()
        .nodeSize([1, 1])
        .separation((a, b) => {
          // Calculate required vertical distance
          const aHeight = (a.data.height || NODE_HEIGHT) + (a.data.image ? (a.data.imageHeight || 80) : 0);
          const bHeight = (b.data.height || NODE_HEIGHT) + (b.data.image ? (b.data.imageHeight || 80) : 0);

          const sep = (aHeight / 2) + (bHeight / 2) + VERTICAL_SPACING;
          return sep;
        });

      treeLayout(root);

      // Post-process X coordinates to handle variable widths
      const rootXOffset = rootNode.x || 0;
      const rootYOffset = rootNode.y || 0;

      // Adjust Visual X (D3.y) manually
      root.eachBefore(node => {
        if (node.parent) {
          // Parent's Visual X (Center)
          // @ts-ignore
          const parentVisualX = node.parent._visualX || 0;
          // Parent's Width
          const parentWidth = node.parent.data.width || NODE_WIDTH;
          // Child's Width
          const childWidth = node.data.width || NODE_WIDTH;

          // Visual X = Parent Center + Parent Half Width + Spacing + Child Half Width
          // @ts-ignore
          node._visualX = parentVisualX + (parentWidth / 2) + HORIZONTAL_SPACING + (childWidth / 2);
        } else {
          // Root
          // @ts-ignore
          node._visualX = 0;
        }
      });

      const descendants = root.descendants();

      const layoutNodes = descendants.map((d) => {
        // D3 x is vertical position (centered at 0 for root)
        // D3 y is horizontal depth

        // Use our calculated Visual X
        // @ts-ignore
        const relativeX = d._visualX;
        const relativeY = d.x; // D3 calculated vertical layout based on separation

        const finalX = rootXOffset + relativeX;
        const finalY = rootYOffset + relativeY;

        globalMinX = Math.min(globalMinX, finalX);
        globalMaxX = Math.max(globalMaxX, finalX);
        globalMinY = Math.min(globalMinY, finalY);
        globalMaxY = Math.max(globalMaxY, finalY);

        // Color logic
        let color = '#64748b';
        if (d.depth === 0) {
          color = '#0f172a';
        } else {
          // Priority:
          // 1. Explicit color on node
          // 2. Explicit color on ancestor (up to depth 1)
          // 3. Fallback to index-based color from depth 1 ancestor

          if (d.data.color) {
            color = d.data.color;
          } else {
            let ancestor = d;
            let foundColor = null;

            // Climb up to find an inherited color
            while (ancestor.parent && ancestor.depth > 0) {
              if (ancestor.data.color) {
                foundColor = ancestor.data.color;
                break;
              }
              ancestor = ancestor.parent;
            }

            if (foundColor) {
              color = foundColor;
            } else {
              // No explicit color found in lineage, use index-based fallback
              // Find the branch root (depth 1)
              ancestor = d;
              while (ancestor.depth > 1 && ancestor.parent) {
                ancestor = ancestor.parent;
              }
              if (ancestor.parent) {
                const childIndex = ancestor.parent.children?.indexOf(ancestor) || 0;
                color = COLORS[childIndex % COLORS.length];
              }
            }
          }
        }

        return {
          ...d.data,
          x: finalX,
          y: finalY,
          depth: d.depth,
          color: color,
          // @ts-ignore
          children: (d.children || d._children)?.map(c => c.data)
        };
      });

      allLayoutNodes = [...allLayoutNodes, ...layoutNodes];

    } catch (e) {
      console.error("Layout calculation failed for tree", rootNode.id, e);
      allLayoutNodes.push(rootNode);
    }
  });

  return {
    nodes: allLayoutNodes,
    width: globalMaxX - globalMinX + NODE_WIDTH,
    height: globalMaxY - globalMinY + NODE_HEIGHT
  };
};

/**
 * Generate a smooth bezier curve path between two nodes (Left-to-Right layout)
 */
export const getLinkPath = (source: MindMapNode, target: MindMapNode) => {
  // Source is on the Right edge
  const sourceWidth = source.width || NODE_WIDTH;
  const sourceX = (source.x || 0) + sourceWidth / 2;
  const sourceY = (source.y || 0);

  // Target is on the Left edge
  const targetWidth = target.width || NODE_WIDTH;
  const targetX = (target.x || 0) - targetWidth / 2;
  const targetY = (target.y || 0);

  const linkGenerator = d3.linkHorizontal<any, any>()
    .x((d: any) => d.x)
    .y((d: any) => d.y);

  return linkGenerator({
    source: { x: sourceX, y: sourceY },
    target: { x: targetX, y: targetY }
  }) || '';
};