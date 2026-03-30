import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
    Search, Plus, FileDown, Filter, LayoutGrid,
    List, MoreHorizontal, Database, AlertTriangle, X, Edit, Trash2, Check, Clock, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartLookup from '../components/SmartLookup';


const DynamicModule = ({ type: propsType }) => {
    const { type: paramsType } = useParams();
    const type = propsType || paramsType;
    const [moduleData, setModuleData] = useState({ schema: [], data: [], count: 0 });
    const [schemaLoading, setSchemaLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchSchema();
        fetchData();
    }, [type]);

    const fetchSchema = async () => {
        setSchemaLoading(true);
        try {
            const res = await api.get(`/system/${type}/schema`);
            setModuleData(prev => ({ ...prev, schema: res.data.schema }));
        } catch (err) {
            console.error("Failed to fetch schema", err);
        } finally {
            setSchemaLoading(false);
        }
    };

    const fetchData = async () => {
        setDataLoading(true);
        setError(null);
        try {
            const res = await api.get(`/system/${type}`);
            console.log(`[DYNAMIC MODULE] Data for ${type}:`, res.data);
            setModuleData(prev => ({
                ...prev,
                data: res.data.data,
                count: res.data.count,
                debug: res.data.debug
            }));
        } catch (err) {
            console.error("Failed to fetch module data", err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setDataLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Cleanse Payload: Convert empty strings to null for numeric/foreign key fields
            const payload = { ...formData };
            moduleData.schema.forEach(col => {
                if ((col.type === 'number' || col.type === 'select') && payload[col.key] === '') {
                    payload[col.key] = null;
                }
            });

            if (modalMode === 'add') {
                await api.post(`/system/${type}`, payload);
            } else {
                await api.put(`/system/${type}/${formData.id}`, payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            alert("Failed to save record: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this record permanently?")) return;
        try {
            await api.delete(`/system/${type}/${id}`);
            fetchData();
        } catch (err) {
            alert("Delete failed.");
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        const initialForm = {};
        moduleData.schema.forEach(col => {
            if (!['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(col.key.toLowerCase())) {
                let defaultValue = '';
                if (col.type === 'select' && col.options?.length > 0) {
                    const firstOpt = col.options[0];
                    defaultValue = typeof firstOpt === 'object' ? firstOpt.value : firstOpt;
                }
                initialForm[col.key] = defaultValue;
            }
        });
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setFormData(item);
        setIsModalOpen(true);
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return moduleData.data;
        const lower = searchTerm.toLowerCase();
        return moduleData.data.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(lower)
            )
        );
    }, [moduleData.data, searchTerm]);

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Module Report: ${type}`, 14, 20);
        doc.autoTable({
            head: [moduleData.schema.map(c => c.label)],
            body: filteredData.map(item => moduleData.schema.map(c => item[c.key] || '-')),
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        });
        doc.save(`${type}_Report.pdf`);
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3 capitalize">
                        <Database className="w-8 h-8 text-emerald-400" />
                        {type?.startsWith('ext_')
                            ? type.replace('ext_', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                            : type}
                    </h2>
                    <p className="text-slate-400 mt-1">Dynamic Repository &bull; {moduleData.count} Records</p>
                </div>
                <div className="flex gap-2">
                    {moduleData.debug?.version && (
                        <div className="bg-slate-800 border border-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">API</span>
                            <span className="text-[10px] text-emerald-400 font-mono">{moduleData.debug.version}</span>
                        </div>
                    )}
                    <button onClick={exportPDF} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl flex items-center gap-2">
                        <FileDown className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={openAddModal}
                        className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 ${schemaLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'}`}
                        disabled={schemaLoading}
                    >
                        {schemaLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                Loading Form...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" /> Add New
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
                    <AlertTriangle size={20} />
                    <div className="text-sm">
                        <p className="font-bold">System Connection Error</p>
                        <p className="opacity-80">{error}</p>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-4 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white outline-none focus:border-emerald-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-white/10">
                            <tr>
                                {moduleData.schema.map(col => (
                                    <th key={col.key} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{col.label}</th>
                                ))}
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {dataLoading ? (
                                <tr><td colSpan="100" className="text-center py-20 text-slate-500 animate-pulse font-mono uppercase tracking-widest text-xs">Fetching Records...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan="100" className="text-center py-20 text-slate-500 italic">No records found.</td></tr>
                            ) : (
                                filteredData.map((row, idx) => (
                                    <tr key={row.id || idx} className="hover:bg-white/5 group transition-colors">
                                        {moduleData.schema.map(col => {
                                            const val = row[col.key];
                                            const lowerKey = col.key.toLowerCase();

                                            // Handle Status Badges
                                            if (lowerKey === 'status') {
                                                const status = String(val || '').trim();
                                                let badgeClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                                                if (status === 'Completed' || status === 'Finished' || status === 'Success') badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                                if (status === 'In Progress' || status === 'Running') badgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                                if (status === 'Pending' || status === 'Todo') badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                                if (status === 'Critical' || status === 'Failed') badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                                                return (
                                                    <td key={col.key} className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${badgeClass}`}>
                                                            {status || 'Unknown'}
                                                        </span>
                                                    </td>
                                                );
                                            }

                                            // Handle Deadline Highlighting
                                            if (lowerKey.includes('date') || lowerKey.includes('deadline')) {
                                                const date = val ? new Date(val) : null;
                                                const isOverdue = date && date < new Date() && row.status !== 'Completed';
                                                return (
                                                    <td key={col.key} className="px-6 py-4 text-sm font-mono">
                                                        <span className={isOverdue ? 'text-rose-500 font-bold animate-pulse' : 'text-slate-400'}>
                                                            {val ? new Date(val).toLocaleDateString() : '-'}
                                                        </span>
                                                    </td>
                                                );
                                            }

                                            return <td key={col.key} className="px-6 py-4 text-sm text-slate-200">{String(val || '-')}</td>;
                                        })}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {type === 'ext_lab_tasks' && row.status !== 'Completed' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (window.confirm("Mark as completed?")) {
                                                                await api.put(`/system/${type}/${row.id}`, { ...row, status: 'Completed' });
                                                                fetchData();
                                                            }
                                                        }}
                                                        className="p-2 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 rounded-lg group"
                                                        title="Quick Complete"
                                                    >
                                                        <Check size={14} className="group-hover:scale-125 transition-transform" />
                                                    </button>
                                                )}
                                                <button onClick={() => openEditModal(row)} className="p-2 hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 rounded-lg"><Edit size={14} /></button>
                                                <button onClick={() => handleDelete(row.id)} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Change Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white capitalize">{modalMode} {type.replace('ext_', '').replace(/_/g, ' ')}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                {moduleData.schema.filter(c => !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(c.key.toLowerCase())).length === 0 ? (
                                    <div className="py-6 px-4 text-center border border-dashed border-white/10 rounded-xl space-y-3">
                                        <p className="text-slate-500 italic">No editable fields detected for this table.</p>
                                        {moduleData.debug?.errors && Object.keys(moduleData.debug.errors).length > 0 && (
                                            <div className="text-[9px] text-red-500/70 font-mono text-left bg-black/30 p-2 rounded max-h-40 overflow-auto">
                                                <p className="font-bold border-b border-white/5 mb-1 uppercase">Metadata Trace:</p>
                                                {Object.entries(moduleData.debug.errors).map(([m, err]) => (
                                                    <p key={m} className="mb-0.5"><span className="text-slate-500">{m}:</span> {String(err)}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    moduleData.schema.filter(c => !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(c.key.toLowerCase())).map(col => (
                                        <div key={col.key}>
                                            <SmartLookup 
                                                label={col.label} 
                                                module={type} 
                                                field={col.key} 
                                                value={formData[col.key] || ''} 
                                                onChange={val => setFormData({ ...formData, [col.key]: val })} 
                                                placeholder={`Select or type ${col.label}...`}
                                            />
                                        </div>
                                    ))

                                )}
                                <div className="pt-4 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-400 font-bold">Cancel</button>
                                    <button type="submit" className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg" disabled={schemaLoading || moduleData.schema.length === 0}>
                                        Save Record
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DynamicModule;
