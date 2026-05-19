import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

/**
 * RelationalSelect Component — Phase 113
 * 
 * A premium searchable dropdown that fetches { id, label } pairs from the
 * Lookup API (/api/lookup/...), saving the ID but displaying the label.
 * This mirrors Microsoft Access "Lookup Field" behavior exactly.
 * 
 * Props:
 *   endpoint   — e.g. "/lookup/species"
 *   value      — currently selected ID (number/string)
 *   onChange   — called with (id, label) when selection changes
 *   label      — field label shown above the dropdown
 *   placeholder — text shown when nothing selected
 *   required   — boolean
 *   disabled   — boolean
 *   className  — extra wrapper classes
 */
const RelationalSelect = ({
    endpoint,
    value,
    onChange,
    label,
    placeholder = 'Select...',
    required = false,
    disabled = false,
    multiple = false, // New Prop for Phase 118
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedLabels, setSelectedLabels] = useState([]);
    const wrapperRef = useRef(null);
    const searchRef = useRef(null);

    // Initial value parsing (supports array or semicolon string)
    const getValuesArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map(String);
        if (typeof val === 'string') return val.split(';').filter(Boolean).map(String);
        return [String(val)];
    };

    const currentValues = getValuesArray(value);

    // Fetch options from Lookup API on first open or endpoint change
    useEffect(() => {
        const fetchOptions = async () => {
            if (!endpoint) return;
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get(endpoint);
                const normalized = res.data.map(item => {
                    const id = item.id ?? item.ID ?? item.value ?? (Array.isArray(item) ? item[0] : null);
                    const label = item.label ?? item.name ?? item.title ?? item.text ?? (Array.isArray(item) ? item[1] : null) ?? String(id);
                    return { id: String(id), label: String(label) };
                });
                setOptions(normalized);
            } catch (err) {
                setError('Failed to load options');
                console.error(`RelationalSelect: failed to fetch ${endpoint}`, err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) fetchOptions();
    }, [isOpen, endpoint]);

    // Update displayed labels when value or options change
    useEffect(() => {
        if (options.length > 0) {
            const vals = getValuesArray(value);
            const matches = options.filter(o => vals.includes(String(o.id)));
            setSelectedLabels(matches.map(m => m.label));
        } else {
            setSelectedLabels([]);
        }
    }, [value, options]);

    // Auto-focus search on open
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (option) => {
        if (multiple) {
            const vals = getValuesArray(value);
            let nextVals;
            if (vals.includes(option.id)) {
                nextVals = vals.filter(v => v !== option.id);
            } else {
                nextVals = [...vals, option.id];
            }
            // Return as semicolon string for legacy DB compatibility
            onChange(nextVals.join(';'), nextVals.map(v => options.find(o => o.id === v)?.label).join(', '));
        } else {
            onChange(option.id, option.label);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('', '');
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && (
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                    <span>{label} {multiple && <span className="text-[10px] text-emerald-500 lowercase ml-1">(Multi-select)</span>}</span>
                    {required && <span className="text-rose-500">*</span>}
                </label>
            )}

            {/* Trigger Button */}
            <div
                className={`
                    w-full px-4 py-3 bg-slate-900 border rounded-xl flex justify-between items-center 
                    cursor-pointer transition-all select-none min-h-[50px]
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500'}
                    ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500/40' : 'border-slate-700'}
                `}
                onClick={() => !disabled && setIsOpen(prev => !prev)}
            >
                <div className="flex-1 flex flex-wrap gap-1.5 overflow-hidden">
                    {selectedLabels.length > 0 ? (
                        multiple ? (
                            selectedLabels.map((lbl, i) => (
                                <span key={i} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-500/30 whitespace-nowrap">
                                    {lbl}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm font-medium text-white whitespace-normal break-words line-clamp-2">{selectedLabels[0]}</span>
                        )
                    ) : (
                        <span className="text-sm font-medium text-slate-500">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                    {isLoading && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
                    {selectedLabels.length > 0 && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-slate-600 hover:text-rose-400 transition-colors text-xs leading-none"
                            title="Clear selection"
                        >
                            ✕
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute z-[200] w-full mt-1 bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-slate-800 flex items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                            <input
                                ref={searchRef}
                                type="text"
                                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-56 overflow-y-auto custom-scrollbar">
                        {error ? (
                            <div className="flex items-center gap-2 px-4 py-4 text-rose-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-slate-500 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading...
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="px-4 py-6 text-slate-600 text-sm text-center italic">
                                {searchTerm ? `No results for "${searchTerm}"` : 'No options available'}
                            </div>
                        ) : (
                            filteredOptions.map(option => {
                                const isSelected = currentValues.includes(option.id);
                                return (
                                    <div
                                        key={option.id}
                                        className={`
                                            px-4 py-2.5 text-sm cursor-pointer transition-colors flex justify-between items-center
                                            ${isSelected
                                                ? 'bg-emerald-500/10 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-2 border-transparent'
                                            }
                                        `}
                                        onClick={() => handleSelect(option)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {multiple && (
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-950'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            )}
                                            <span className="whitespace-normal break-words py-1">{option.label}</span>
                                        </div>
                                        {!multiple && isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer with count */}
                    {!isLoading && !error && (
                        <div className="px-3 py-1.5 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-600 flex justify-between">
                            <span>{filteredOptions.length} of {options.length} options</span>
                            {multiple && <span className="text-emerald-500 font-bold uppercase">{currentValues.length} Selected</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RelationalSelect;
