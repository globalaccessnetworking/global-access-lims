import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, ArrowRight, Database, FlaskConical, TestTube, FileText } from 'lucide-react';
import api from '../api/axios';

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            return;
        }
        // Focus input logic can be handled by autoFocus prop
    }, [isOpen]);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                // Navigation Items
                const navItems = [
                    { id: 'nav-1', title: 'Dashboard', type: 'Navigation', icon: Command, path: '/dashboard' },
                    { id: 'nav-2', title: 'Biological Library', type: 'Navigation', icon: Database, path: '/library' },
                    { id: 'nav-3', title: 'Inventory Hub', type: 'Navigation', icon: FlaskConical, path: '/inventory' },
                    { id: 'nav-4', title: 'Host Range Matrix', type: 'Navigation', icon: TestTube, path: '/matrix' },
                    { id: 'nav-5', title: 'Admin Panel', type: 'Navigation', icon: FileText, path: '/admin' },
                ];

                const filteredNav = navItems.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

                // Real Asset Search & Inventory Search & Antibiotics
                const [assetRes, invRes, antiRes] = await Promise.all([
                    api.get('/assets'),
                    api.get('/inventory'),
                    api.get('/antibiotics')
                ]);

                const assets = assetRes.data.filter(a =>
                    a.species.toLowerCase().includes(query.toLowerCase()) ||
                    String(a.id).includes(query) ||
                    (a.strain_number && a.strain_number.toLowerCase().includes(query.toLowerCase()))
                ).slice(0, 3).map(a => ({
                    id: `asset-${a.id}`,
                    title: `${a.species} (${a.strain_number || 'No ID'})`,
                    type: a.type,
                    icon: Database,
                    path: `/library?search=${a.id}`
                }));

                const inventory = invRes.data.filter(i =>
                    i.name.toLowerCase().includes(query.toLowerCase()) ||
                    i.barcode.includes(query)
                ).slice(0, 3).map(i => ({
                    id: `inv-${i.id}`,
                    title: `${i.name} (${i.current_volume} ${i.unit})`,
                    type: 'Chemical',
                    icon: FlaskConical,
                    path: '/inventory'
                }));

                const antibiotics = antiRes.data.filter(a =>
                    a.name.toLowerCase().includes(query.toLowerCase())
                ).slice(0, 3).map(a => ({
                    id: `anti-${a.id}`,
                    title: `${a.name} (${a.quantity} Discs)`,
                    type: 'Antibiotic',
                    icon: TestTube,
                    path: '/inventory' // Redirect to inventory for now
                }));

                setResults([...filteredNav, ...assets, ...inventory, ...antibiotics]);
                setSelectedIndex(0);

            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (item) => {
        setIsOpen(false);
        if (item.path) {
            navigate(item.path);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
                onClick={() => setIsOpen(false)}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -20 }}
                    className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center gap-4 p-4 border-b border-white/5">
                        <Search className="w-5 h-5 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search for Phages, Strains, or Commands..."
                            className="bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 w-full"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <div className="bg-white/10 px-2 py-1 rounded text-xs text-slate-400 font-mono">ESC</div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Searching...</div>
                        ) : results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${index === selectedIndex ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${index === selectedIndex ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">{item.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs uppercase tracking-wider opacity-50">{item.type}</span>
                                            {index === selectedIndex && <ArrowRight className="w-4 h-4" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query ? (
                            <div className="p-12 text-center text-slate-500">
                                <Command className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No results found for "{query}"</p>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-500">
                                <p>Type to search...</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-950 border-t border-white/5 text-[10px] text-slate-500 flex justify-between px-6">
                        <span>Global Access LIMS Pro</span>
                        <div className="flex gap-4">
                            <span>Select <kbd className="bg-white/10 px-1 rounded mx-1">↵</kbd></span>
                            <span>Navigate <kbd className="bg-white/10 px-1 rounded mx-1">↑↓</kbd></span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CommandPalette;
