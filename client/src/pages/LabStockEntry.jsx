import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Save, Package, Search, AlertTriangle, CheckCircle, 
    Database, Thermometer, MapPin, X, Activity, FlaskConical, Dna, Box, 
    Settings, Upload, Image as ImageIcon, File as FileIcon, Plus, Zap, Cpu, ScanLine, Info
} from 'lucide-react';
import RelationalSelect from '../components/RelationalSelect';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Lab-Stock / Chemicals Library Modernization — Phase 171
 * 
 * Powered by Hybrid-Dynamic Clinical Engine v11.
 * Supports: 
 *  - Runtime Schema Evolution (Add CAS Numbers, Mol Weights, etc.)
 *  - Native Media Persistence (Bottle Photos, SDS Sheets)
 *  - Hardware Barcode Integration (Auto-focus logic preserved)
 *  - Zero-Clipping Layered UX (Z-Index Hierarchy for Select overlaps)
 */

const CORE_FIELDS = [
    'id', 'barcode', 'Item_Name', 'Cat__', 'Manufacturer', 
    'Pack_Size', 'Category', 'Available_Quantity', 
    'Location_Area', 'Location_Area_final', 'Location_details',
    'Stock_Image', 'Safety_Data_Sheet'
];

const LabStockEntry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const barcodeInputRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [schema, setSchema] = useState([]);
    const [isScanning, setIsScanning] = useState(true);
    
    // Schema Evolution State
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [isAddingField, setIsAddingField] = useState(false);
    const [newField, setNewField] = useState({ name: '', type: 'text' });

    const [formData, setFormData] = useState({
        id: null,
        barcode: '',
        Item_Name: '',
        Cat__: '',
        Manufacturer: '',
        Pack_Size: '',
        Category: '',
        Available_Quantity: '',
        Location_Area: '',
        Location_Area_final: '',
        Location_details: '',
        Stock_Image: null,
        Safety_Data_Sheet: null
    });

    // --- Data Hydration ---
    const fetchInitialData = useCallback(async (existingId) => {
        setLoading(true);
        try {
            const [schemaRes, dataRes] = await Promise.all([
                api.get('/system/ext_lab_stock/schema'),
                existingId ? api.get(`/system/ext_lab_stock/${existingId}`) : Promise.resolve({ data: null })
            ]);

            setSchema(schemaRes.data.schema);
            if (dataRes.data) {
                setFormData(prev => ({ 
                    ...prev, 
                    ...dataRes.data,
                    id: dataRes.data.id 
                }));
            }
        } catch (err) {
            console.error("Hydration Failed:", err);
            setError("Failed to link with Lab Stock Repository.");
        } finally {
            setLoading(false);
            // Re-focus scanner after hydration
            if (barcodeInputRef.current) barcodeInputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const id = searchParams.get('id');
        fetchInitialData(id);
    }, [searchParams, fetchInitialData]);

    // Hardware Scanner Auto-Focus logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (barcodeInputRef.current) barcodeInputRef.current.focus();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // --- Business Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { id, ...payload } = formData;
            if (id) {
                await api.put(`/system/ext_lab_stock/${id}`, payload);
                setSuccess("Inventory Metadata Synchronized.");
            } else {
                const res = await api.post('/system/ext_lab_stock', payload);
                setFormData(prev => ({ ...prev, id: res.data.record.id }));
                setSuccess("New Lab Stock Registered.");
            }
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || "Repository sync failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, [field]: reader.result });
        };
        reader.readAsDataURL(file);
    };

    // --- Schema Evolution (Dynamic Engine) ---
    const handleAddField = async (e) => {
        e.preventDefault();
        if (!newField.name) return;
        setIsAddingField(true);
        try {
            await api.post('/system/ext_lab_stock/add-column', {
                columnName: newField.name.trim().replace(/\s+/g, '_'),
                type: newField.type
            });
            setIsFieldModalOpen(false);
            setNewField({ name: '', type: 'text' });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field creation failed: " + (err.response?.data?.error || err.message));
        } finally {
            setIsAddingField(false);
        }
    };

    const handleRemoveField = async (columnName) => {
        if (!window.confirm(`PERMANENT ACTION: Delete the field '${columnName.replace(/_/g, ' ')}' and all its data?`)) return;
        try {
            await api.post('/system/ext_lab_stock/delete-column', { columnName });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field deletion failed.");
        }
    };

    const dynamicFields = schema.filter(col => !CORE_FIELDS.includes(col.key));

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
            
            {/* HEADER (Phase 171 Modernization) */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6 flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <Package className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Lab Stock & Chemicals</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Hybrid-Dynamic Clinical Engine &bull; Phase 171</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFieldModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition-all"
                    >
                        <Settings size={14} className="text-emerald-400" /> Manage Fields
                    </button>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- 0. HARDWARE INTEGRATION (BARCODE) --- */}
                <div className="bg-gradient-to-r from-purple-900/10 to-indigo-900/10 p-8 rounded-3xl border border-purple-500/20 shadow-xl relative overflow-visible z-[50]">
                    <div className="absolute -top-3 left-8 px-4 py-1 bg-[#0f172a] border border-purple-500/30 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                        Hardware Barcode Scanner
                    </div>
                    <div className="relative group">
                        <input
                            ref={barcodeInputRef}
                            type="text"
                            name="barcode"
                            value={formData.barcode}
                            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                            placeholder="Scan Asset / Container Barcode..."
                            className="w-full pl-14 pr-6 py-5 bg-slate-950/80 border border-purple-500/30 rounded-2xl text-white font-mono text-3xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all shadow-inner placeholder-slate-800 group-hover:bg-slate-950 transition-colors"
                        />
                        <ScanLine className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500/40 w-8 h-8 group-hover:text-purple-500 transition-colors" />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-[10px] font-mono text-purple-500/50 uppercase tracking-tighter">Ready for laser input</span>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>
                    </div>
                </div>

                {/* --- 1. SCIENTIFIC IDENTITY (Z-40) --- */}
                <div className="bg-[#0f172a] p-10 rounded-3xl border border-slate-800 shadow-xl space-y-8 relative z-[40]">
                    <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Item Specification</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Legacy ID</label>
                            <input type="text" value={formData.id || "(Auto)"} readOnly className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-600 font-mono text-xs cursor-not-allowed outline-none shadow-inner" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Complete Item Name</label>
                            <input
                                type="text"
                                value={formData.Item_Name}
                                onChange={e => setFormData({ ...formData, Item_Name: e.target.value })}
                                placeholder="e.g. Sodium Chloride (Pharma Grade)"
                                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-inner font-medium text-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Catalog / Part #</label>
                            <input
                                type="text"
                                value={formData.Cat__}
                                onChange={e => setFormData({ ...formData, Cat__: e.target.value })}
                                placeholder="Catalog Number..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none transition-all shadow-inner font-mono"
                            />
                        </div>
                        <RelationalSelect
                            label="Manufacturer"
                            endpoint="/lookup/manufacturers"
                            value={formData.Manufacturer}
                            onChange={(id) => setFormData({ ...formData, Manufacturer: id })}
                            placeholder="Select Manufacturer..."
                        />
                    </div>
                </div>

                {/* --- 2. DOCUMENTATION & IMAGERY (Z-30) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-[30]">
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bottle / Label Preview</h3>
                        </div>
                        <div className="aspect-video bg-black/40 rounded-2xl border-2 border-slate-800 flex items-center justify-center relative overflow-hidden group border-dashed hover:border-emerald-500/50 transition-all">
                            {formData.Stock_Image ? (
                                <img src={formData.Stock_Image} className="w-full h-full object-contain p-4" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
                                    <ImageIcon size={32} />
                                    <span className="text-[10px] font-black tracking-[0.2em]">UPLOAD ITEM PHOTO</span>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, 'Stock_Image')} />
                        </div>
                    </div>

                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FileIcon className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Safety & Technical Data</h3>
                        </div>
                        <div className="aspect-video bg-black/40 rounded-2xl border-2 border-slate-800 flex items-center justify-center relative overflow-hidden group border-dashed hover:border-emerald-500/50 transition-all">
                            {formData.Safety_Data_Sheet ? (
                                <div className="flex flex-col items-center gap-3 text-emerald-400">
                                    <FileIcon size={40} className="animate-pulse" />
                                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-center">SDS / CERTIFICATE<br/>ATTACHED</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
                                    <Upload size={32} />
                                    <span className="text-[10px] font-black tracking-[0.2em]">UPLOAD .PDF / .DOC</span>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'Safety_Data_Sheet')} />
                        </div>
                    </div>
                </div>

                {/* --- 3. INVENTORY & STORAGE (Z-20) --- */}
                <div className="bg-[#0f172a] p-10 rounded-3xl border border-slate-800 shadow-xl space-y-8 relative z-[20]">
                    <div className="flex items-center gap-2 mb-2">
                        <Box className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Logistics & Storage</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end relative">
                        <div className="lg:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Current Quantity</label>
                            <input
                                type="text"
                                value={formData.Available_Quantity}
                                onChange={e => setFormData({ ...formData, Available_Quantity: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-emerald-400 text-xl font-mono focus:border-emerald-500 outline-none shadow-inner"
                                placeholder="e.g. 5 kits"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Pack Size</label>
                            <input
                                type="text"
                                value={formData.Pack_Size}
                                onChange={e => setFormData({ ...formData, Pack_Size: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none shadow-inner"
                                placeholder="500ml / 1kg"
                            />
                        </div>
                        <RelationalSelect
                            label="Item Category"
                            endpoint="/lookup/stock-categories"
                            value={formData.Category}
                            onChange={(id) => setFormData({ ...formData, Category: id })}
                            placeholder="Select Category..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end relative">
                        <RelationalSelect
                            label="Storage Location (Area)"
                            endpoint="/lookup/freezers"
                            value={formData.Location_Area}
                            onChange={(id) => setFormData({ ...formData, Location_Area: id })}
                            placeholder="Select Area..."
                        />
                        <RelationalSelect
                            label="Storage Area (Final)"
                            endpoint="/lookup/freezers"
                            value={formData.Location_Area_final}
                            onChange={(id) => setFormData({ ...formData, Location_Area_final: id })}
                            placeholder="Review Location..."
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Specific Location Details</label>
                        <textarea
                            value={formData.Location_details}
                            onChange={e => setFormData({ ...formData, Location_details: e.target.value })}
                            rows={3}
                            placeholder="Shelf number, Bin ID, specific notes..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 outline-none transition-all shadow-inner text-sm italic"
                        />
                    </div>
                </div>

                {/* --- 4. DYNAMIC SCHEMA EXTENSIONS --- */}
                {dynamicFields.length > 0 && (
                    <div className="bg-[#0f172a] p-10 rounded-3xl border border-slate-800 shadow-xl space-y-8 relative">
                        <div className="flex items-center gap-2 mb-2">
                            <Plus className="w-4 h-4 text-indigo-400" />
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Extended Metadata</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                            {dynamicFields.map(col => (
                                <div key={col.key} className="relative group">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 pr-6">
                                        {col.label}
                                        <button type="button" onClick={() => handleRemoveField(col.key)} className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity"><X size={12} /></button>
                                    </label>
                                    {col.type === 'select' ? (
                                        <RelationalSelect 
                                            endpoint={col.isRelational ? col.endpoint : null}
                                            options={!col.isRelational ? col.options : null}
                                            value={formData[col.key]}
                                            onChange={(val) => setFormData({ ...formData, [col.key]: val })}
                                        />
                                    ) : col.type === 'image' ? (
                                        <div className="aspect-square bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                                            {formData[col.key] ? <img src={formData[col.key]} className="w-full h-full object-cover" /> : <ImageIcon className="opacity-20" size={20} />}
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, col.key)} />
                                        </div>
                                    ) : col.type === 'file' ? (
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center relative overflow-hidden group">
                                            <FileIcon size={16} className={`mx-auto mb-1 ${formData[col.key] ? 'text-indigo-400' : 'text-slate-600'}`} />
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{formData[col.key] ? 'ATTACHED' : 'UPLOAD'}</span>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, col.key)} />
                                        </div>
                                    ) : col.type === 'date' ? (
                                        <input type="date" value={formData[col.key] || ''} onChange={e => setFormData({ ...formData, [col.key]: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all" />
                                    ) : (
                                        <input type={col.type === 'number' ? 'number' : 'text'} value={formData[col.key] || ''} onChange={e => setFormData({ ...formData, [col.key]: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SUBMIT ACTIONS --- */}
                <div className="bg-[#0f172a] p-10 rounded-3xl border border-slate-800 shadow-2xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>
                    <div className="flex-1">
                        <AnimatePresence>
                            {success && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-emerald-400 font-bold bg-emerald-500/10 px-6 py-4 rounded-2xl w-fit border border-emerald-500/20 shadow-lg">
                                    <CheckCircle size={20} /> {success}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-rose-500 font-bold bg-rose-500/10 px-6 py-4 rounded-2xl w-fit border border-rose-500/20 shadow-lg">
                                    <AlertTriangle size={20} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-white/5">
                            <Info size={14} className="text-slate-500" />
                            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest leading-none pt-0.5">DB Mirror: ext_lab_stock</span>
                        </div>
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 text-slate-500 hover:text-white font-bold transition-all uppercase text-xs tracking-widest">Cancel</button>
                        <button type="submit" disabled={loading} className={`flex items-center gap-4 px-12 py-5 rounded-3xl font-black text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${loading ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-600/30'}`}>
                            {loading ? <Activity className="animate-spin" size={20} /> : <Save size={20} />}
                            <span className="uppercase tracking-widest text-xs">{loading ? 'Syncing Repository...' : 'Save Lab Stock'}</span>
                        </button>
                    </div>
                </div>

            </form>

            {/* --- ADD FIELD MODAL --- */}
            <AnimatePresence>
                {isFieldModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFieldModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#0f172a] border border-slate-800 rounded-3xl p-10 w-full max-w-md shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Evolve Stock Schema</h2>
                            <p className="text-xs text-slate-500 mb-8 font-mono uppercase tracking-widest opacity-60">MS Access Maintenance Mode &bull; Phase 171</p>
                            
                            <form onSubmit={handleAddField} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">New Clinical Key</label>
                                    <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-emerald-500 transition-all font-mono" placeholder="e.g. CAS_Number" autoFocus />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Metadata Type</label>
                                    <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-emerald-500 transition-all font-bold">
                                        <option value="text">Clinical Text</option>
                                        <option value="number">Numeric Metrics</option>
                                        <option value="date">Registry Date</option>
                                        <option value="image">Stock Imagery</option>
                                        <option value="file">Safety Document (.doc/.pdf)</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsFieldModalOpen(false)} className="flex-1 px-4 py-4 text-slate-500 font-bold hover:text-white transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
                                    <button type="submit" disabled={isAddingField} className="flex-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 px-8 shadow-xl shadow-emerald-600/20">
                                        {isAddingField ? <Activity className="animate-spin" size={18} /> : (isAddingField ? <Plus size={18} /> : <CheckCircle size={18} />)}
                                        <span className="uppercase text-[11px] tracking-widest">Deploy Field</span>
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

export default LabStockEntry;
