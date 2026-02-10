import React, { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MindMapNode, HistoryEntry, Relationship, ThemeType, BackgroundStyle } from './types';
import { INITIAL_NODES, ROOT_NODE_ID, COLORS } from './constants';
import { MindMapCanvas } from './components/MindMapCanvas';
import { Toolbar } from './components/Toolbar';
import { Navbar } from './components/Navbar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ExportModal } from './components/ExportModal';
import { SearchModal } from './components/SearchModal';
import { NotesPanel } from './components/NotesPanel';
import { ShortcutHints } from './components/ShortcutHints';
import { MapsDashboard } from './components/MapsDashboard';
import { AuthProvider, useAuth } from './services/auth';
import { loadMap, saveMap, getStorageUsage, listMaps, MindMap } from './services/storage';

function AppContent() {
  const [nodes, setNodes] = useState<MindMapNode[]>(INITIAL_NODES);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const { user, signInWithGoogle, logout } = useAuth();

  // Map Management State
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [currentMapName, setCurrentMapName] = useState<string>('Untitled Map');
  const [isMapsDashboardOpen, setIsMapsDashboardOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

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

  // --- Storage Persistence ---

  // Load latest map from cloud when user logs in (if none active)
  useEffect(() => {
    const fetchLatest = async () => {
      if (user && !currentMapId) {
        try {
          const maps = await listMaps(user.id);
          if (maps.length > 0) {
            handleSelectMap(maps[0]);
          }
        } catch (e) {
          console.error('Initial fetch failed', e);
        }
      } else if (!user) {
        // Reset when logging out
        setCurrentMapId(null);
        setCurrentMapName('Untitled Map');
        setNodes(INITIAL_NODES);
        setRelationships([]);
        setStorageUsage(0);
        setSaveStatus(null);
      }
    };
    fetchLatest();
  }, [user]);

  // Auto-save to cloud
  useEffect(() => {
    const persistData = async () => {
      if (user) {
        // If we have nodes beyond initial, or we already have a mapId
        const isDirty = nodes.length > INITIAL_NODES.length || relationships.length > 0 || currentMapId;

        if (isDirty) {
          setSaveStatus('saving');
          const result = await saveMap(user.id, nodes, relationships, currentMapId || undefined, currentMapName);
          if (result.success) {
            setStorageUsage(result.usage || 0);
            setSaveStatus('saved');
            if (result.mapId && !currentMapId) {
              setCurrentMapId(result.mapId);
            }
          } else if (result.message) {
            setSaveStatus('error');
            setErrorMsg(result.message);
            setTimeout(() => setErrorMsg(null), 5000);
          }
        }
      }
    };

    // Set a small delay for auto-save to debounces changes
    const timeout = setTimeout(persistData, 1000);
    return () => clearTimeout(timeout);
  }, [nodes, relationships, user, currentMapId, currentMapName]);

  const handleSelectMap = (map: MindMap) => {
    setCurrentMapId(map.id);
    setCurrentMapName(map.name);
    setNodes(map.data.nodes);
    setRelationships(map.data.relationships);
    getStorageUsage(map.user_id).then(setStorageUsage);
    setCenterOnNodeId(ROOT_NODE_ID);
    setSaveStatus('saved');
  };

  const handleCreateNewMap = () => {
    setCurrentMapId(null);
    setCurrentMapName('New Concept Map');
    setNodes(INITIAL_NODES);
    setRelationships([]);
    setStorageUsage(0);
    setCenterOnNodeId(ROOT_NODE_ID);
    setSaveStatus(null);
  };

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

  const moveNode = useCallback((nodeId: string, newParentId: string | null, siblingId: string | null) => {
    setNodes(prev => {
      const nodeIndex = prev.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return prev;

      if (newParentId) {
        let current = newParentId;
        while (current) {
          if (current === nodeId) {
            setErrorMsg("Cannot move node into its own descendant");
            setTimeout(() => setErrorMsg(null), 3000);
            return prev;
          }
          const parent = prev.find(n => n.id === current);
          current = parent?.parentId || '';
        }
      }

      const node = { ...prev[nodeIndex], parentId: newParentId };
      const newNodes = [...prev];
      newNodes.splice(nodeIndex, 1);

      if (siblingId) {
        const siblingIndex = newNodes.findIndex(n => n.id === siblingId);
        if (siblingIndex !== -1) {
          newNodes.splice(siblingIndex, 0, node);
        } else {
          newNodes.push(node);
        }
      } else {
        newNodes.push(node);
      }

      addToHistory(newNodes, 'Moved Node');
      return newNodes;
    });
  }, [addToHistory]);

  const handleNodeConnection = (sourceId: string, targetId: string) => {
    if (!sourceId) {
      setConnectingNodeId(null);
      return;
    }
    if (!targetId) {
      setConnectingNodeId(sourceId);
      return;
    }
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
  };

  // --- Keyboard Shortcuts ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const isShortcutKey = e.key === 'Tab' || e.key === 'Enter';

      if (isInput || (target.isContentEditable && !isShortcutKey)) return;

      const currentSelectedIds = selectedIds;
      const currentNodes = nodes;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          if (currentSelectedIds.length === 1) {
            const node = currentNodes.find(n => n.id === currentSelectedIds[0]);
            if (node && node.parentId) {
              handleSelectNodes([node.parentId]);
            }
          }
        } else {
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

      {/* Top left: Brand */}
      <div className="absolute top-4 left-4 z-50 flex flex-col">
        <button
          type="button"
          onClick={() => setCenterOnNodeId(ROOT_NODE_ID)}
          className="text-2xl font-black text-slate-900 drop-shadow-sm hover:text-blue-600 transition-colors"
          title="Center on main root"
        >
          mentalmap
        </button>
        <span className="text-[10px] uppercase tracking-widest font-black text-blue-600 opacity-60">
          {currentMapName}
        </span>
      </div>

      {/* Top Right: Navbar */}
      <Navbar
        user={user}
        onLogin={signInWithGoogle}
        onLogout={logout}
        onOpenDashboard={() => setIsMapsDashboardOpen(true)}
        isPresenterMode={isPresenterMode}
        onTogglePresenter={() => {
          setIsPresenterMode(!isPresenterMode);
          if (!isPresenterMode) setActiveNoteNodeId(null);
        }}
        saveStatus={saveStatus}
        storageUsage={storageUsage}
      />

      {errorMsg && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-xl z-[60] animate-in slide-in-from-top-4 fade-in duration-300">
          {errorMsg}
        </div>
      )}

      {/* Bottom right Credits */}
      {!isPresenterMode && (
        <a
          href="https://github.com/josevschmidt"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 z-50 text-[10px] font-bold tracking-tighter text-slate-400 hover:text-slate-600 transition-colors bg-white/50 px-2 py-1 rounded-full backdrop-blur-sm"
        >
          MADE BY @JOSEVSCHMIDT
        </a>
      )}

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

      {/* Bottom Toolbar */}
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

          {user && (
            <MapsDashboard
              userId={user.id}
              isOpen={isMapsDashboardOpen}
              onClose={() => setIsMapsDashboardOpen(false)}
              onLoadMap={handleSelectMap}
              onCreateNew={handleCreateNewMap}
              currentMapId={currentMapId}
            />
          )}
        </>
      )}

      <ShortcutsModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} onRestore={restoreHistory} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} nodes={nodes} canvasId="mindmap-canvas-container" />

    </div>
  );
}

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;