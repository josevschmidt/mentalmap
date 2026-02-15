import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { MindMapNode, Relationship, ThemeType, BackgroundStyle } from '../types';
import { calculateLayout } from '../utils/treeLayout';
import { MindNode } from './MindNode';
import { Connection } from './Connection';
import { THEMES } from '../constants';

interface MindMapCanvasProps {
  nodes: MindMapNode[];
  relationships: Relationship[];
  selectedIds: string[];
  onSelectNodes: (ids: string[]) => void;
  onUpdateNodeText: (id: string, text: string) => void;
  onUpdateNodeStyle: (id: string, stylePatch: Partial<MindMapNode>) => void;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddImage: (id: string) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  lastCreatedNodeId: string | null;
  isFocusMode: boolean;
  isPresenterMode: boolean;
  theme: ThemeType;
  backgroundStyle: BackgroundStyle;

  // New props for features
  connectingNodeId: string | null;
  onNodeConnection: (sourceId: string, targetId: string) => void;
  onMoveNodeTo: (nodeId: string, newParentId: string | null, siblingId: string | null) => void;
  centerOnNodeId: string | null;
  onCenterComplete: () => void;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  nodes,
  relationships,
  selectedIds,
  onSelectNodes,
  onUpdateNodeText,
  onUpdateNodeStyle,
  onAddChild,
  onDeleteNode,
  onToggleCollapse,
  onAddImage,
  onMoveNode,
  lastCreatedNodeId,
  isFocusMode,
  isPresenterMode,
  theme,
  backgroundStyle,
  connectingNodeId,
  onNodeConnection,
  onMoveNodeTo,
  centerOnNodeId,
  onCenterComplete,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Box Selection State
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  // Managed Drag State
  const [draggingState, setDraggingState] = useState<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
    currentX: number; // World Coords
    currentY: number; // World Coords
  } | null>(null);

  const [dragTarget, setDragTarget] = useState<{ id: string; action: 'reparent' | 'before' | 'after' } | null>(null);

  // Compute Layout
  const { nodes: layoutNodes } = useMemo(() => calculateLayout(nodes), [nodes]);

  // Precompute children existence
  const parentIds = useMemo(() => {
    const ids = new Set<string>();
    nodes.forEach(node => {
      if (node.parentId) ids.add(node.parentId);
    });
    return ids;
  }, [nodes]);

  // Refs for Drag Logic (Must be defined after layoutNodes)
  const draggingStateRef = useRef(draggingState);
  const layoutNodesRef = useRef(layoutNodes);
  const dragTargetRef = useRef(dragTarget);

  useEffect(() => { draggingStateRef.current = draggingState; }, [draggingState]);
  useEffect(() => { layoutNodesRef.current = layoutNodes; }, [layoutNodes]);
  useEffect(() => { dragTargetRef.current = dragTarget; }, [dragTarget]);

  // Focus Mode Calculation
  const focusedNodeIds = useMemo(() => {
    if (!isFocusMode || selectedIds.length === 0) return null; // Null means everything is focused

    const ids = new Set<string>();
    const addSubtree = (parentId: string) => {
      ids.add(parentId);
      nodes.filter(n => n.parentId === parentId).forEach(child => addSubtree(child.id));
    };
    const addAncestors = (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.parentId) {
        ids.add(node.parentId);
        addAncestors(node.parentId);
      }
    };
    selectedIds.forEach(id => {
      addSubtree(id);
      addAncestors(id);
    });
    return ids;
  }, [isFocusMode, selectedIds, nodes]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Zoom/Pan
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .wheelDelta((event) => {
        // Touchpad pinch sends small deltaY with ctrlKey; mouse wheel sends large deltaY.
        // Dampen mouse wheel so zoom feels consistent across input devices.
        const delta = -event.deltaY;
        const isTouchpad = event.deltaMode === 0 && Math.abs(event.deltaY) < 50;
        return delta * (isTouchpad ? 0.01 : 0.002);
      })
      .filter((event) => {
        if (event.type === 'mousedown' && event.button === 1) return true;
        if (event.type === 'wheel' && event.ctrlKey) return true;
        if (event.type.startsWith('touch')) return true;
        return false;
      })
      .on('zoom', (event) => {
        d3.select(gRef.current).attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom).on("dblclick.zoom", null);

    svg.on("wheel.pan", (event) => {
      const e = event as WheelEvent;
      if (e.ctrlKey) return;
      e.preventDefault();
      const currentTransform = d3.zoomTransform(svg.node()!);
      const dx = -e.deltaX / currentTransform.k;
      const dy = -e.deltaY / currentTransform.k;
      zoom.translateBy(svg, dx, dy);
    });

    // Initial center
    const currentTransform = d3.zoomTransform(svg.node()!);
    if (currentTransform.k === 1 && currentTransform.x === 0 && currentTransform.y === 0) {
      const initialTransform = d3.zoomIdentity
        .translate(dimensions.width / 2, dimensions.height / 2)
        .scale(1);
      svg.call(zoom.transform, initialTransform);
    }

    return () => {
      svg.on(".zoom", null);
      svg.on("wheel.pan", null);
    };

  }, [dimensions]);

  // Auto-reposition camera to keep selected node visible
  useEffect(() => {
    if (!zoomRef.current || !svgRef.current || selectedIds.length !== 1 || draggingState) return;

    const nodeId = selectedIds[0];
    const node = layoutNodes.find(n => n.id === nodeId);
    if (!node) return;

    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svgRef.current);
    const { width, height } = dimensions;
    const k = currentTransform.k;

    const nodeW = node.width || 200;
    const nodeH = node.height || 60;

    const w = nodeW * k;
    const h = nodeH * k;
    const x = currentTransform.x + (node.x || 0) * k;
    const y = currentTransform.y + (node.y || 0) * k;

    const screenLeft = x - w / 2;
    const screenRight = x + w / 2;
    const screenTop = y - h / 2;
    const screenBottom = y + h / 2;
    const padding = 100;

    let dx = 0;
    let dy = 0;

    if (screenLeft < padding) dx = padding - screenLeft;
    else if (screenRight > width - padding) dx = (width - padding) - screenRight;

    if (screenTop < padding) dy = padding - screenTop;
    else if (screenBottom > height - padding) dy = (height - padding) - screenBottom;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      const newTransform = currentTransform.translate(dx / k, dy / k);
      svg.transition().duration(500).ease(d3.easeCubicOut).call(zoomRef.current.transform, newTransform);
    }
  }, [selectedIds, layoutNodes, dimensions, draggingState]);

  // Center camera on a specific node (e.g. root) when requested
  useEffect(() => {
    if (!centerOnNodeId || !zoomRef.current || !svgRef.current) return;
    const node = layoutNodes.find(n => n.id === centerOnNodeId);
    if (!node) {
      onCenterComplete();
      return;
    }
    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const nodeCenterX = node.x ?? 0;
    const nodeCenterY = node.y ?? 0;
    const newTransform = d3.zoomIdentity
      .translate(width / 2 - nodeCenterX, height / 2 - nodeCenterY)
      .scale(1);
    svg.transition().duration(400).ease(d3.easeCubicOut).call(zoomRef.current.transform, newTransform);
    onCenterComplete();
  }, [centerOnNodeId, layoutNodes, dimensions, onCenterComplete]);

  // Interaction Handlers
  const getSvgPoint = (clientX: number, clientY: number) => {
    if (!gRef.current) return { x: 0, y: 0 };
    const transform = d3.zoomTransform(svgRef.current!);
    return {
      x: (clientX - transform.x) / transform.k,
      y: (clientY - transform.y) / transform.k
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // If linking, cancel
    if (connectingNodeId) {
      onNodeConnection('', ''); // Cancel
      return;
    }
    const { x, y } = getSvgPoint(e.clientX, e.clientY);
    setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
    if (!e.shiftKey && !e.ctrlKey) onSelectNodes([]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (selectionBox) {
      const { x, y } = getSvgPoint(e.clientX, e.clientY);
      setSelectionBox(prev => prev ? { ...prev, currentX: x, currentY: y } : null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (selectionBox) {
      const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
      const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
      const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
      const y2 = Math.max(selectionBox.startY, selectionBox.currentY);

      const intersectedIds = layoutNodes.filter(node => {
        const nx = (node.x || 0);
        const ny = (node.y || 0);
        return nx >= x1 && nx <= x2 && ny >= y1 && ny <= y2;
      }).map(n => n.id);

      if (intersectedIds.length > 0) {
        if (e.shiftKey || e.ctrlKey) {
          const newSet = new Set([...selectedIds, ...intersectedIds]);
          onSelectNodes(Array.from(newSet));
        } else {
          onSelectNodes(intersectedIds);
        }
      }
      setSelectionBox(null);
    }
  };

  // --- Managed Drag System ---

  const handleNodeDragStart = (nodeId: string, clientX: number, clientY: number) => {
    // Calculate Drag Offset
    const node = layoutNodes.find(n => n.id === nodeId);
    if (!node) return;

    const worldPos = getSvgPoint(clientX, clientY);

    const newState = {
      nodeId,
      offsetX: worldPos.x - (node.x || 0),
      offsetY: worldPos.y - (node.y || 0),
      currentX: worldPos.x,
      currentY: worldPos.y
    };

    setDraggingState(newState);
    draggingStateRef.current = newState; // Immediate update for ref

    if (!selectedIds.includes(nodeId)) onSelectNodes([nodeId]);
  };


  useEffect(() => {
    if (!draggingState) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Use refs to get latest state without re-binding listener
      const currentState = draggingStateRef.current;
      if (!currentState) return;

      const worldPos = getSvgPoint(e.clientX, e.clientY);

      // Update State (triggers render for visual update)
      setDraggingState(prev => prev ? {
        ...prev,
        currentX: worldPos.x,
        currentY: worldPos.y
      } : null);

      // Hit Testing
      // Use layoutNodesRef
      const draggedX = worldPos.x - currentState.offsetX;
      const draggedY = worldPos.y - currentState.offsetY;

      const nodes = layoutNodesRef.current;

      // 1. Strict Hit Testing for Reordering (Must be close to actual node bounds)
      let reorderTarget: { id: string, action: 'before' | 'after' } | null = null;
      let closestReparent: MindMapNode | null = null;
      let minReparentDist = Infinity;

      const REORDER_PADDING = 20; // Strict padding for reordering
      const REPARENT_RADIUS = 300; // Wide radius for reparenting

      nodes.forEach(node => {
        if (node.id === currentState.nodeId) return;
        if (draggedSubtreeIds.has(node.id)) return;

        const w = node.width || 200;
        const h = node.height || 60;
        const nx = node.x || 0;
        const ny = node.y || 0;

        // Check Loop 1: Strict Reorder Check
        // If we are strictly *inside* the vertical bounds + small padding
        if (draggedX >= nx - w / 2 - REORDER_PADDING && draggedX <= nx + w / 2 + REORDER_PADDING &&
          draggedY >= ny - h / 2 - REORDER_PADDING && draggedY <= ny + h / 2 + REORDER_PADDING) {

          const localY = draggedY - (ny - h / 2);
          // Top 25% -> Before
          if (localY < h * 0.25) {
            reorderTarget = { id: node.id, action: 'before' };
          }
          // Bottom 25% -> After
          else if (localY > h * 0.75) {
            reorderTarget = { id: node.id, action: 'after' };
          }
        }

        // Check Loop 2: Proximity Reparent Check
        const dx = draggedX - nx;
        const dy = draggedY - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPARENT_RADIUS && dist < minReparentDist) {
          minReparentDist = dist;
          closestReparent = node;
        }
      });

      // Decision Logic
      if (reorderTarget) {
        setDragTarget(reorderTarget);
      } else if (closestReparent) {
        setDragTarget({ id: closestReparent.id, action: 'reparent' });
      } else {
        setDragTarget(null);
      }

    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      const currentState = draggingStateRef.current;
      const currentTarget = dragTargetRef.current;
      const nodes = layoutNodesRef.current;

      if (currentState && currentTarget) {
        const sourceId = currentState.nodeId;
        const targetId = currentTarget.id;

        if (currentTarget.action === 'reparent') {
          onMoveNodeTo(sourceId, targetId, null);
        } else {
          const targetNode = nodes.find(n => n.id === targetId);
          if (targetNode) {
            const newParentId = targetNode.parentId || null;
            const siblings = nodes.filter(n => n.parentId === newParentId);
            const idx = siblings.findIndex(n => n.id === targetId);

            if (currentTarget.action === 'before') {
              onMoveNodeTo(sourceId, newParentId, targetId);
            } else {
              if (idx < siblings.length - 1) {
                onMoveNodeTo(sourceId, newParentId, siblings[idx + 1].id);
              } else {
                onMoveNodeTo(sourceId, newParentId, null);
              }
            }
          }
        }
      } else if (currentState) {
        // Free move
        const node = nodes.find(n => n.id === currentState.nodeId);
        if (node && !node.parentId) {
          const x = currentState.currentX - currentState.offsetX;
          const y = currentState.currentY - currentState.offsetY;
          onMoveNode(currentState.nodeId, x, y);
        }
      }

      setDraggingState(null);
      setDragTarget(null);
      draggingStateRef.current = null;
      dragTargetRef.current = null;
    };

    // Add listeners once per drag session
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingState !== null]); // Only re-run when drag starts/stops, NOT on every mousemove

  // Clean up old handlers
  // (Removed handleNodeDrag and handleNodeDragEnd)


  const handleNodeClick = (id: string, multi: boolean) => {
    if (connectingNodeId) {
      if (connectingNodeId !== id) {
        onNodeConnection(connectingNodeId, id);
      } else {
        onNodeConnection('', ''); // Cancel if self
      }
      return;
    }

    if (multi) {
      if (selectedIds.includes(id)) onSelectNodes(selectedIds.filter(sid => sid !== id));
      else onSelectNodes([...selectedIds, id]);
    } else {
      onSelectNodes([id]);
    }
  };

  // Helper to get all descendants
  const getDescendantIds = (nodeId: string, allNodes: MindMapNode[]) => {
    const descendants = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      descendants.add(current);
      allNodes.filter(n => n.parentId === current).forEach(child => stack.push(child.id));
    }
    return descendants;
  };

  // Memoize dragged subtree IDs to avoid recalc on every frame
  const draggedSubtreeIds = useMemo(() => {
    if (!draggingState) return new Set<string>();
    return getDescendantIds(draggingState.nodeId, layoutNodes);
  }, [draggingState?.nodeId, layoutNodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, MindMapNode>();
    layoutNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [layoutNodes]);

  const currentTheme = THEMES[theme];

  return (
    <div id="mindmap-canvas-container" className={`w-full h-full overflow-hidden relative select-none cursor-default ${currentTheme.bg}`}>
      {/* Linking Mode Indicator */}
      {connectingNodeId && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse pointer-events-none">
          Click another node to connect
        </div>
      )}

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setSelectionBox(null)}
      >
        <defs>
          <linearGradient id="spark-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          {backgroundStyle !== 'none' && (
            <>
              <pattern id="canvas-dotted-pattern" patternUnits="userSpaceOnUse" width={20} height={20}>
                <circle cx={10} cy={10} r={1} fill={currentTheme.grid} />
              </pattern>
              <pattern id="canvas-grid-pattern" patternUnits="userSpaceOnUse" width={20} height={20}>
                <line x1={0} y1={0} x2={0} y2={20} stroke={currentTheme.grid} strokeWidth={1} />
                <line x1={0} y1={0} x2={20} y2={0} stroke={currentTheme.grid} strokeWidth={1} />
              </pattern>
            </>
          )}
        </defs>

        <g ref={gRef}>
          {/* Background (inside zoom group so it scales with zoom) */}
          {backgroundStyle !== 'none' && (
            <rect
              x={-10000}
              y={-10000}
              width={20000}
              height={20000}
              fill={backgroundStyle === 'dotted' ? 'url(#canvas-dotted-pattern)' : 'url(#canvas-grid-pattern)'}
              opacity={0.2}
              className="pointer-events-none"
            />
          )}
          {/* Relationships Layer (Cross-links) */}
          <g>
            {relationships.map(rel => {
              const src = nodeMap.get(rel.sourceId);
              const tgt = nodeMap.get(rel.targetId);
              if (!src || !tgt) return null;

              const sx = src.x || 0;
              const sy = src.y || 0;
              const tx = tgt.x || 0;
              const ty = tgt.y || 0;

              // Quadratic Bezier for loose coupling
              const midX = (sx + tx) / 2;
              const midY = (sy + ty) / 2 - 50; // Curve up slightly

              const d = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;

              return (
                <path
                  key={rel.id}
                  d={d}
                  fill="none"
                  stroke={theme === 'midnight' ? '#f472b6' : '#ec4899'}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              )
            })}
          </g>

          {/* Tree Connections Layer */}
          <g>
            {layoutNodes.map(node => {
              if (!node.parentId) return null;
              const parent = nodeMap.get(node.parentId);
              if (!parent) return null;

              const isDimmed = focusedNodeIds ? !focusedNodeIds.has(node.id) : false;

              return (
                <Connection
                  key={`link-${node.id}`}
                  source={parent}
                  target={node}
                  isDimmed={isDimmed}
                />
              );
            })}
          </g>

          {/* Nodes Layer */}
          <g>
            {[...layoutNodes].sort((a, b) => {
              const aSelected = selectedIds.includes(a.id);
              const bSelected = selectedIds.includes(b.id);
              if (aSelected && !bSelected) return 1;
              if (!aSelected && bSelected) return -1;
              return 0;
            }).map(node => {
              const isDimmed = focusedNodeIds ? !focusedNodeIds.has(node.id) : false;

              // Calculate Progress for Task Nodes
              const children = layoutNodes.filter(n => n.parentId === node.id);
              const taskChildren = children.filter(c => c.isTask);
              let progress = 0;
              if (taskChildren.length > 0) {
                progress = taskChildren.filter(c => c.checked).length / taskChildren.length;
              }
              const hasTaskChildren = taskChildren.length > 0;

              const isDragging = draggingState?.nodeId === node.id;

              return (
                <MindNode
                  key={node.id}
                  node={node}
                  isSelected={selectedIds.includes(node.id)}
                  isConnecting={connectingNodeId === node.id}
                  onSelect={handleNodeClick}
                  onUpdateText={onUpdateNodeText}
                  onUpdateStyle={onUpdateNodeStyle}
                  onAddChild={onAddChild}
                  onDelete={onDeleteNode}
                  onToggleCollapse={onToggleCollapse}
                  onAddImage={onAddImage}
                  onDragStart={handleNodeDragStart}
                  initialEdit={node.id === lastCreatedNodeId}
                  hasChildren={parentIds.has(node.id)}
                  isRoot={!node.parentId}
                  isDimmed={isDimmed || isDragging} // Reuse dimming or opacity prop
                  isPresenterMode={isPresenterMode}
                  theme={theme}
                  hasTaskChildren={hasTaskChildren}
                  progress={progress}
                  onStartConnection={(id) => onNodeConnection(id, '')} // Start connection mode
                />
              );
            })}
          </g>

          {/* Drag Proxy & Predictive Connection */}
          {draggingState && (() => {
            const node = layoutNodes.find(n => n.id === draggingState.nodeId);
            if (!node) return null;

            const x = draggingState.currentX - draggingState.offsetX;
            const y = draggingState.currentY - draggingState.offsetY;
            const w = node.width || 200;
            const h = node.height || 60;

            // Calculate Predictive Connection Start Point
            let startX = x;
            let startY = y;
            let hasConnection = false;

            if (dragTarget) {
              let targetParentId: string | null = null;
              if (dragTarget.action === 'reparent') {
                targetParentId = dragTarget.id;
              } else {
                const t = layoutNodes.find(n => n.id === dragTarget.id);
                if (t) targetParentId = t.parentId || null;
                if (targetParentId) {
                  const parent = layoutNodes.find(n => n.id === targetParentId);
                  if (parent) {
                    const px = parent.x || 0;
                    const py = parent.y || 0;
                    const pw = parent.width || 200;

                    // Draw from Parent Right/Left to Proxy
                    // Simple logic: if proxy is right of parent, connect parent-right to proxy-left
                    startX = x >= px ? px + pw / 2 : px - pw / 2;
                    startY = py;
                    hasConnection = true;
                  }
                }
              }
            } else if (node.parentId && !dragTarget) {
              // If just dragging without target, maybe show potential snap back to original parent?
              // Or nothing.
              // For now, let's keep it simple: only show new connection when valid target found.
            }

            return (
              <>
                {/* Magnetic Connection Logic (Left Rope) */}
                {(() => {
                  let startX = draggingState.currentX - draggingState.offsetX;
                  let startY = draggingState.currentY - draggingState.offsetY;
                  let endX = startX;
                  let endY = startY;
                  let isVisible = false;

                  // Source point of the rope (Parent or Target)
                  if (dragTarget && dragTarget.action !== 'after' && dragTarget.action !== 'before') {
                    // Reparent target - Snap to it!
                    const t = layoutNodes.find(n => n.id === dragTarget.id);
                    if (t) {
                      startX = (t.x || 0) + (t.width || 200) / 2; // Connect to right side of parent
                      startY = (t.y || 0);
                      isVisible = true;
                    }
                  } else {
                    // Default: DISCONNECTED / LOOSE ROPE
                    // User wants it to "disconnect" and "hang loose".
                    // We will render a rope that hangs from the dragged node into the void (leftwards)
                    // acting like a "seeking" tail.

                    isVisible = true;
                    startX = (draggingState.currentX - draggingState.offsetX) - 100;
                    startY = (draggingState.currentY - draggingState.offsetY) + 50;
                    // Add sway based on time tick if we had it. For now, just static loose position is better than connecting to old parent.
                  }

                  if (!isVisible) return null;

                  // Current position of dragged node (as the end of the rope)
                  const node = layoutNodes.find(n => n.id === draggingState.nodeId);
                  const w = node?.width || 200;
                  // Connect to Left Side of Dragged Node
                  endX = draggingState.currentX - draggingState.offsetX - w / 2;
                  endY = draggingState.currentY - draggingState.offsetY;

                  const dx = endX - startX;
                  const dy = endY - startY;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  // Droop logic
                  const isMagnetic = !!dragTarget;
                  const tension = isMagnetic ? Math.min(1, Math.max(0, dist / 400)) : 0; // Loose if not magnetic
                  const droop = (1 - tension) * (isMagnetic ? 80 : 150); // More droop if loose

                  const cp1x = startX + dx * 0.5;
                  const cp1y = startY + dy * 0.1 + droop;

                  return (
                    <path
                      d={`M ${startX},${startY} Q ${cp1x},${cp1y} ${endX},${endY}`}
                      stroke={isMagnetic ? "#3b82f6" : "#cbd5e1"}
                      strokeWidth={isMagnetic ? 3 : 2}
                      strokeDasharray={isMagnetic ? "none" : "4,4"}
                      fill="none"
                      className={`pointer-events-none transition-all duration-300 ${isMagnetic ? '' : 'opacity-50'}`}
                    />
                  );
                })()}



                {/* Proxy Subtree Rendering */}
                {(() => {
                  const rootNode = layoutNodes.find(n => n.id === draggingState.nodeId);
                  if (!rootNode) return null;

                  // Calculate Delta (How much did we move from original position)
                  const deltaX = (draggingState.currentX - draggingState.offsetX) - (rootNode.x || 0);
                  const deltaY = (draggingState.currentY - draggingState.offsetY) - (rootNode.y || 0);

                  // Recursive Render
                  // We need to render the WHOLE subtree relative to this delta.
                  // For "hanging" visuals, we can add extra Y-offset per depth level?

                  const renderProxyNode = (node: MindMapNode, depth: number) => {
                    const x = (node.x || 0) + deltaX;
                    const y = (node.y || 0) + deltaY + (depth * 5); // Slight gravity droop per level
                    const w = node.width || 200;
                    const h = node.height || 60;

                    // Find children to render lines to them
                    const children = layoutNodes.filter(n => n.parentId === node.id);

                    return (
                      <React.Fragment key={node.id}>
                        {/* Node */}
                        <g transform={`translate(${x - w / 2}, ${y - h / 2})`} className="pointer-events-none z-50">
                          <rect width={w} height={h} rx={8} fill="white" stroke="#3b82f6" strokeWidth={2} className="shadow-2xl opacity-95" />
                          <foreignObject width={w} height={h} x={0} y={0}>
                            <div className="w-full h-full flex items-center justify-center p-2 text-center text-sm font-semibold text-slate-700 overflow-hidden">
                              {node.text.replace(/<[^>]*>/g, '') || 'Node'}
                            </div>
                          </foreignObject>
                        </g>

                        {/* Lines to Children */}
                        {children.map(child => {
                          const cx = (child.x || 0) + deltaX;
                          const cy = (child.y || 0) + deltaY + ((depth + 1) * 5);

                          // Loose connection to child
                          // Parent Right -> Child Left
                          const sx = x + w / 2;
                          const sy = y;
                          const ex = cx - (child.width || 200) / 2;
                          const ey = cy;

                          return (
                            <React.Fragment key={child.id}>
                              <path
                                d={`M ${sx},${sy} C ${sx + 50},${sy} ${ex - 50},${ey} ${ex},${ey}`}
                                stroke="#94a3b8"
                                strokeWidth={2}
                                fill="none"
                              />
                              {renderProxyNode(child, depth + 1)}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  };

                  return renderProxyNode(rootNode, 0);
                })()}
              </>
            );
          })()}

          {/* Visual Feedback for Drag Target */}
          {dragTarget && (
            (() => {
              const targetNode = layoutNodes.find(n => n.id === dragTarget.id);
              if (!targetNode) return null;
              const w = targetNode.width || 200;
              const h = targetNode.height || 60;
              const x = targetNode.x || 0;
              const y = targetNode.y || 0;

              if (dragTarget.action === 'reparent') {
                return (
                  <>
                    <rect
                      x={x - w / 2 - 5}
                      y={y - h / 2 - 5}
                      width={w + 10}
                      height={h + 10}
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      rx={12}
                      strokeDasharray="4,4"
                      className="animate-pulse"
                    />
                    {/* Vertical Bar Indicator on the Right */}
                    <rect
                      x={x + w / 2 + 10}
                      y={y - h / 2}
                      width={4}
                      height={h}
                      rx={2}
                      fill="#8b5cf6"
                      className="animate-pulse shadow-[0_0_10px_#8b5cf6]"
                    />
                  </>
                );
              } else if (dragTarget.action === 'before' || dragTarget.action === 'after') {
                const lineY = dragTarget.action === 'before' ? y - h / 2 - 5 : y + h / 2 + 5;
                return (
                  <line
                    x1={x - w / 2}
                    y1={lineY}
                    x2={x + w / 2}
                    y2={lineY}
                    stroke="#ec4899"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                )
              }
              return null;
            })()
          )}

          {/* Selection Box Visual */}
          {selectionBox && (
            <rect
              x={Math.min(selectionBox.startX, selectionBox.currentX)}
              y={Math.min(selectionBox.startY, selectionBox.currentY)}
              width={Math.abs(selectionBox.currentX - selectionBox.startX)}
              height={Math.abs(selectionBox.currentY - selectionBox.startY)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth={1}
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
    </div>
  );
};