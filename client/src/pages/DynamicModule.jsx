import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
    Search, Plus, FileDown, Filter, LayoutGrid,
    List, MoreHorizontal, Database, AlertTriangle, X, Edit, Trash2, Check, Clock, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartLookup from '../components/SmartLookup';
import RelationalSelect from '../components/RelationalSelect';


const DynamicModule = ({ type: propsType }) => {
    const { type: paramsType } = useParams();
    const navigate = useNavigate();
    const type = propsType || paramsType;
    const [moduleData, setModuleData] = useState({ schema: [], data: [], count: 0 });
    const [schemaLoading, setSchemaLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]); // [PHASE 168] 
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Dictionary cache for Data Grid rendering
    const [dictionaries, setDictionaries] = useState({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({});

    const [searchParams] = useSearchParams();
    const typeFilter = searchParams.get('filter');

    // [PHASE 115-FINAL] Universal Title Mapping for a Premium "MS Access" Feel
    const getModuleTitle = () => {
        if (typeFilter) {
            if (typeFilter === 'Phage') return 'Bacteriophages';
            if (typeFilter === 'Strain') return 'Bacterial Strains';
            return typeFilter + 's';
        }
        
        const raw = type.replace('ext_', '').replace(/_/g, ' ');
        const mapping = {
            'primers_details': 'Primers Library',
            'plasmids': 'Plasmids Registry',
            'lab_stock': 'Lab Inventory',
            'phage_names': 'Phage Registry',
            'antibiotics': 'Antibiotics Catalog',
            'available_antibiotic_discs': 'Antibiotic Discs',
            'bacterial_species': 'Bacterial Species',
            'chemical_storage_areas': 'Storage Areas',
            'manufacturers': 'Manufacturers List',
            'plasmid_vectors': 'Plasmid Vectors',
            'stock_categories': 'Stock Categories',
            'freezer_locations': 'Freezer Directory',
            'rack_locations': 'Rack Directory',
            'box_locations': 'Box Directory',
            '80_freezer_storage_details_final': '-80 Freezer (Final)',
            '80_freezer_storage_details': '-80 Freezer Registry'
        };
        return mapping[type.replace('ext_', '')] || raw;
    };

    // [PHASE 115-FIX] Optimized Shared Filter Logic for Perfect Header/Row Sync
    const getVisibleColumns = (schema) => {
        if (!schema) return [];
        return schema.filter(c => {
            const key = c.key;
            const lowerKey = key.toLowerCase();

            // 1. Relational text columns (translated labels) are ALWAYS shown
            if (c.isRelational && !lowerKey.endsWith('_id')) return true;
            
            // 2. Hide technical internal IDs
            if (lowerKey.endsWith('_id')) return false;
            if (lowerKey === 'id') return false; 

            // 3. WHITELIST: Essential fields that must always be visible for specific tables
            const WHITELIST = [
                'Bacteriophage_Name', 'Plasmid_Name', 'Primer_Name', 'Item_Name', 
                'Species', 'Manufacturers', 'Category', 'Storage_Area', 'Freezer', 'Rack_No', 'Box_detail',
                'DNA_sequence', 'Sequence', 'Purpose', 'Complete_Name', 'Abbreviation', 'Antibiotic_Disc',
                'type', 'name', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'
            ];
            if (WHITELIST.map(w => w.toLowerCase()).includes(lowerKey)) return true;

            // 4. Default: Show metadata and names
            return !['created_at', 'updated_at', 'deleted_at'].includes(lowerKey);
        });
    };

    const visibleColumns = getVisibleColumns(moduleData.schema);

    useEffect(() => {
        fetchSchema();
        fetchData();
        setSelectedIds([]); // Reset selection on module change
    }, [type, typeFilter]); // Re-fetch or re-process when filter changes

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
            let data = res.data.data;
            
            // Apply URL Filter if present (e.g., ?filter=Phage)
            if (typeFilter && data.length > 0) {
                // Find column key for type (usually 'type' or 'Asset_Type')
                const typeKey = Object.keys(data[0]).find(k => k.toLowerCase() === 'type' || k.toLowerCase() === 'asset_type');
                if (typeKey) {
                    data = data.filter(item => String(item[typeKey]).toLowerCase() === typeFilter.toLowerCase());
                }
            }

            setModuleData(prev => ({
                ...prev,
                data: data,
                count: data.length,
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

            // Auto-apply filter to new record if applicable
            if (modalMode === 'add' && typeFilter) {
                const typeKey = Object.keys(payload).find(k => k.toLowerCase() === 'type' || k.toLowerCase() === 'asset_type');
                if (typeKey) {
                    payload[typeKey] = typeFilter;
                }
            }

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

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`PERMANENT ACTION: Delete ${selectedIds.length} selected records?`)) return;

        setIsBulkDeleting(true);
        try {
            await api.post(`/system/${type}/bulk-delete`, { ids: selectedIds });
            setSelectedIds([]);
            fetchData();
        } catch (err) {
            alert("Bulk delete failed: " + (err.response?.data?.error || err.message));
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(r => r.id));
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const openAddModal = () => {
        // [PHASE 132] Smart Routing Logic
        if (type === 'ext_bacterial_strains' || type === 'ext_query_for_bacterial_strains') {
            navigate('/strain-entry');
            return;
        }
        if (type === 'ext_bacteriophages') {
            navigate('/phage-entry');
            return;
        }
        if (type === 'ext_plasmids' || type === 'plasmid_vectors') {
            navigate('/plasmid-entry');
            return;
        }
        if (type === 'ext_lab_stock' || type === 'Chemical') {
            navigate('/lab-stock-entry');
            return;
        }
        if (type === 'ext_primers_details') {
            navigate('/primer-entry');
            return;
        }
        
        // Antibiotic Discs and all others stay in generic modal
        setModalMode('add');
        const initialForm = {};
        moduleData.schema.forEach(col => {
            if (!['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(col.key.toLowerCase())) {
                let defaultValue = '';
                if (col.type === 'select' && col.options?.length > 0) {
                    const firstOpt = col.options[0];
                    defaultValue = typeof firstOpt === 'object' ? firstOpt.value : firstOpt;
                }
                
                // Smart default for filtered views
                if (typeFilter && (col.key.toLowerCase() === 'type' || col.key.toLowerCase() === 'asset_type')) {
                    defaultValue = typeFilter;
                }

                initialForm[col.key] = defaultValue;
            }
        });
        setFormData(initialForm);
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        // [PHASE 132] Redirect core modules to specialized forms
        if (type === 'ext_plasmids') {
            navigate(`/plasmid-entry?id=${item.id}`);
            return;
        }
        if (type === 'ext_bacterial_strains' || type === 'ext_query_for_bacterial_strains') {
            navigate(`/strain-entry?id=${item.id}`);
            return;
        }
        if (type === 'ext_bacteriophages') {
            navigate(`/phage-entry?id=${item.id}`);
            return;
        }
        if (type === 'ext_lab_stock' || type === 'Chemical') {
            navigate(`/lab-stock-entry?id=${item.id}`);
            return;
        }
        if (type === 'ext_primers_details') {
            navigate(`/primer-entry?id=${item.id}`);
            return;
        }

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

    const handleExportCSV = () => {
        if (!filteredData.length) return;

        // 1. Prepare Headers (Exclude technical IDs)
        const headers = moduleData.schema
            .filter(c => !c.key.endsWith('_id') && c.key.toLowerCase() !== 'id')
            .map(c => c.label);

        // 2. Map Data Rows
        const rows = filteredData.map(item => {
            return moduleData.schema
                .filter(c => !c.key.endsWith('_id') && c.key.toLowerCase() !== 'id')
                .map(col => {
                    let val = item[col.key];

                    // Dictionary lookup for relational labels
                    if (dictionaries[col.key]) {
                        val = dictionaries[col.key][String(val)] || val;
                    }

                    // CRITICAL: Strip Base64 to prevent Excel crashes
                    if (val && typeof val === 'string' && (val.startsWith('data:image') || val.length > 5000)) {
                        return "[Image Data]";
                    }

                    // Sanitize for CSV (Escape quotes)
                    const stringVal = String(val || '').replace(/"/g, '""');
                    return `"${stringVal}"`;
                }).join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        
        // 3. Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Module Report: ${type}`, 14, 20);
        
        const exportSchema = moduleData.schema.filter(c => !c.key.endsWith('_id'));
        
        doc.autoTable({
            head: [exportSchema.map(c => c.label)],
            body: filteredData.map(item => exportSchema.map(c => {
                const val = item[c.key];
                if (dictionaries[c.key]) return dictionaries[c.key][String(val)] || val || '-';
                return val || '-';
            })),
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
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Database className="w-8 h-8 text-emerald-400" />
                        {getModuleTitle()}
                    </h2>
                    <p className="text-slate-400 mt-1">
                        {typeFilter ? `Filtered Repository` : `Dynamic Repository`} &bull; {moduleData.count} Records
                    </p>
                </div>
                <div className="flex gap-2">
                    {moduleData.debug?.version && (
                        <div className="bg-slate-800 border border-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">API</span>
                            <span className="text-[10px] text-emerald-400 font-mono">{moduleData.debug.version}</span>
                        </div>
                    )}
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className={`flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl font-bold transition-all active:scale-95 ${isBulkDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isBulkDeleting ? (
                                <div className="w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            Delete {selectedIds.length} Selected
                        </button>
                    )}
                    <button onClick={handleExportCSV} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95">
                        <FileDown className="w-4 h-4" /> Export CSV
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
                                <th className="px-6 py-4 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-emerald-500 transition-all cursor-pointer"
                                        checked={filteredData.length > 0 && selectedIds.length === filteredData.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                {visibleColumns.map(col => (
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
                                    <tr 
                                        key={row.id || idx} 
                                        className={`hover:bg-white/5 group transition-colors ${selectedIds.includes(row.id) ? 'bg-emerald-500/5' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-emerald-500 transition-all cursor-pointer"
                                                checked={selectedIds.includes(row.id)}
                                                onChange={() => toggleSelectRow(row.id)}
                                            />
                                        </td>
                                        {visibleColumns.map(col => {
                                            const val = row[col.key]; // STRICT KEY-TO-VALUE BINDING
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

                                            // [PHASE 159/160] HANDLE IMAGES & FILES
                                            if (col.type === 'image' && val) {
                                                return (
                                                    <td key={col.key} className="px-6 py-4">
                                                        <div className="relative group/img w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-black/40 shadow-inner">
                                                            <img 
                                                                src={val} 
                                                                alt="Thumbnail" 
                                                                className="w-full h-full object-cover transition-transform group-hover/img:scale-125 cursor-zoom-in"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newWin = window.open();
                                                                    newWin.document.write(`<body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center;"><img src="${val}" style="max-width:90%; border-radius:12px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);"></body>`);
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            if (col.type === 'file' && val) {
                                                return (
                                                    <td key={col.key} className="px-6 py-4">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const link = document.createElement('a');
                                                                link.href = val;
                                                                link.download = `attachment_${col.label}_${row.id || 'file'}.pdf`;
                                                                link.click();
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg border border-white/5 transition-all text-[10px] font-bold uppercase"
                                                        >
                                                            <FileText size={14} className="text-amber-400" /> Download
                                                        </button>
                                                    </td>
                                                );
                                            }

                                            // Handle Deadline Highlighting
                                            if (col.type === 'date' || lowerKey.includes('date') || lowerKey.includes('deadline')) {
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
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`bg-slate-900 rounded-2xl w-full border border-white/10 shadow-2xl flex flex-col max-h-[85vh] ${moduleData.schema.length > 10 ? 'max-w-4xl' : 'max-w-lg'}`}>
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white capitalize">{modalMode} {type.replace('ext_', '').replace(/_/g, ' ')}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSave} className={`p-6 space-y-4 overflow-y-auto custom-scrollbar ${moduleData.schema.length > 10 ? 'max-w-4xl' : ''}`}>
                                <div className={moduleData.schema.length > 10 ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
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
                                    moduleData.schema
                                        .filter(c => !['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(c.key.toLowerCase()))
                                        .map(col => {
                                        
                                        if (col.isRelational && col.endpoint) {
                                            return (
                                                <div key={col.key}>
                                                    <RelationalSelect
                                                        label={col.label}
                                                        endpoint={col.endpoint}
                                                        value={formData[col.key]}
                                                        onChange={(id, label) => setFormData({ ...formData, [col.key]: id })}
                                                        placeholder={`Select ${col.label}...`}
                                                        multiple={col.multiSelect}
                                                    />
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={col.key}>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{col.label}</label>
                                                <input 
                                                    type="text"
                                                    value={formData[col.key] || ''} 
                                                    onChange={e => setFormData({ ...formData, [col.key]: e.target.value })} 
                                                    placeholder={`Type ${col.label}...`}
                                                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 hover:border-white/20 transition-all"
                                                />
                                            </div>
                                        );
                                    })
                                )}
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-white/5 mt-4">
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
