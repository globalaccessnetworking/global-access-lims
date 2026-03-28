import React, { useState } from 'react';
import { Check } from 'lucide-react';

export const useBatchSelect = () => {
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectMode, setSelectMode] = useState(false);

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const selectAll = (ids) => {
        setSelectedItems(new Set(ids));
    };

    const clearSelection = () => {
        setSelectedItems(new Set());
        setSelectMode(false);
    };

    const isSelected = (id) => selectedItems.has(id);

    return {
        selectedItems: Array.from(selectedItems),
        selectedCount: selectedItems.size,
        selectMode,
        setSelectMode,
        toggleSelect,
        selectAll,
        clearSelection,
        isSelected
    };
};

export const SelectCheckbox = ({ id, isSelected, onToggle, className = '' }) => (
    <div
        onClick={(e) => {
            e.stopPropagation();
            onToggle(id);
        }}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-600 hover:border-emerald-500'
            } ${className}`}
    >
        {isSelected && <Check className="w-3 h-3 text-white" />}
    </div>
);

export const BatchActionBar = ({ selectedCount, onClearSelection, children }) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-slide-up">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedCount}
                </div>
                <span className="text-white font-medium">items selected</span>
            </div>
            <div className="h-6 w-px bg-slate-700" />
            {children}
            <button
                onClick={onClearSelection}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
                Clear
            </button>
        </div>
    );
};
