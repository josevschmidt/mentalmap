import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Type } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MindMapNode, Relationship } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (nodes: MindMapNode[], relationships: Relationship[]) => void;
}

type TabType = 'file' | 'text';

function parseTextToNodes(text: string, includeNumbering: boolean): MindMapNode[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const nodes: MindMapNode[] = [];
  const numberToId: Record<string, string> = {};

  for (const line of lines) {
    const match = line.match(/^([\d]+(?:\.[\d]+)*)\s+(.+)$/);
    if (!match) continue;

    const numbering = match[1];
    const name = match[2];
    const id = uuidv4();
    numberToId[numbering] = id;

    // Determine parent by stripping last segment
    const parts = numbering.split('.');
    let parentId: string | null = null;
    if (parts.length > 1) {
      const parentNumbering = parts.slice(0, -1).join('.');
      parentId = numberToId[parentNumbering] || null;
    }

    const nodeText = includeNumbering ? `${numbering} ${name}` : name;

    nodes.push({
      id,
      parentId,
      text: nodeText,
      x: 0,
      y: 0,
    });
  }

  return nodes;
}

function parseJsonImport(json: string): { nodes: MindMapNode[]; relationships: Relationship[] } | null {
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data)) {
      return { nodes: data, relationships: [] };
    } else if (data.nodes) {
      return { nodes: data.nodes, relationships: data.relationships || [] };
    }
    return null;
  } catch {
    return null;
  }
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<TabType>('file');
  const [includeNumbering, setIncludeNumbering] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setActiveTab('file');
    setIncludeNumbering(false);
    setTextInput('');
    setSelectedFile(null);
    setError(null);
    setIsDragOver(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file: File) => {
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'json' && ext !== 'txt') {
      setError('Only .json and .txt files are supported.');
      return;
    }
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = () => {
    setError(null);

    if (activeTab === 'file') {
      if (!selectedFile) {
        setError('Please select a file first.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();

        if (ext === 'json') {
          const result = parseJsonImport(content);
          if (result) {
            onImport(result.nodes, result.relationships);
            handleClose();
          } else {
            setError('Invalid JSON format. Expected an array of nodes or { nodes, relationships }.');
          }
        } else if (ext === 'txt') {
          const nodes = parseTextToNodes(content, includeNumbering);
          if (nodes.length === 0) {
            setError('No valid lines found. Use format: "1.1 Node Name"');
            return;
          }
          onImport(nodes, []);
          handleClose();
        }
      };
      reader.onerror = () => setError('Failed to read file.');
      reader.readAsText(selectedFile);
    } else {
      // Text tab
      if (!textInput.trim()) {
        setError('Please enter some text first.');
        return;
      }

      // Try JSON first
      const jsonResult = parseJsonImport(textInput);
      if (jsonResult) {
        onImport(jsonResult.nodes, jsonResult.relationships);
        handleClose();
        return;
      }

      // Parse as numbered text
      const nodes = parseTextToNodes(textInput, includeNumbering);
      if (nodes.length === 0) {
        setError('No valid lines found. Use format: "1.1 Node Name"');
        return;
      }
      onImport(nodes, []);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="font-semibold text-lg text-slate-800">Import Mind Map</h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'file'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Upload size={16} />
            Upload File
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'text'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Type size={16} />
            Type Text
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : selectedFile
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={32} className="text-green-500" />
                    <span className="text-sm font-medium text-green-700">{selectedFile.name}</span>
                    <span className="text-xs text-slate-400">Click to change file</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={32} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      Drag & drop or <span className="text-blue-600 font-medium">browse</span>
                    </span>
                    <span className="text-xs text-slate-400">Supports .json and .txt files</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`1 Central Topic\n1.1 First Branch\n1.1.1 Sub-topic A\n1.1.2 Sub-topic B\n1.2 Second Branch\n2 Another Root\n2.1 Its child`}
                className="w-full h-40 border border-slate-200 rounded-xl p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 placeholder:text-slate-300"
              />
              <p className="text-xs text-slate-400 mt-2">
                Use numbering to define hierarchy: 1, 1.1, 1.1.1, etc.
              </p>
            </div>
          )}

          {/* Numbering toggle */}
          <div className="mt-4 flex items-center justify-between">
            <label className="text-sm text-slate-600">Include numbering in node text</label>
            <button
              onClick={() => setIncludeNumbering(!includeNumbering)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                includeNumbering ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  includeNumbering ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Import button */}
          <button
            onClick={handleImport}
            className="mt-4 w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
};
