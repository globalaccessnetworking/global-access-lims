import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DataGrid = ({
    data = [],
    columns = [],
    onRowClick,
    actions,
    loading = false,
    headerActions
}) => {
    const { theme } = useTheme();
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filters, setFilters] = useState({});

    // Handling Sort
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Handling Filter
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Process Data
    const processedData = useMemo(() => {
        if (!data) return [];
        let processed = [...data];

        // 1. Filtering
        Object.keys(filters).forEach(key => {
            const term = filters[key].toLowerCase();
            if (term) {
                processed = processed.filter(item => {
                    const val = String(item[key] || '').toLowerCase();
                    return val.includes(term);
                });
            }
        });

        // 2. Sorting
        if (sortConfig.key) {
            processed.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [data, sortConfig, filters]);

    // Render Logic
    return (
        <div className="flex flex-col h-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-lg transition-colors duration-300">
            {/* Toolbar */}
            {headerActions && (
                <div className="p-2 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex justify-end gap-2">
                    {headerActions}
                </div>
            )}

            {/* Grid Container */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="sticky top-0 z-20 bg-[var(--table-header-bg)] shadow-md text-[var(--text-secondary)]">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.accessor}
                                    className="px-3 py-2 text-xs font-bold uppercase tracking-wider border-b border-r border-[var(--border-color)] last:border-r-0 select-none group"
                                    style={{ width: col.width || 'auto' }}
                                >
                                    <div className="flex flex-col gap-1">
                                        {/* Header Title & Sort */}
                                        <div
                                            className="flex items-center justify-between cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
                                            onClick={() => requestSort(col.accessor)}
                                        >
                                            <span>{col.header}</span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {sortConfig.key === col.accessor ? (
                                                    sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                                                ) : <Filter size={10} />}
                                            </span>
                                        </div>

                                        {/* Quick Filter Input */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Filter..."
                                                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded text-[10px] px-1 py-0.5 focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                                                onChange={(e) => handleFilterChange(col.accessor, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                </th>
                            ))}
                            {actions && <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider border-b border-[var(--border-color)] w-20 text-center">Actions</th>}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-primary)]">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-20 text-center text-[var(--text-secondary)]">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading Data...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : processedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-20 text-center text-[var(--text-secondary)] italic">
                                    No records found.
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row, idx) => (
                                <tr
                                    key={row.id || idx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`
                                        group transition-colors duration-75 cursor-default
                                        ${idx % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--table-row-alt)]'}
                                        hover:bg-[var(--table-row-hover)]
                                    `}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={`${row.id}-${col.accessor}`}
                                            className="px-3 py-1.5 text-sm text-[var(--text-primary)] border-r border-[var(--border-color)] last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis"
                                        >
                                            {col.render ? col.render(row) : (row[col.accessor] || '-')}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-3 py-1.5 border-r border-[var(--border-color)] last:border-r-0 text-center">
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer / Count */}
            <div className="bg-[var(--bg-surface)] border-t border-[var(--border-color)] px-4 py-1 text-[10px] text-[var(--text-secondary)] flex justify-between items-center">
                <span>Total Records: <span className="text-[var(--text-primary)] font-bold">{processedData.length}</span></span>
                <span>LIMS Pro DataSheet v1.0</span>
            </div>
        </div>
    );
};

export default DataGrid;
