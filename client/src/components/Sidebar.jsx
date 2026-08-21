import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutGrid,
    TestTube,
    Archive,
    ClipboardList,
    Activity,
    Settings,
    Search,
    Dna,
    FlaskConical,
    Menu,
    X,
    Server,
    LogOut,
    Plus,
    Bug,
    Disc,
    FileCode,
    AlignLeft,
    FileText,
    Sun,
    Moon,
    ChevronDown,
    ChevronRight,
    Beaker,
    QrCode,
    Scan,
    Zap,
    Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Approved Bacteriophage LIMS Logo Component
const LimsLogo = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10L65 20L65 40L50 50L35 40L35 20L50 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M50 10L50 50" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M65 20L35 40M35 20L65 40" stroke="currentColor" strokeWidth="1" />
        <path d="M50 50C50 50 45 65 40 70C35 75 25 80 25 80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 50C50 50 55 65 60 70C65 75 75 80 75 80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 50V75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        <path d="M40 55L60 55M42 62L58 62M45 69L55 69" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
);

const ThemeToggle = ({ isOpen }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group w-full
                ${theme === 'dark'
                    ? 'text-yellow-400 hover:bg-yellow-400/10'
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}
            `}
        >
            <div className="relative">
                {theme === 'dark' ? (
                    <Sun className={`w-5 h-5 transition-all duration-300 ${isOpen ? '' : 'mx-auto'}`} />
                ) : (
                    <Moon className={`w-5 h-5 transition-all duration-300 ${isOpen ? '' : 'mx-auto'}`} />
                )}
            </div>
            {isOpen && (
                <span className="font-medium text-sm tracking-wide">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
            )}
        </button>
    );
};

const Sidebar = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(true);
    const [isExtendedOpen, setIsExtendedOpen] = useState(true);
    const [navSearch, setNavSearch] = useState(''); // NEW: sidebar search state
    const [branding, setBranding] = useState({
        orgName: 'GLOBAL ACCESS',
        accentColor: '#10b981',
        logoType: 'icon',
        logoUrl: ''
    });

    useEffect(() => {
        const saved = localStorage.getItem('lims_branding');
        if (saved) setBranding(JSON.parse(saved));
    }, []);

    const [dynamicModules, setDynamicModules] = useState([]);

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const { default: api } = await import('../api/axios');
                const res = await api.get('/system/tables');
                setDynamicModules(res.data || []);
            } catch (err) {
                console.error("Failed to load modules", err);
            }
        };
        fetchModules();
    }, []);

    const menuGroups = [
        {
            title: "CORE ASSETS",
            items: [
                { path: "/dashboard", label: "Dashboard", icon: LayoutGrid },
                { path: "/add-data", label: "Data Entry", icon: ClipboardList },
                { path: "/bulk-import", label: "Bulk CSV Import", icon: FileText },
                { path: "/features", label: "Features Overview", icon: LayoutGrid },
                { path: "/query-hub", label: "Query Intelligence Hub", icon: Search },
                { path: "/lab-management", label: "Lab Management", icon: ClipboardList },
            ]
        },
        {
            title: "LAB OPS (CORE)",
            items: [
                { path: "/phage-entry", label: "Bacteriophages", icon: Bug },
                { path: "/strain-entry", label: "Bacterial Strains", icon: Disc },
                { path: "/host-bacteria-entry", label: "Host Bacteria", icon: Dna },
                { path: "/plasmid-entry", label: "Plasmids", icon: Zap },
                { path: "/primer-entry", label: "Primers", icon: Activity },
                { path: "/box-matrix", label: "Freezer Boxes", icon: Archive },
                { path: "/lab-stock-entry", label: "Lab Stock (Inventory)", icon: Package },
                { path: "/antibiotics-discs-entry", label: "Antibiotics Discs", icon: Disc },
                { path: "/experiment-templates", label: "Experiment Templates", icon: FileText },
                { path: "/success-analytics", label: "Success Analytics", icon: LayoutGrid },
                { path: "/audit-trail", label: "Audit Trail", icon: Archive },
            ]
        },
        {
            title: "Scientific Data Explorer",
            items: [
                ...(dynamicModules?.map(m => ({
                    path: m.path,
                    label: m.name,
                    icon: FlaskConical
                })) || []),
                { path: "/matrix", label: "Phage-Host Matrix", icon: TestTube }
            ]
        },
        {
            title: "QR TRACKING",
            items: [
                { path: "/qr-generator", label: "QR Generator", icon: QrCode },
                { path: "/qr-reader", label: "QR Reader", icon: Scan },
            ]
        },
        {
            title: "EXPERT TOOLS",
            items: [
                { path: "/treatment", label: "Therapy Designer", icon: FlaskConical },
                { path: "/analytics", label: "Analytics", icon: Activity },
                { path: "/equipment", label: "Equipment Tracker", icon: Settings },
                { path: "/admin", label: "Admin Panel", icon: Settings },
            ]
        }
    ];

    // Filter Menu Groups based on User Permissions
    const filterMenuItems = (groups) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isSuperAdmin = user.username === 'admin' || user.role === 'SuperAdmin';
        const perms = user.permissions || {};

        if (isSuperAdmin) return groups;

        return groups.map(group => ({
            ...group,
            items: group.items.filter(item => {
                const pathMap = {
                    '/library': 'library',
                    '/add-data': 'entry',
                    '/inventory-hub': 'inventory',
                    '/chemical-inventory': 'inventory',
                    '/storage': 'storage',
                    '/qr-generator': 'qr_gen',
                    '/qr-reader': 'qr_read',
                    '/audit-trail': 'audit',
                    '/admin': 'admin'
                };

                const permKey = pathMap[item.path];
                if (!permKey) return true;

                return perms[permKey] && perms[permKey] !== 'none';
            })
        })).filter(group => group.items.length > 0);
    };

    const filteredMenuGroups = filterMenuItems(menuGroups);

    // NEW: Apply nav search filter — filter items across all groups by label
    const searchedGroups = useMemo(() => {
        if (!navSearch.trim()) return filteredMenuGroups;
        const term = navSearch.toLowerCase();
        return filteredMenuGroups
            .map(group => ({
                ...group,
                items: group.items.filter(item =>
                    item.label.toLowerCase().includes(term)
                )
            }))
            .filter(group => group.items.length > 0);
    }, [navSearch, filteredMenuGroups, dynamicModules]);

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`
                h-screen bg-slate-900/90 backdrop-blur-[20px] 
                border-r border-white/10 text-white 
                transition-all duration-300 ease-in-out
                flex flex-col z-50 fixed left-0 top-0 shadow-2xl shadow-black/50
                ${isOpen ? 'w-72' : 'w-20'}
            `}
        >
            {/* Header / Brand */}
            <div className="h-20 flex items-center justify-center border-b border-white/10 relative overflow-hidden group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {isOpen ? (
                    <div className="flex items-center gap-3 z-10 transition-all duration-500">
                        {branding.logoType === 'image' && branding.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-all duration-500">
                                <LimsLogo className="w-8 h-8 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="font-bold text-lg tracking-tight text-white leading-none">
                                LIMS <span className="text-emerald-400">PRO</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{branding.orgName || 'SYSTEM NODE'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-all duration-500 z-10">
                        <LimsLogo className="w-8 h-8 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    </div>
                )}
            </div>

            {/* NEW: Sticky Search Bar — only visible when sidebar is expanded */}
            {isOpen && (
                <div className="px-3 pt-3 pb-2 border-b border-white/5 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search menu..."
                            value={navSearch}
                            onChange={e => setNavSearch(e.target.value)}
                            className="w-full pl-8 pr-8 py-2 bg-slate-950/60 border border-white/8 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-950 transition-all"
                        />
                        {navSearch && (
                            <button
                                onClick={() => setNavSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    {navSearch && (
                        <p className="text-[10px] text-slate-600 mt-1.5 pl-1">
                            {searchedGroups.reduce((acc, g) => acc + g.items.length, 0)} result(s)
                        </p>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto pt-4 pb-12 space-y-5 custom-scrollbar">
                {searchedGroups.map((group, idx) => {
                    const isExtendedGroup = group.title === "Scientific Data Explorer";
                    if (isExtendedGroup && !dynamicModules.length && !navSearch) return null;

                    return (
                        <div key={idx} className="px-3">
                            {isOpen && (
                                <div
                                    className={`flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-3 ${isExtendedGroup ? 'cursor-pointer hover:text-emerald-400 transition-colors' : ''}`}
                                    onClick={() => isExtendedGroup && setIsExtendedOpen(!isExtendedOpen)}
                                >
                                    <span>{group.title}</span>
                                    {isExtendedGroup && (
                                        isExtendedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                    )}
                                </div>
                            )}

                            {(!isExtendedGroup || isExtendedOpen || navSearch) && (
                                <div className="space-y-0.5">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                                                ${isActive
                                                    ? 'bg-[var(--accent-dim)] text-[var(--accent-primary)] shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-[var(--accent-primary)]/20'
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'}
                                            `}
                                        >
                                            <div className="relative shrink-0">
                                                <item.icon className={`w-4 h-4 transition-all duration-300 ${isOpen ? '' : 'mx-auto'} ${location.pathname === item.path ? 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`} />
                                            </div>

                                            {isOpen && (
                                                <span className="font-medium text-sm tracking-wide whitespace-normal py-0.5 leading-snug">
                                                    {item.label}
                                                </span>
                                            )}

                                            {/* Active Indicator Line */}
                                            {location.pathname === item.path && (
                                                <motion.div
                                                    layoutId="activeNav"
                                                    className="absolute left-0 w-1 h-6 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                                                />
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* No search results message */}
                {navSearch && searchedGroups.length === 0 && (
                    <div className="px-6 py-8 text-center">
                        <Search className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-xs text-slate-600 italic">No menu items match "{navSearch}"</p>
                    </div>
                )}
            </div>

            {/* System Health & Theme */}
            <div className="border-t border-white/10 p-4 bg-black/20 shrink-0">
                <div className="flex gap-2 mb-4">
                    <ThemeToggle isOpen={isOpen} />
                </div>

                <button
                    onClick={() => {
                        if (window.confirm('Are you sure you want to logout?')) {
                            localStorage.removeItem('token');
                            window.location.href = '/';
                        }
                    }}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group mb-4
                        text-rose-400 hover:text-white hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]
                    `}
                >
                    <div className="relative">
                        <LogOut className={`w-5 h-5 transition-all duration-300 ${isOpen ? '' : 'mx-auto'}`} />
                    </div>
                    {isOpen && <span className="font-bold text-sm tracking-wide">Logout</span>}
                </button>

                <div className="flex items-center justify-between mb-2">
                    {isOpen && <span className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> System Online</span>}
                    <span className="text-[10px] font-mono text-slate-500">v24.2.1</span>
                </div>
                {isOpen && (
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden relative">
                        <div className="absolute inset-0 bg-emerald-500/50 w-full animate-progress-indeterminate" />
                    </div>
                )}
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-24 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-slate-900 hover:scale-110 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            >
                {isOpen ? <X size={12} strokeWidth={4} /> : <Menu size={12} strokeWidth={4} />}
            </button>
        </motion.div>
    );
};

export default Sidebar;
