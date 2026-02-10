import React, { useEffect, useState } from 'react';
import { Cloud, Plus, Trash2, FileText, X, ChevronRight, Edit2, Check } from 'lucide-react';
import { listMaps, deleteMap, updateMapName, MindMap } from '../services/storage';

interface MapsDashboardProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onLoadMap: (map: MindMap) => void;
    onCreateNew: () => void;
    currentMapId: string | null;
}

export const MapsDashboard: React.FC<MapsDashboardProps> = ({
    userId,
    isOpen,
    onClose,
    onLoadMap,
    onCreateNew,
    currentMapId
}) => {
    const [maps, setMaps] = useState<MindMap[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const fetchMaps = async () => {
        setLoading(true);
        const data = await listMaps(userId);
        setMaps(data);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchMaps();
        }
    }, [isOpen, userId]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this map? This action cannot be undone.')) {
            const success = await deleteMap(id);
            if (success) {
                setMaps(prev => prev.filter(m => m.id !== id));
            }
        }
    };

    const startEditing = (e: React.MouseEvent, map: MindMap) => {
        e.stopPropagation();
        setEditingId(map.id);
        setEditName(map.name);
    };

    const handleRename = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!editName.trim()) return;
        const success = await updateMapName(id, editName.trim());
        if (success) {
            setMaps(prev => prev.map(m => m.id === id ? { ...m, name: editName.trim() } : m));
            setEditingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Cloud size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">My Cloud Maps</h2>
                            <p className="text-sm text-slate-500">Manage your brainstorms in the cloud</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Action Bar */}
                <div className="px-6 py-4 bg-white border-b border-slate-50 flex justify-between items-center">
                    <button
                        onClick={() => { onCreateNew(); onClose(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                    >
                        <Plus size={18} />
                        Create New Map
                    </button>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                        {maps.length} Map{maps.length !== 1 ? 's' : ''} Saved
                    </span>
                </div>

                {/* Maps List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <span className="text-sm font-medium">Fetching your workspace...</span>
                        </div>
                    ) : maps.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400 text-center px-10">
                            <FileText size={48} strokeWidth={1} />
                            <div>
                                <p className="font-bold text-slate-600">Your cloud is empty</p>
                                <p className="text-sm">Create your first mind map to start syncing!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {maps.map((map) => (
                                <div
                                    key={map.id}
                                    onClick={() => { onLoadMap(map); onClose(); }}
                                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${currentMapId === map.id
                                            ? 'border-blue-200 bg-blue-50/30'
                                            : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${currentMapId === map.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white'
                                            }`}>
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {editingId === map.id ? (
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        autoFocus
                                                        className="bg-white border-2 border-blue-600 rounded-lg px-2 py-1 text-sm font-bold text-slate-900 w-full focus:outline-none"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleRename(e as any, map.id);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                    />
                                                    <button onClick={e => handleRename(e, map.id)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                                        <Check size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-bold text-slate-900 truncate flex items-center gap-2">
                                                        {map.name}
                                                        {currentMapId === map.id && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Current</span>}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">
                                                        Last modified {new Date(map.updated_at).toLocaleDateString()} at {new Date(map.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => startEditing(e, map)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                                            title="Rename"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, map.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="px-2 text-slate-300">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 font-medium">
                        CLOUD STORAGE IS AUTOMATICALLY ENCRYPTED
                    </p>
                    <div className="flex items-center gap-1 text-blue-600">
                        <Cloud size={14} />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Supabase Sync Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
