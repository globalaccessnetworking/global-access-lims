import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Database, Filter } from 'lucide-react';
import api from '../api/axios';

const QueryBuilder = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTable, setSelectedTable] = useState('InventoryStock');
    const [columns, setColumns] = useState([]);

    // Hardcoded schema for now (Phase 69 MVP)
    const SCHEMA = {
        'InventoryStock': ['item_name', 'manufacturer', 'catalog_number', 'lot_number', 'cas_number', 'expiration_date', 'quantity', 'unit', 'location', 'min_level'],
        'BiologicalAsset': ['name', 'type', 'biosafety_level', 'description'],
        'Experiment': ['title', 'status', 'start_date', 'end_date'],
        'AvailableAntibiotic': ['name', 'class', 'stock_concentration']
    };

    const handleSave = () => {
        const config = {
            table: selectedTable,
            columns: columns.length > 0 ? columns : undefined,
            filters: [] // TODO: Add logic
        };
        onSave({ name, description, type: 'dynamic', query_config: config });
    };

    const toggleColumn = (col) => {
        if (columns.includes(col)) {
            setColumns(columns.filter(c => c !== col));
        } else {
            setColumns([...columns, col]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text-secondary)] uppercase">Query Name</label>
                    <input
                        className="glass-input w-full px-4 py-2 rounded-xl"
                        value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Low Stock Antibiotics"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-[var(--text-secondary)] uppercase">Description</label>
                    <input
                        className="glass-input w-full px-4 py-2 rounded-xl"
                        value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description..."
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--text-secondary)] uppercase">Select Data Source</label>
                <div className="flex gap-4">
                    {Object.keys(SCHEMA).map(table => (
                        <button
                            key={table}
                            onClick={() => { setSelectedTable(table); setColumns([]); }}
                            className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2
                                ${selectedTable === table
                                    ? 'bg-[var(--accent-dim)] border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}
                            `}
                        >
                            <Database size={16} /> {table}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--text-secondary)] uppercase">Select Columns to Display</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 glass-panel rounded-xl">
                    {SCHEMA[selectedTable]?.map(col => (
                        <label key={col} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-primary)]">
                            <input
                                type="checkbox"
                                checked={columns.includes(col)}
                                onChange={() => toggleColumn(col)}
                                className="rounded border-[var(--border-color)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                            />
                            {col}
                        </label>
                    ))}
                </div>
            </div>

            {/* Placeholder for Advanced Filters */}
            <div className="p-4 rounded-xl border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] text-sm flex items-center justify-center gap-2">
                <Filter size={16} /> Advanced Filtering Logic (Coming Soon)
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button onClick={onCancel} className="px-6 py-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button>
                <button onClick={handleSave} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-8 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <Save size={18} /> Save Query
                </button>
            </div>
        </div>
    );
};

export default QueryBuilder;
