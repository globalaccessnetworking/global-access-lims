import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Clock, Star, FileText, Dna, Bug, Beaker } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const QuickSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Load recent searches from localStorage
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        setRecentSearches(recent);
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.results || []);
            } catch (error) {
                console.error('Search failed:', error);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [query]);

    const handleSelect = (result) => {
        // Save to recent searches
        const recent = [result.name, ...recentSearches.filter(r => r !== result.name)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(recent));
        setRecentSearches(recent);

        // Navigate based on type
        if (result.type === 'experiment') navigate(`/experiments/${result.id}`);
        else if (result.type === 'strain') navigate(`/library?search=${result.name}`);
        else if (result.type === 'phage') navigate(`/library?search=${result.name}`);
        else if (result.type === 'chemical') navigate(`/inventory-hub?search=${result.name}`);

        onClose();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'experiment': return <FileText className="w-4 h-4" />;
            case 'strain': return <Dna className="w-4 h-4" />;
            case 'phage': return <Bug className="w-4 h-4" />;
            case 'chemical': return <Beaker className="w-4 h-4" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-slate-700">
                    <Search className="w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search experiments, samples, chemicals..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {query.length < 2 && recentSearches.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-3">
                                <Clock className="w-3 h-3" />
                                Recent Searches
                            </div>
                            {recentSearches.map((search, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setQuery(search)}
                                    className="px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer text-slate-300 text-sm"
                                >
                                    {search}
                                </div>
                            ))}
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="p-2">
                            {results.map((result, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(result)}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer group"
                                >
                                    <div className="text-emerald-400">{getIcon(result.type)}</div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium text-sm">{result.name}</p>
                                        <p className="text-slate-500 text-xs">{result.type} • {result.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {query.length >= 2 && results.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No results found for "{query}"
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                        <span><kbd className="px-2 py-1 bg-slate-700 rounded">↑↓</kbd> Navigate</span>
                        <span><kbd className="px-2 py-1 bg-slate-700 rounded">Enter</kbd> Select</span>
                    </div>
                    <span><kbd className="px-2 py-1 bg-slate-700 rounded">Esc</kbd> Close</span>
                </div>
            </motion.div>
        </div>
    );
};

export default QuickSearch;
