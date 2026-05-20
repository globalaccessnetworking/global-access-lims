import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Bug, Dna, FlaskConical, FileCode, Beaker, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const wrapperRef = useRef(null);

    // Debounced search effect
    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
                const data = response.data;
                setResults(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Global search failed:', err);
                setError('Search failed to connect to database.');
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (route) => {
        navigate(route);
        setShowResults(false);
        setQuery(''); // Clear search after selection
    };

    const getTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'phage': return <Bug size={14} className="text-blue-400" />;
            case 'strain': return <Dna size={14} className="text-emerald-400" />;
            case 'primer': return <FileCode size={14} className="text-purple-400" />;
            case 'plasmid': return <FlaskConical size={14} className="text-amber-400" />;
            default: return <Beaker size={14} className="text-slate-400" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'phage': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'strain': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'primer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'plasmid': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-slate-800 text-slate-400 border-white/10';
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-64 md:w-96 z-[100]">
            <div className="relative group">
                <Search className={`absolute left-3 top-2.5 h-4 w-4 transition-colors ${showResults ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400/70'}`} />
                <input
                    type="text"
                    placeholder="Search Inventory, Strains, Phages..."
                    className="w-full pl-10 pr-10 py-2 bg-slate-900/60 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 backdrop-blur-md transition-all shadow-inner"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                />
                
                {/* Right-side spinner */}
                {loading && query.length >= 2 && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-emerald-400 animate-spin" />
                )}
            </div>

            <AnimatePresence>
                {showResults && query.length >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 w-full bg-slate-900 border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl max-h-[400px] overflow-y-auto custom-scrollbar flex flex-col"
                    >
                        {loading && results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <Loader2 className="h-6 w-6 text-emerald-500 animate-spin opacity-50" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Searching Database...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3 px-4 text-center">
                                <AlertCircle className="h-6 w-6 text-rose-500 opacity-50" />
                                <span className="text-xs font-bold text-rose-400">{error}</span>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="py-2">
                                <div className="px-4 py-2 flex items-center justify-between border-b border-white/5 mb-1 bg-slate-950/30">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Matches</span>
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{results.length} found</span>
                                </div>
                                {results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        className="w-full px-4 py-3 hover:bg-white/5 flex items-center justify-between group transition-colors text-left"
                                        onClick={() => handleSelect(result.route)}
                                    >
                                        <div className="flex flex-col max-w-[70%]">
                                            <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                                                {result.label}
                                            </span>
                                            {result.details && (
                                                <span className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                                                    {result.details}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${getTypeColor(result.type)}`}>
                                            {getTypeIcon(result.type)}
                                            {result.type}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 px-4 text-center">
                                <Search className="h-8 w-8 text-slate-700" />
                                <span className="text-sm font-bold text-slate-400">No assets found</span>
                                <span className="text-xs text-slate-600 font-medium">Try searching by ID, Species, or Name.</span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalSearch;
