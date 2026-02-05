import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Presentation, X } from 'lucide-react';
import { MindMapNode, HistoryEntry, Relationship, ThemeType, BackgroundStyle } from './types';
import { INITIAL_NODES, ROOT_NODE_ID, COLORS } from './constants';
import { MindMapCanvas } from './components/MindMapCanvas';
import { Toolbar } from './components/Toolbar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ExportModal } from './components/ExportModal';
import { SearchModal } from './components/SearchModal';
import { NotesPanel } from './components/NotesPanel';
import { ShortcutHints } from './components/ShortcutHints';


function App() {
  const [nodes, setNodes] = useState<MindMapNode[]>(INITIAL_NODES);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastCreatedNodeId, setLastCreatedNodeId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeType>('modern');
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>('dotted');

  // Linking State
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  // Hidden inputs
  const importInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingNodeId, setUploadingNodeId] = useState<string | null>(null);

  // UI State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeNoteNodeId, setActiveNoteNodeId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [centerOnNodeId, setCenterOnNodeId] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // --- History Helper ---

  const addToHistory = useCallback((newNodes: MindMapNode[], action: string, newRelationships?: Relationship[]) => {
    const entry: HistoryEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      action,
      nodes: newNodes,
      relationships: newRelationships || relationships
    };
    setHistory(prev => {
      const newHistory = [...prev, entry];
      if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
      return newHistory;
    });
  }, [relationships]);

  const restoreHistory = useCallback((entry: HistoryEntry) => {
    setNodes(entry.nodes);
    if (entry.relationships) setRelationships(entry.relationships);
    setSelectedIds([]);
  }, []);

  // --- Event Listeners for Custom Events (Note Opening) ---
  useEffect(() => {
    const handleOpenNote = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.nodeId) {
        setActiveNoteNodeId(detail.nodeId);
      }
    };
    window.addEventListener('open-note', handleOpenNote);
    return () => window.removeEventListener('open-note', handleOpenNote);
  }, []);

  // --- File Operations ---

  const handleImportClick = () => {
    if (importInputRef.current) {
      importInputRef.current.value = '';
      importInputRef.current.click();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const importedData = JSON.parse(json);
        // Handle legacy format (array only) or new format with relationships
        if (Array.isArray(importedData)) {
          setNodes(importedData);
          setRelationships([]);
          addToHistory(importedData, 'Imported JSON', []);
        } else if (importedData.nodes) {
          setNodes(importedData.nodes);
          setRelationships(importedData.relationships || []);
          addToHistory(importedData.nodes, 'Imported JSON', importedData.relationships || []);
        } else {
          setErrorMsg("Invalid JSON file format");
        }
        setSelectedIds([]);
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleAddImageRequest = (nodeId: string) => {
    setUploadingNodeId(nodeId);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    }
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingNodeId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNodes(prev => {
        const newNodes = prev.map(n => n.id === uploadingNodeId ? { ...n, image: base64 } : n);
        addToHistory(newNodes, 'Added Image');
        return newNodes;
      });
      setUploadingNodeId(null);
    };
    reader.readAsDataURL(file);
  };

  // --- Actions ---

  const handleSelectNodes = useCallback((ids: string[]) => {
    setSelectedIds(ids);
    // Use functional update to ensure we don't use a stale lastCreatedNodeId
    // If the selection moved AWAY from the new node, clear the flag
    setLastCreatedNodeId(prev => (prev && !ids.includes(prev)) ? null : prev);
  }, []);

  const addNode = useCallback((parentId: string, text: string = 'New Node') => {
    const newId = uuidv4();
    setNodes(prev => {
      const parentNode = prev.find(n => n.id === parentId);
      const parentIndex = prev.findIndex(n => n.id === parentId);

      let updatedNodes = [...prev];
      if (parentIndex !== -1 && prev[parentIndex].collapsed) {
        updatedNodes[parentIndex] = { ...prev[parentIndex], collapsed: false };
      }

      let newColor = undefined;
      if (parentNode) {
        if (!parentNode.parentId) {
          const siblings = prev.filter(n => n.parentId === parentId);
          newColor = COLORS[siblings.length % COLORS.length];
        } else {
          if (parentNode.color) newColor = parentNode.color;
        }
      }

      const newNode: MindMapNode = {
        id: newId,
        parentId,
        text,
        x: (parentNode?.x || 0) + 200,
        y: parentNode?.y || 0,
        color: newColor,
        fillStyle: parentNode?.fillStyle
      };

      updatedNodes.push(newNode);
      addToHistory(updatedNodes, 'Added Node');
      return updatedNodes;
    });
    setLastCreatedNodeId(newId);
    handleSelectNodes([newId]);
  }, [addToHistory, handleSelectNodes]);

  const addRootNode = useCallback(() => {
    const newId = uuidv4();
    const newRoot: MindMapNode = {
      id: newId,
      parentId: null,
      text: 'New Concept',
      x: 100,
      y: 100,
      fontSize: 'large'
    };
    setNodes(prev => {
      const newNodes = [...prev, newRoot];
      addToHistory(newNodes, 'Added Root');
      return newNodes;
    });
    setLastCreatedNodeId(newId);
    handleSelectNodes([newId]);
  }, [addToHistory, handleSelectNodes]);

  const updateNodeText = useCallback((id: string, newText: string) => {
    setNodes(prev => {
      const node = prev.find(n => n.id === id);
      if (node && node.text === newText) return prev;
      const newNodes = prev.map(n => n.id === id ? { ...n, text: newText } : n);
      addToHistory(newNodes, 'Updated Text');
      return newNodes;
    });
    if (lastCreatedNodeId === id) setLastCreatedNodeId(null);
  }, [addToHistory, lastCreatedNodeId]);

  const updateNodeStyle = useCallback((id: string, stylePatch: Partial<MindMapNode>) => {
    setNodes(prev => {
      const newNodes = prev.map(n => n.id === id ? { ...n, ...stylePatch } : n);
      return newNodes;
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    if (id === ROOT_NODE_ID) {
      setErrorMsg("Cannot delete the main root node.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setNodes(prev => {
      const nodesToDelete = new Set<string>();
      const collect = (nodeId: string) => {
        nodesToDelete.add(nodeId);
        prev.filter(n => n.parentId === nodeId).forEach(c => collect(c.id));
      };
      collect(id);

      const newNodes = prev.filter(n => !nodesToDelete.has(n.id));

      // Also cleanup relationships
      setRelationships(rels => rels.filter(r => !nodesToDelete.has(r.sourceId) && !nodesToDelete.has(r.targetId)));

      addToHistory(newNodes, 'Deleted Node');
      return newNodes;
    });
    handleSelectNodes([]);
  }, [addToHistory, handleSelectNodes]);

  const toggleCollapse = useCallback((id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, collapsed: !n.collapsed } : n));
  }, []);

  const moveNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  }, []);

  /* Old reparentNode and reorderNode removed */

  const moveNode = useCallback((nodeId: string, newParentId: string | null, siblingId: string | null) => {
    setNodes(prev => {
      const nodeIndex = prev.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return prev;

      // Circular Check
      if (newParentId) {
        let current = newParentId;
        while (current) {
          if (current === nodeId) {
            setErrorMsg("Cannot move node into its own descendant");
            setTimeout(() => setErrorMsg(null), 3000);
            return prev;
          }
          const parent = prev.find(n => n.id === current);
          current = parent?.parentId || ''; // stop if root (null/undefined)
        }
      }

      const node = { ...prev[nodeIndex], parentId: newParentId };
      const newNodes = [...prev];

      // Remove from old position
      newNodes.splice(nodeIndex, 1);

      // Insert at new position
      if (siblingId) {
        const siblingIndex = newNodes.findIndex(n => n.id === siblingId);
        if (siblingIndex !== -1) {
          newNodes.splice(siblingIndex, 0, node);
        } else {
          newNodes.push(node);
        }
      } else {
        // Append to end (last sibling)
        newNodes.push(node);
      }

      addToHistory(newNodes, 'Moved Node');
      return newNodes;
    });
  }, [addToHistory]);


  // --- Relationship Handling ---

  const handleNodeConnection = (sourceId: string, targetId: string) => {
    if (!sourceId) {
      setConnectingNodeId(null);
      return;
    }
    if (!targetId) {
      setConnectingNodeId(sourceId);
      return;
    }
    // Create connection
    const newRel: Relationship = {
      id: uuidv4(),
      sourceId,
      targetId
    };
    setRelationships(prev => [...prev, newRel]);
    setConnectingNodeId(null);
  };

  const handleSearchSelect = (id: string) => {
    handleSelectNodes([id]);
    // The Canvas component has an effect that zooms to selected ID automatically.
  };

  // --- Keyboard Shortcuts ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Allow Tab and Enter to pass through if it's contentEditable (our mind nodes)
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isShortcutKey = e.key === 'Tab' || e.key === 'Enter';

      if (isInput || (target.isContentEditable && !isShortcutKey)) return;

      const currentSelectedIds = selectedIds;
      const currentNodes = nodes;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          // Navigate Back (Select Parent)
          if (currentSelectedIds.length === 1) {
            const node = currentNodes.find(n => n.id === currentSelectedIds[0]);
            if (node && node.parentId) {
              handleSelectNodes([node.parentId]);
            }
          }
        } else {
          // Add Child
          if (currentSelectedIds.length === 1) addNode(currentSelectedIds[0]);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentSelectedIds.length === 1) {
          const selectedNode = currentNodes.find(n => n.id === currentSelectedIds[0]);
          if (selectedNode) {
            if (selectedNode.parentId) {
              addNode(selectedNode.parentId);
            } else {
              window.dispatchEvent(new CustomEvent('start-editing', { detail: { nodeId: selectedNode.id } }));
            }
          }
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (currentSelectedIds.length === 1) {
          window.dispatchEvent(new CustomEvent('start-editing', { detail: { nodeId: currentSelectedIds[0] } }));
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentSelectedIds.length > 0) currentSelectedIds.forEach(id => deleteNode(id));
      } else if (e.key === ' ' && currentSelectedIds.length === 1) {
        e.preventDefault();
        toggleCollapse(currentSelectedIds[0]);
      } else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        // Basic undo support via history panel mostly
      } else if (e.key.toLowerCase() === 'f') {
        setIsFocusMode(prev => !prev);
      } else if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addNode, deleteNode, toggleCollapse, selectedIds, nodes]);

  return (
    <div className={`w-screen h-screen overflow-hidden font-sans relative ${theme === 'midnight' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      <input type="file" ref={importInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageFile} accept="image/*" className="hidden" />

      {/* Top left: mentalmap (center on root) */}
      <button
        type="button"
        onClick={() => setCenterOnNodeId(ROOT_NODE_ID)}
        className="absolute top-4 left-4 z-50 text-2xl font-bold text-slate-500 hover:text-slate-800 transition-colors"
        title="Center on main root"
      >
        mentalmap
      </button>
      <button
        onClick={() => {
          setIsPresenterMode(!isPresenterMode);
          if (!isPresenterMode) setActiveNoteNodeId(null); // Close notes
        }}
        className={`absolute top-4 right-4 z-50 p-2.5 rounded-xl border transition-all duration-300 ease-in-out ${isPresenterMode
          ? 'bg-white border-purple-500 text-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.5)] ring-2 ring-purple-100 scale-105'
          : 'bg-white border-slate-200 text-slate-500 hover:text-purple-600 hover:border-purple-200 shadow-sm hover:shadow-md'
          }`}
        title={isPresenterMode ? "Exit Presenter Mode" : "Enter Presenter Mode"}
      >
        <Presentation size={20} className={isPresenterMode ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" : ""} />
      </button>

      {errorMsg && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl z-[60] animate-in slide-in-from-top-4 fade-in duration-300">
          {errorMsg}
        </div>
      )}

      {/* Bottom right: made by (hidden in presenter mode) */}
      {!isPresenterMode && (
        <a
          href="https://instagram.com/josevschmidt"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 z-50 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          title="Instagram"
        >
          made by @josevschmidt
        </a>
      )}

      {/* Instructions Overlay */}
      {!isPresenterMode && <ShortcutHints />}

      <MindMapCanvas
        nodes={nodes}
        relationships={relationships}
        selectedIds={selectedIds}
        onSelectNodes={handleSelectNodes}
        onUpdateNodeText={updateNodeText}
        onUpdateNodeStyle={updateNodeStyle}
        onAddChild={addNode}
        onDeleteNode={deleteNode}
        onToggleCollapse={toggleCollapse}
        onAddImage={handleAddImageRequest}
        onMoveNode={moveNodePosition}
        onMoveNodeTo={moveNode}
        lastCreatedNodeId={lastCreatedNodeId}
        isFocusMode={isFocusMode}
        isPresenterMode={isPresenterMode}
        theme={theme}
        backgroundStyle={backgroundStyle}
        connectingNodeId={connectingNodeId}
        onNodeConnection={handleNodeConnection}
        centerOnNodeId={centerOnNodeId}
        onCenterComplete={() => setCenterOnNodeId(null)}
      />

      {/* Overlays (Hidden in Presenter Mode) */}
      {!isPresenterMode && (
        <>
          <Toolbar
            onAddChild={() => selectedIds.length === 1 && addNode(selectedIds[0])}
            onAddRoot={addRootNode}
            canAdd={selectedIds.length === 1}
            onShowHelp={() => setIsHelpOpen(true)}
            onExport={() => setIsExportOpen(true)}
            onHistory={() => setIsHistoryOpen(true)}
            onImport={handleImportClick}
            isFocusMode={isFocusMode}
            onToggleFocus={() => setIsFocusMode(!isFocusMode)}
            currentTheme={theme}
            onSetTheme={setTheme}
            backgroundStyle={backgroundStyle}
            onSetBackgroundStyle={setBackgroundStyle}
          />

          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            nodes={nodes}
            onSelectNode={handleSearchSelect}
          />

          <NotesPanel
            nodeId={activeNoteNodeId}
            nodes={nodes}
            isOpen={!!activeNoteNodeId}
            onClose={() => setActiveNoteNodeId(null)}
            onUpdateNote={(id, note) => {
              setNodes(prev => prev.map(n => n.id === id ? { ...n, note } : n));
            }}
            theme={theme}
          />
        </>
      )}

      <ShortcutsModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onRestore={restoreHistory} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} nodes={nodes} canvasId="mindmap-canvas-container" />

    </div>
  );
}

export default App;