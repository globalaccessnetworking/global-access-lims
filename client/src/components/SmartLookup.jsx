import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus, Loader2 } from 'lucide-react';
import api from '../api/axios';

/**
 * SmartLookup Component
 * A premium searchable dropdown that fetches unique values from the database
 * and allows users to enter custom values if not found.
 */
const SmartLookup = ({ 
    module, 
    field, 
    value, 
    onChange, 
    placeholder, 
    label, 
    className,
    required = false,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Fetch unique values from backend on mount or when module/field changes
    useEffect(() => {
        const fetchOptions = async () => {
            if (!module || !field) return;
            setIsLoading(true);
            try {
                const res = await api.get(`/metadata/unique/${module}/${field}`);
                // Metadata returns array of strings
                const formatted = res.data.map(val => ({ label: val, value: val }));
                setOptions(formatted);
            } catch (err) {
                console.error(`Failed to fetch metadata for ${module}.${field}`, err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen && options.length === 0) {
            fetchOptions();
        }
    }, [isOpen, module, field]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCustomAdd = () => {
        if (searchTerm.trim()) {
            handleSelect(searchTerm.trim());
        }
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>}

            <div
                className={`w-full px-4 py-3 bg-slate-900 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500 ring-opacity-50' : 'border-white/10 hover:border-white/20'
                    }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className={`text-sm font-medium truncate ${value ? 'text-white' : 'text-slate-500'}`}>
                    {value || placeholder || "Select..."}
                </span>
                <div className="flex items-center gap-2">
                    {isLoading && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[100] w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up backdrop-blur-xl">
                    <div className="p-2 border-b border-white/5 bg-white/5">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                placeholder="Search or type new..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, idx) => (
                                <div
                                    key={idx}
                                    className={`px-4 py-3 text-sm cursor-pointer transition-colors flex justify-between items-center ${value === option.value
                                            ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-4 border-emerald-500'
                                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                    onClick={() => handleSelect(option.value)}
                                >
                                    {option.label}
                                    {value === option.value && <Check className="w-4 h-4 text-emerald-500" />}
                                </div>
                            ))
                        ) : searchTerm ? (
                            <div 
                                className="px-4 py-4 text-sm text-emerald-400 cursor-pointer hover:bg-emerald-500/10 flex items-center gap-3 border-t border-white/5"
                                onClick={handleCustomAdd}
                            >
                                <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-bold">Add New Value</p>
                                    <p className="text-xs text-slate-500">"{searchTerm}"</p>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-sm text-slate-600 text-center flex flex-col items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin opacity-20" />
                                <p className="font-medium italic">Fetching Intelligence...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartLookup;
