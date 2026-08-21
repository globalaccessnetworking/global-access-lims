import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

/**
 * RelationalSelect Component — Phase 120+
 * 
 * A premium searchable dropdown that fetches { id, label } pairs from the
 * Lookup API (/api/lookup/...), saving the ID but displaying the label.
 * This mirrors Microsoft Access "Lookup Field" behavior exactly.
 * 
 * CRITICAL DESIGN PRINCIPLE:
 * - `selectedIds` is the SINGLE source of truth for what is checked.
 * - It is updated IMMEDIATELY (synchronously) on user click — before the
 *   parent re-renders. This prevents the "double-select" flash.
 * - The external `value` prop syncs INTO `selectedIds` whenever options load
 *   or the value prop changes from outside (e.g., form reset, record load).
 * 
 * Props:
 *   endpoint   — e.g. "/lookup/species"
 *   value      — currently selected ID (number/string) or semicolon-delimited string
 *   onChange   — called with (id, label) when selection changes
 *   label      — field label shown above the dropdown
 *   placeholder — text shown when nothing selected
 *   required   — boolean
 *   disabled   — boolean
 *   multiple   — boolean (enables multi-select mode)
 *   refreshKey — increment this value to force a re-fetch of options
 */
const RelationalSelect = ({
    endpoint,
    value,
    onChange,
    label,
    placeholder = 'Select...',
    required = false,
    disabled = false,
    multiple = false,
    className = '',
    refreshKey = 0,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // SINGLE SOURCE OF TRUTH: what is actually selected (array of id strings)
    const [selectedIds, setSelectedIds] = useState([]);

    const [hasFetched, setHasFetched] = useState(false);
    const wrapperRef = useRef(null);
    const searchRef = useRef(null);

    // -----------------------------------------------------------------------
    // Helper: normalize value prop → array of id strings
    // -----------------------------------------------------------------------
    const normalizeValueProp = (val) => {
        if (val === null || val === undefined || val === '') return [];
        if (Array.isArray(val)) return val.map(String).filter(Boolean);
        if (typeof val === 'string') return val.split(';').filter(Boolean).map(s => s.trim());
        return [String(val)];
    };

    // -----------------------------------------------------------------------
    // Reset on endpoint or refreshKey change → triggers re-fetch
    // -----------------------------------------------------------------------
    useEffect(() => {
        setHasFetched(false);
        setOptions([]);
        // Don't clear selectedIds here — value prop still holds the current IDs
    }, [endpoint, refreshKey]);

    // -----------------------------------------------------------------------
    // Fetch options
    // -----------------------------------------------------------------------
    useEffect(() => {
        const fetchOptions = async () => {
            if (!endpoint) return;
            setIsLoading(true);
            setError(null);
            try {
                const res = await api.get(endpoint);
                const normalized = res.data
                    .map(item => {
                        const rawId = item.id ?? item.ID ?? item.value ?? (Array.isArray(item) ? item[0] : null);
                        const rawLabel = item.label ?? item.name ?? item.title ?? item.text
                            ?? (Array.isArray(item) ? item[1] : null)
                            ?? String(rawId);
                        // CRITICAL: skip null/empty IDs — they cause bulk-selection bugs
                        if (rawId === null || rawId === undefined || rawId === '') return null;
                        return { id: String(rawId), label: String(rawLabel) };
                    })
                    .filter(Boolean);
                setOptions(normalized);
                setHasFetched(true);

                // Sync external value prop into internal selectedIds now that we have options
                const extIds = normalizeValueProp(value);
                // Only set IDs that actually exist in the fetched options
                const validIds = extIds.filter(id => normalized.some(o => o.id === id));
                setSelectedIds(validIds);
            } catch (err) {
                setError('Failed to load options');
                console.error(`RelationalSelect: failed to fetch ${endpoint}`, err);
            } finally {
                setIsLoading(false);
            }
        };

        const hasValue = normalizeValueProp(value).length > 0;
        if ((isOpen || hasValue) && !hasFetched && !isLoading) {
            fetchOptions();
        }
    }, [isOpen, endpoint, hasFetched, isLoading]);

    // -----------------------------------------------------------------------
    // Sync external value → selectedIds when options are already loaded
    // (handles: record loads, form resets, parent-driven changes)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!hasFetched || options.length === 0) return;

        const extIds = normalizeValueProp(value);
        // Only include IDs that exist in our loaded options (prevents ghost selections)
        const validIds = extIds.filter(id => options.some(o => o.id === id));

        // Only update if the selection actually differs (prevents infinite loops)
        const currentSorted = [...selectedIds].sort().join(',');
        const newSorted = [...validIds].sort().join(',');
        if (currentSorted !== newSorted) {
            setSelectedIds(validIds);
        }
    }, [value, options, hasFetched]);

    // -----------------------------------------------------------------------
    // Auto-focus search on open
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // -----------------------------------------------------------------------
    // Close dropdown on outside click
    // -----------------------------------------------------------------------
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

    // -----------------------------------------------------------------------
    // Computed: selected option objects (for label display)
    // -----------------------------------------------------------------------
    const selectedOptions = options.filter(o => selectedIds.includes(o.id));
    const selectedLabels = selectedOptions.map(o => o.label);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // -----------------------------------------------------------------------
    // Handle click on a list item
    // -----------------------------------------------------------------------
    const handleSelect = (option) => {
        if (multiple) {
            // Toggle item in/out of selection
            const isCurrentlySelected = selectedIds.includes(option.id);
            const nextIds = isCurrentlySelected
                ? selectedIds.filter(id => id !== option.id)
                : [...selectedIds, option.id];

            // Update internal state IMMEDIATELY
            setSelectedIds(nextIds);

            // Notify parent
            const nextLabels = nextIds.map(id => options.find(o => o.id === id)?.label ?? '');
            onChange(nextIds.join(';'), nextLabels.join(', '));
        } else {
            // Single select: replace selection IMMEDIATELY
            setSelectedIds([option.id]);

            // Notify parent + close
            onChange(option.id, option.label);
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSelectedIds([]);
        onChange('', '');
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
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
                                // Use internal selectedIds — the single source of truth
                                const isSelected = selectedIds.includes(option.id);
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
                            {multiple && <span className="text-emerald-500 font-bold uppercase">{selectedIds.length} Selected</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RelationalSelect;
