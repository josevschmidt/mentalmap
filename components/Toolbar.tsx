import React from 'react';
import { Plus, Info, Download, History, Upload, BoxSelect, Eye, Palette, Grid3X3, Circle, CircleOff, LogOut, Cloud } from 'lucide-react';
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
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  storageUsage: number;
  onOpenDashboard: () => void;
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
  user,
  onLogin,
  onLogout,
  storageUsage,
  onOpenDashboard
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
          title="Import JSON"
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

      {/* SSO & Map Management Section */}
      <div className="flex items-center gap-2 pl-1">
        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDashboard}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2 group"
              title="My Cloud Maps"
            >
              <Cloud size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold hidden md:inline">My Maps</span>
            </button>

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <div className="relative group/user">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-200 shadow-sm cursor-help"
                  title={`${user.name} (${(storageUsage).toFixed(1)}% used)`}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200" title={user.name}>
                  {user.name[0]}
                </div>
              )}
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/user:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                Cloud Sync Active
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 hover:scale-105 active:scale-95 animate-in fade-in zoom-in duration-500"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        )}
      </div>

    </div>
  );
};