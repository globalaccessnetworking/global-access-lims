import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            try {
                const response = await api.get(`/search?q=${query}`);
                const data = response.data;
                setResults(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Search failed:', error);
            }
        };

        const debounce = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (route) => {
        navigate(route);
        setShowResults(false);
        setQuery('');
    };

    return (
        <div className="relative w-64 md:w-96">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-400" />
                <input
                    type="text"
                    placeholder="Search Inventory, Strains, Phages..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-emerald-500/30 rounded-lg text-sm text-emerald-100 placeholder-emerald-500/50 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/70 backdrop-blur-sm"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    onFocus={() => setShowResults(true)}
                />
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-slate-900 border border-emerald-500/30 rounded-lg shadow-xl z-50 overflow-hidden backdrop-blur-md">
                    {results.map((result) => (
                        <div
                            key={`${result.type}-${result.id}`}
                            className="px-4 py-3 hover:bg-emerald-500/10 cursor-pointer border-b border-emerald-500/10 last:border-0 transition-colors"
                            onClick={() => handleSelect(result.route)}
                        >
                            <div className="text-sm font-medium text-emerald-300">{result.label}</div>
                            <div className="text-xs text-emerald-500/70 capitalize">{result.type}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
