import React from 'react';
import { Plus, Info, Download, History, Upload, BoxSelect, Eye, Palette, Grid3X3, Circle, CircleOff } from 'lucide-react';
import { ThemeType, BackgroundStyle } from '../types';

interface ToolbarProps {
  onAddChild: () => void;
  onAddRoot: () => void;
  canAdd: boolean;
  onShowHelp: () => void;
  onExport: () => void;
  onHistory: () => void;
  onImport: () => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  currentTheme: ThemeType;
  onSetTheme: (t: ThemeType) => void;
  backgroundStyle: BackgroundStyle;
  onSetBackgroundStyle: (s: BackgroundStyle) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddChild,
  onAddRoot,
  canAdd,
  onShowHelp,
  onExport,
  onHistory,
  onImport,
  isFocusMode,
  onToggleFocus,
  currentTheme,
  onSetTheme,
  backgroundStyle,
  onSetBackgroundStyle,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl px-4 py-2 flex items-center gap-2 z-50">

      <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
        <button
          onClick={onAddRoot}
          className="p-2 text-slate-700 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-colors flex items-center gap-2"
          title="Add New Floating Node"
        >
          <BoxSelect size={20} />
          <span className="text-sm font-medium hidden sm:inline">New Root</span>
        </button>

        <button
          onClick={onAddChild}
          disabled={!canAdd}
          className={`p-2 rounded-xl flex items-center gap-2 transition-colors ${canAdd
            ? 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
            : 'text-slate-300 cursor-not-allowed'
            }`}
          title="Add Child Node (Tab)"
        >
          <Plus size={20} />
          <span className="text-sm font-medium hidden sm:inline">Add Child</span>
        </button>
      </div>

      <div className="flex items-center gap-1 pr-3 border-r border-slate-200">
        <div className="group relative">
          <button className="p-2 text-slate-500 hover:bg-slate-100 hover:text-purple-600 rounded-xl transition-colors">
            <Palette size={18} />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 p-2 hidden group-hover:flex flex-col gap-2 min-w-[120px]">
            <button onClick={() => onSetTheme('modern')} className={`px-3 py-1.5 rounded text-left text-sm hover:bg-slate-50 ${currentTheme === 'modern' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600'}`}>Modern</button>
            <button onClick={() => onSetTheme('midnight')} className={`px-3 py-1.5 rounded text-left text-sm hover:bg-slate-800 hover:text-white ${currentTheme === 'midnight' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'}`}>Midnight</button>
            <button onClick={() => onSetTheme('professional')} className={`px-3 py-1.5 rounded text-left text-sm hover:bg-slate-50 ${currentTheme === 'professional' ? 'bg-slate-100 text-slate-800 font-medium' : 'text-slate-600'}`}>Professional</button>
          </div>
        </div>

        <button
          onClick={() => onSetBackgroundStyle(backgroundStyle === 'dotted' ? 'grid' : backgroundStyle === 'grid' ? 'none' : 'dotted')}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors"
          title="Background: dotted → grid → none"
        >
          {backgroundStyle === 'dotted' && <Circle size={18} />}
          {backgroundStyle === 'grid' && <Grid3X3 size={18} />}
          {backgroundStyle === 'none' && <CircleOff size={18} />}
        </button>

        <button
          onClick={onToggleFocus}
          className={`p-2 rounded-xl transition-colors ${isFocusMode
            ? 'bg-blue-100 text-blue-600 shadow-inner'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          title="Toggle Focus Mode"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onHistory}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-orange-600 rounded-xl transition-colors"
          title="Version History"
        >
          <History size={18} />
        </button>
        <button
          onClick={onImport}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-colors"
          title="Import"
        >
          <Upload size={18} />
        </button>
        <button
          onClick={onExport}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-green-600 rounded-xl transition-colors"
          title="Export Mind Map"
        >
          <Download size={18} />
        </button>
        <button
          onClick={onShowHelp}
          className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-colors"
          title="Shortcuts"
        >
          <Info size={18} />
        </button>
      </div>
    </div>
  );
};