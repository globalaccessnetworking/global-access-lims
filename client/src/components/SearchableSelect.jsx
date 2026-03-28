import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder, label, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

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

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{label}</label>}

            <div
                className={`w-full px-4 py-3 bg-slate-800 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-500 ring-opacity-50' : 'border-slate-600 hover:border-slate-500'
                    }`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`text-sm font-medium ${selectedOption ? 'text-white' : 'text-slate-500'}`}>
                    {selectedOption ? selectedOption.label : placeholder || "Select..."}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in-up">
                    <div className="p-2 border-b border-slate-700">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                placeholder="Search..."
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
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    className={`px-4 py-3 text-sm cursor-pointer transition-colors flex justify-between items-center ${value === option.value
                                            ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-4 border-emerald-500'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                >
                                    {option.label}
                                    {value === option.value && <Check className="w-4 h-4 text-emerald-500" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
