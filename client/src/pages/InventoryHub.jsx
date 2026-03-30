import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Package, Plus, FileDown, Search, Edit, Trash2, X, Save, AlertTriangle, Activity, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { useTheme } from '../context/ThemeContext';
import SmartLookup from '../components/SmartLookup';

const InventoryHub = () => {
    const { theme } = useTheme();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentItem, setCurrentItem] = useState({
        item_name: '', manufacturer: '', pack_size: '', category: 'Reagent',
        available_quantity: 0, location_area: '', notes: ''
    });

    useEffect(() => { fetchStocks(); }, []);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory/stocks');
            setStocks(res.data);
        } catch (err) { console.error("Failed to fetch stocks:", err); }
        finally { setLoading(false); }
    };

    const filteredStocks = useMemo(() => {
        if (!searchTerm) return stocks;
        const lower = searchTerm.toLowerCase();
        return stocks.filter(s =>
            s.item_name?.toLowerCase().includes(lower) ||
            s.manufacturer?.toLowerCase().includes(lower) ||
            s.location_area?.toLowerCase().includes(lower) ||
            s.physical_location?.toLowerCase().includes(lower)
        );
    }, [stocks, searchTerm]);

    const handleSaveItem = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') await api.post('/inventory/stocks', currentItem);
            else await api.put(`/inventory/stocks/${currentItem.id}`, currentItem);
            setIsModalOpen(false);
            fetchStocks();
        } catch (err) { alert("Failed to save."); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete item?")) return;
        try { await api.delete(`/inventory/stocks/${id}`); fetchStocks(); }
        catch (err) { console.error(err); }
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
                        <Package className="w-8 h-8 text-[var(--accent-primary)]" /> Inventory Hub
                    </h2>
                    <p className="text-[var(--text-secondary)] mt-1">Manage reagents and consumables</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => exportToPDF(filteredStocks, [], 'Inventory_Report')} className="p-3 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all" title="Export PDF">
                        <FileDown size={20} />
                    </button>
                    <button onClick={() => exportToExcel(filteredStocks, 'Inventory_Export')} className="p-3 rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all" title="Export Excel">
                        <Activity size={20} />
                    </button>
                    <button onClick={() => { setModalMode('add'); setCurrentItem({}); setIsModalOpen(true); }} className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-[var(--accent-dim)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                        <Plus size={20} /> Add Item
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Items</p>
                        <p className="text-4xl font-bold text-[var(--text-primary)] mt-1">{stocks.length}</p>
                    </div>
                    <Database className="w-10 h-10 text-[var(--accent-primary)] opacity-20" />
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Low Stock</p>
                        <p className="text-4xl font-bold text-red-500 mt-1">{stocks.filter(s => s.available_quantity < 10).length}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-red-500 opacity-20" />
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
                            placeholder="Search inventory..."
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
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Manufacturer</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {filteredStocks.map((item, idx) => (
                                <tr key={item.id} className={`group transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[var(--bg-secondary)]/30'} hover:bg-[var(--bg-secondary)]/60`}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-[var(--text-primary)]">{item.item_name}</div>
                                        <div className="text-xs text-[var(--text-secondary)]">{item.pack_size}</div>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-primary)]">{item.manufacturer}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold ${item.available_quantity < 10 ? 'text-red-500' : 'text-[var(--accent-primary)]'}`}>
                                            {item.available_quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[var(--text-primary)]">{item.physical_location}</td>
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

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-panel rounded-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/50">
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{modalMode === 'add' ? 'New Item' : 'Edit Item'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                                <FormInput label="Item Name" value={currentItem.item_name} onChange={v => setCurrentItem({ ...currentItem, item_name: v })} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <SmartLookup 
                                        label="Manufacturer" 
                                        module="inventory" 
                                        field="manufacturer" 
                                        value={currentItem.manufacturer} 
                                        onChange={v => setCurrentItem({ ...currentItem, manufacturer: v })} 
                                    />
                                    <FormInput label="Pack Size" value={currentItem.pack_size} onChange={v => setCurrentItem({ ...currentItem, pack_size: v })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <SmartLookup 
                                        label="Category" 
                                        module="inventory" 
                                        field="category" 
                                        value={currentItem.category} 
                                        onChange={v => setCurrentItem({ ...currentItem, category: v })} 
                                    />
                                    <FormInput label="Quantity" type="number" value={currentItem.available_quantity} onChange={v => setCurrentItem({ ...currentItem, available_quantity: parseInt(v) || 0 })} />
                                </div>
                                <SmartLookup 
                                    label="Location" 
                                    module="inventory" 
                                    field="physical_location" 
                                    value={currentItem.physical_location} 
                                    onChange={v => setCurrentItem({ ...currentItem, physical_location: v })} 
                                />

                                <div className="flex justify-end gap-3 pt-4">
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

const FormInput = ({ label, value, onChange, type = "text", required, placeholder }) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder} className="glass-input w-full px-3 py-2 rounded-lg text-sm" />
    </div>
);

export default InventoryHub;
