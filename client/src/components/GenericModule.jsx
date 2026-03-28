import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Plus, FileDown, Search, Edit, Trash2, X, Save, Database, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { useTheme } from '../context/ThemeContext';

const GenericModule = ({ title, type, endpoint, columns, mapData, icon: Icon = Database }) => {
    const { theme } = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentItem, setCurrentItem] = useState({});

    useEffect(() => { fetchData(); }, [endpoint]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(endpoint);
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (err) { console.error(`Failed to fetch ${title}:`, err); }
        finally { setLoading(false); }
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lower = searchTerm.toLowerCase();
        return data.filter(item =>
            Object.values(item).some(val => String(val).toLowerCase().includes(lower))
        );
    }, [data, searchTerm]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') await api.post(endpoint, currentItem);
            else await api.put(`${endpoint}/${currentItem.id}`, currentItem);
            setIsModalOpen(false);
            fetchData();
        } catch (err) { alert("Failed to save."); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete record?")) return;
        try { await api.delete(`${endpoint}/${id}`); fetchData(); }
        catch (err) { console.error("Delete failed:", err); }
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
                        <Icon className="w-8 h-8 text-[var(--accent-primary)]" /> {title}
                    </h2>
                    <p className="text-[var(--text-secondary)] mt-1">{title} Database Records</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => exportToPDF(data, columns.map(c => ({ header: c.label, accessor: c.key })), `${title}_Report`)} className="p-3 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all" title="Export PDF">
                        <FileDown size={20} />
                    </button>
                    <button onClick={() => exportToExcel(data, `${title}_Export`)} className="p-3 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all" title="Export Excel">
                        <Activity size={20} />
                    </button>
                    <button onClick={() => { setModalMode('add'); setCurrentItem({}); setIsModalOpen(true); }} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-[var(--accent-dim)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                        <Plus size={20} /> Add Record
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Records</p>
                        <p className="text-4xl font-bold text-[var(--text-primary)] mt-1">{data.length}</p>
                    </div>
                    <Database className="w-10 h-10 text-[var(--accent-primary)] opacity-20" />
                </div>
            </div>

            {/* Content Area */}
            <div className="glass-panel rounded-2xl flex-1 flex flex-col overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 text-[var(--text-secondary)] w-5 h-5" />
                        <input
                            type="text"
                            placeholder={`Search ${title}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-secondary)]/50 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                {columns.map((col, i) => (
                                    <th key={i} className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{col.label}</th>
                                ))}
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredData.map((item, idx) => (
                                <tr key={item.id || idx} className={`group transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--bg-secondary)]/30'} hover:bg-[var(--bg-secondary)]/60`}>
                                    {columns.map((col, cIdx) => (
                                        <td key={cIdx} className="px-6 py-4 text-[var(--text-primary)]">
                                            {col.render ? col.render(item[col.key], item) : item[col.key]}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setModalMode('edit'); setCurrentItem(item); setIsModalOpen(true); }} className="p-2 hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded-lg"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dynamic Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50 shrink-0">
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{modalMode === 'add' ? `Add to ${title}` : 'Edit Record'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                                {columns.map((col) => (
                                    <div key={col.key} className="space-y-1">
                                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">{col.label}</label>
                                        <input
                                            type="text"
                                            value={currentItem[col.key] || ''}
                                            onChange={e => setCurrentItem({ ...currentItem, [col.key]: e.target.value })}
                                            className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                                        />
                                    </div>
                                ))}

                                <div className="pt-6 flex justify-end gap-3 shrink-0">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">Cancel</button>
                                    <button type="submit" className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-6 py-2 rounded-lg font-bold shadow-lg">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GenericModule;
