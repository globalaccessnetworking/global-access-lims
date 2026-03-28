import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { User, Bell, Search, Command, X, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import CommandPalette from './CommandPalette';
import GlobalSearch from './GlobalSearch';

const Layout = ({ children }) => {
    const location = useLocation();

    // User Data & Access Level Mapping
    const [userData, setUserData] = useState({ username: 'User', role: 'Student' });
    const [notifications, setNotifications] = useState([]);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const [branding, setBranding] = useState({
        orgName: 'GLOBAL ACCESS',
        accentColor: '#10b981',
        logoType: 'icon',
        logoUrl: ''
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUserData(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }

        const savedBranding = localStorage.getItem('lims_branding');
        if (savedBranding) setBranding(JSON.parse(savedBranding));

        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                (id === 'all' || n.id === id) ? { ...n, is_read: true } : n
            ));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const getAccessLevel = (user) => {
        if (!user) return 'Restricted Access';
        // Force Level 5 for the main 'admin' account
        if (user.username === 'admin' || user.role === 'SuperAdmin') return 'Level 5 (Super Admin)';

        const levels = {
            'Admin': 'Level 4 Access',
            'Researcher': 'Level 2 Access',
            'Student': 'Level 1 Access'
        };
        return levels[user.role] || 'Restricted Access';
    };

    // Custom Cursor Logic
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const updateMousePosition = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', updateMousePosition);
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, []);

    // Page Title Map
    const getPageTitle = (path) => {
        if (path.includes('dashboard')) return 'Command Center';
        if (path.includes('inventory')) return 'Inventory Operations';
        if (path.includes('library')) return 'Biological Assets';
        if (path.includes('add')) return 'Data Ingestion';
        return 'Laboratory Information System';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-hidden flex">

            {/* Custom Cursor */}
            <motion.div
                className="fixed w-8 h-8 border border-emerald-400/50 rounded-full pointer-events-none z-[100] mix-blend-screen"
                animate={{ x: mousePosition.x - 16, y: mousePosition.y - 16 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
            />
            <motion.div
                className="fixed w-2 h-2 bg-emerald-400 rounded-full pointer-events-none z-[100]"
                animate={{ x: mousePosition.x - 4, y: mousePosition.y - 4 }}
                transition={{ type: "spring", stiffness: 1000, damping: 40 }}
            />

            <CommandPalette />

            {/* Floating Sidebar */}
            <Sidebar />

            <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">

                {/* Top Bar / Status Pill */}
                <header className="flex justify-between items-center mb-10 sticky top-0 z-40 py-2">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/60 backdrop-blur-md border border-white/5 px-6 py-2 rounded-full flex items-center gap-4 text-sm text-slate-400 shadow-xl"
                    >
                        <span className="font-bold text-white tracking-wide">{getPageTitle(location.pathname)}</span>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">{branding.orgName}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SYSTEM NODE</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <GlobalSearch />
                    </motion.div>

                    <div className="flex items-center gap-4 relative">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className={`w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center transition-all relative ${notificationsOpen ? 'bg-slate-800 border-emerald-500/50 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:border-emerald-500/30'}`}
                        >
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <>
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
                                </>
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {notificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-12 right-0 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => handleMarkAsRead('all')}
                                                className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors relative group ${!n.is_read ? 'bg-emerald-500/5' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                                        <div className="flex-1">
                                                            <p className={`text-xs leading-relaxed ${!n.is_read ? 'text-white font-medium' : 'text-slate-400'}`}>
                                                                {n.message}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(n.created_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        {!n.is_read && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(n.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 bg-slate-800 rounded-md text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all self-start"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center">
                                                <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                                                    <Bell className="w-6 h-6" />
                                                </div>
                                                <p className="text-xs text-slate-500 italic">No notifications yet</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center gap-3 bg-slate-900 border border-white/10 rounded-full px-1 pr-4 py-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-900/50">
                                {userData.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-xs font-bold text-white capitalize">{userData.username}</span>
                                <span className="text-[10px] text-emerald-400">{getAccessLevel(userData)}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="max-w-[1600px] mx-auto">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </div>

                {/* Footer */}
                <div className="mt-20 border-t border-white/5 py-6 flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest">
                    <span>Use of this system is restricted to authorized personnel of <span className="text-emerald-500 font-bold">{branding.orgName}</span>.</span>
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Node Active :: {branding.orgName}
                    </span>
                </div>
            </main>
        </div>
    );
};
export default Layout;
