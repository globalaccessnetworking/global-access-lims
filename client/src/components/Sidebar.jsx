import React, { useState, useEffect } from 'react';
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
    Scan
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
                // Ensure api is imported from '../api/axios' 
                // We need to import 'api' at the top of Sidebar.jsx
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
                { path: "/library", label: "Bio Library", icon: Dna },
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
                { path: "/inventory-hub", label: "Inventory Hub", icon: Archive },
                { path: "/chemical-inventory", label: "Chemical Inventory", icon: Beaker },
                { path: "/storage", label: "Storage Hub", icon: Archive },
                { path: "/equipment-booking", label: "Equipment Booking", icon: ClipboardList },
                { path: "/strain-repository", label: "Bacterial Strains", icon: Dna },
                { path: "/phage-repository", label: "Bacteriophages", icon: Bug },
                { path: "/plasmid-repository", label: "Plasmids", icon: FileCode },
                { path: "/primer-repository", label: "Primers", icon: AlignLeft },
                { path: "/antibiotic-repository", label: "Antibiotics", icon: Disc },
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
                { path: "/audit-trail", label: "Audit Trail", icon: Activity }, // Admin Only ideally
                { path: "/admin", label: "Admin Panel", icon: Settings },
            ]
        }
    ];

    // 2. Filter Menu Groups based on User Permissions
    const filterMenuItems = (groups) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isSuperAdmin = user.username === 'admin' || user.role === 'SuperAdmin';
        const perms = user.permissions || {};

        if (isSuperAdmin) return groups;

        return groups.map(group => ({
            ...group,
            items: group.items.filter(item => {
                // Map paths or use explicit identifiers if we had them. 
                // For now, mapping known paths to permission keys.
                const pathMap = {
                    '/library': 'library',
                    '/add-data': 'entry', // Data Entry
                    '/inventory-hub': 'inventory',
                    '/chemical-inventory': 'inventory',
                    '/storage': 'storage',
                    '/qr-generator': 'qr_gen',
                    '/qr-reader': 'qr_read',
                    '/audit-trail': 'audit',
                    '/admin': 'admin'
                };

                const permKey = pathMap[item.path];
                if (!permKey) return true; // Default to visible for unmapped (General tools)

                return perms[permKey] && perms[permKey] !== 'none';
            })
        })).filter(group => group.items.length > 0);
    };

    const filteredMenuGroups = filterMenuItems(menuGroups);

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`
                h-screen bg-slate-900/90 backdrop-blur-[20px] 
                border-r border-white/10 text-white 
                transition-all duration-300 ease-in-out
                flex flex-col z-50 fixed left-0 top-0 shadow-2xl shadow-black/50
                ${isOpen ? 'w-64' : 'w-20'}
            `}
        >
            {/* Header / Brand */}
            <div className="h-20 flex items-center justify-center border-b border-white/10 relative overflow-hidden group">
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

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
                {filteredMenuGroups.map((group, idx) => {
                    const isExtendedGroup = group.title === "Scientific Data Explorer";
                    if (isExtendedGroup && !dynamicModules.length) return null;

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

                            {(!isExtendedGroup || isExtendedOpen) && (
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                                                ${isActive
                                                    ? 'bg-[var(--accent-dim)] text-[var(--accent-primary)] shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-[var(--accent-primary)]/20'
                                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'}
                                            `}
                                        >
                                            <div className="relative">
                                                <item.icon className={`w-4 h-4 transition-all duration-300 ${isOpen ? '' : 'mx-auto'} ${location.pathname === item.path ? 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]'}`} />
                                            </div>

                                            {isOpen && (
                                                <span className="font-medium text-sm tracking-wide truncate">
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
            </div>

            {/* System Health & Theme */}
            <div className="border-t border-white/10 p-4 bg-black/20">
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
