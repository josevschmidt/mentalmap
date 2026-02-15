import React, { useState, useRef, useEffect } from 'react';
import { Cloud, LogOut, Presentation, CheckCircle2, RotateCcw, HardDrive } from 'lucide-react';

interface NavbarProps {
    user: any;
    onLogin: () => void;
    onLogout: () => void;
    onOpenDashboard: () => void;
    isPresenterMode: boolean;
    onTogglePresenter: () => void;
    saveStatus: 'saved' | 'saving' | 'error' | null;
    storageUsage: number;
}

export const Navbar: React.FC<NavbarProps> = ({
    user,
    onLogin,
    onLogout,
    onOpenDashboard,
    isPresenterMode,
    onTogglePresenter,
    saveStatus,
    storageUsage
}) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const usedKB = (storageUsage / 100 * 1024).toFixed(0);
    const totalKB = 1024;
    const freeKB = Math.max(0, totalKB - Number(usedKB));

    return (
        <nav className="fixed top-4 right-4 z-[60] flex items-center gap-3">
            {/* Save Status Indicator */}
            {!isPresenterMode && user && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                    {saveStatus === 'saving' ? (
                        <>
                            <RotateCcw size={14} className="text-blue-500 animate-spin" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Syncing...</span>
                        </>
                    ) : saveStatus === 'saved' ? (
                        <>
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cloud Saved</span>
                        </>
                    ) : saveStatus === 'error' ? (
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Sync Error</span>
                    ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Ready</span>
                    )}
                </div>
            )}

            {/* Main Navbar Actions */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl">
                {user ? (
                    <>
                        <button
                            onClick={onOpenDashboard}
                            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-2 group"
                        >
                            <Cloud size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold">My Maps</span>
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1" />

                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2 px-1 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                {user.picture ? (
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 font-bold text-xs">
                                        {user.name[0]}
                                    </div>
                                )}
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            {user.picture ? (
                                                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {user.name[0]}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-semibold text-sm text-slate-800 truncate">{user.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{user.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <HardDrive size={14} className="text-slate-500" />
                                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Storage</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    storageUsage > 90 ? 'bg-red-500' : storageUsage > 70 ? 'bg-amber-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${Math.min(storageUsage, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1.5">
                                            <span className="text-xs text-slate-500">{usedKB} KB used</span>
                                            <span className="text-xs text-slate-400">{freeKB} KB free</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            {storageUsage.toFixed(1)}% of 1 MB
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 p-2">
                                        <button
                                            onClick={() => { setIsProfileOpen(false); onLogout(); }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <button
                        onClick={onLogin}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 hover:scale-[1.02] active:scale-95 animate-in fade-in zoom-in duration-500"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>
                )}

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <button
                    onClick={onTogglePresenter}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${isPresenterMode
                            ? 'bg-purple-100 text-purple-600 shadow-inner'
                            : 'text-slate-500 hover:text-purple-600 hover:bg-slate-50'
                        }`}
                    title={isPresenterMode ? "Exit Presenter Mode" : "Enter Presenter Mode"}
                >
                    <Presentation size={20} className={isPresenterMode ? "animate-pulse" : ""} />
                </button>
            </div>
        </nav>
    );
};
