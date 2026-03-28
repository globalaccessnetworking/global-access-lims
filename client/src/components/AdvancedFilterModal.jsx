import React, { useState, useEffect } from 'react';
import { X, Save, Filter, Trash2, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const AdvancedFilterModal = ({ isOpen, onClose, filterType, onApplyFilter }) => {
    const [filters, setFilters] = useState({
        dateRange: { start: '', end: '' },
        status: [],
        tags: [],
        customFields: {}
    });
    const [savedFilters, setSavedFilters] = useState([]);
    const [filterName, setFilterName] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadSavedFilters();
        }
    }, [isOpen, filterType]);

    const loadSavedFilters = async () => {
        try {
            const response = await api.get(`/filters?filterType=${filterType}`);
            setSavedFilters(response.data.filters || []);
        } catch (error) {
            console.error('Failed to load filters:', error);
        }
    };

    const handleSaveFilter = async () => {
        if (!filterName.trim()) {
            alert('Please enter a filter name');
            return;
        }

        try {
            await api.post('/filters/save', {
                name: filterName,
                filterType,
                criteria: filters
            });
            setFilterName('');
            loadSavedFilters();
        } catch (error) {
            console.error('Failed to save filter:', error);
        }
    };

    const handleLoadFilter = (savedFilter) => {
        setFilters(savedFilter.filter_criteria);
    };

    const handleDeleteFilter = async (id) => {
        try {
            await api.delete(`/filters/${id}`);
            loadSavedFilters();
        } catch (error) {
            console.error('Failed to delete filter:', error);
        }
    };

    const handleApply = () => {
        onApplyFilter(filters);
        onClose();
    };

    const handleReset = () => {
        setFilters({
            dateRange: { start: '', end: '' },
            status: [],
            tags: [],
            customFields: {}
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Filter className="text-emerald-400" size={24} />
                        <h2 className="text-xl font-bold text-white">Advanced Filters</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Date Range */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <Calendar size={16} />
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="date"
                                value={filters.dateRange.start}
                                onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })}
                                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                            />
                            <input
                                type="date"
                                value={filters.dateRange.end}
                                onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })}
                                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                            <Tag size={16} />
                            Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Active', 'Completed', 'Pending', 'Cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        const newStatus = filters.status.includes(status)
                                            ? filters.status.filter(s => s !== status)
                                            : [...filters.status, status];
                                        setFilters({ ...filters, status: newStatus });
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filters.status.includes(status)
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Saved Filters */}
                    {savedFilters.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-slate-300 mb-2 block">Saved Filters</label>
                            <div className="space-y-2">
                                {savedFilters.map(filter => (
                                    <div key={filter.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                                        <button
                                            onClick={() => handleLoadFilter(filter)}
                                            className="flex-1 text-left text-white hover:text-emerald-400 transition-colors"
                                        >
                                            {filter.name}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFilter(filter.id)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-rose-400"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Save Current Filter */}
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Save Current Filter</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Filter name..."
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                            />
                            <button
                                onClick={handleSaveFilter}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Save size={16} />
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-700">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                        Reset
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdvancedFilterModal;
