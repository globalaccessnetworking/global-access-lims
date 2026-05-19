import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Save, Disc, Search, AlertTriangle, CheckCircle, 
    Database, Thermometer, MapPin, X, Activity, FlaskConical, Dna, Box, 
    Settings, Upload, Image as ImageIcon, File as FileIcon, Plus, Zap, Cpu
} from 'lucide-react';
import RelationalSelect from '../components/RelationalSelect';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Antibiotic Discs Library Modernization — Phase 170
 * 
 * Powered by Hybrid-Dynamic Clinical Engine v11.
 * Supports: 
 *  - Runtime Schema Evolution (Add any custom field via UI)
 *  - Native Media Persistence (Photos, Data Sheets, Potency Certificates)
 *  - Zero-Clipping Layered UX (Z-Index Hierarchy for Select overlaps)
 *  - 100% Functional Parity with MS Access 'Available Antibiotics Discs'
 */

const CORE_FIELDS = [
    'id', 'Antibiotic_Disc', 'Quntity', 
    'Disc_Image', 'Data_Sheet_File' // New Media Pillars
];

const AntibioticsDiscsEntry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [schema, setSchema] = useState([]);
    
    // Schema Evolution State
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [isAddingField, setIsAddingField] = useState(false);
    const [newField, setNewField] = useState({ name: '', type: 'text' });

    const [formData, setFormData] = useState({
        id: null,
        Antibiotic_Disc: '',
        Quntity: '', // Spelled as in DB for mapping
        Disc_Image: null,
        Data_Sheet_File: null
    });

    // --- Data Hydration ---
    const fetchInitialData = useCallback(async (existingId) => {
        setLoading(true);
        try {
            const [schemaRes, dataRes] = await Promise.all([
                api.get('/system/available_antibiotic_discs/schema'),
                existingId ? api.get(`/system/available_antibiotic_discs/${existingId}`) : Promise.resolve({ data: null })
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
            setError("Failed to link with Antibiotic Discs Repository.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const id = searchParams.get('id');
        fetchInitialData(id);
    }, [searchParams, fetchInitialData]);

    // --- Business Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { id, ...payload } = formData;
            if (id) {
                await api.put(`/system/available_antibiotic_discs/${id}`, payload);
                setSuccess("Disc Metadata Synchronized.");
            } else {
                const res = await api.post('/system/available_antibiotic_discs', payload);
                setFormData(prev => ({ ...prev, id: res.data.record.id }));
                setSuccess("Antibiotic Disc Registered.");
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
            await api.post('/system/available_antibiotic_discs/add-column', {
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
            await api.post('/system/available_antibiotic_discs/delete-column', { columnName });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field deletion failed.");
        }
    };

    const dynamicFields = schema.filter(col => !CORE_FIELDS.includes(col.key));

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
            
            {/* HEADER (Phase 170 Modernization) */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6 flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
                        <Disc className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Antibiotic Discs Registry</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Hybrid-Dynamic Clinical Engine &bull; Phase 170</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFieldModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition-all"
                    >
                        <Settings size={14} className="text-rose-400" /> Manage Fields
                    </button>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- 1. SCIENTIFIC IDENTITY (Z-40 for Selects) --- */}
                <div className="bg-[#0f172a] p-10 rounded-3xl border border-slate-800 shadow-xl space-y-8 relative z-[40]">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-rose-400" />
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Disc Identification</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end">
                        <div className="lg:col-span-2">
                            <RelationalSelect 
                                label="Antibiotic Molecule" 
                                endpoint="/lookup/antibiotics" 
                                value={formData.Antibiotic_Disc} 
                                onChange={id => setFormData({ ...formData, Antibiotic_Disc: id })} 
                                placeholder="Select antibiotic..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Inventory ID</label>
                            <input type="text" value={formData.id || "(Auto)"} readOnly className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-600 font-mono text-xs cursor-not-allowed outline-none shadow-inner" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-950/50 p-6 rounded-2xl border border-white/5">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Current Quantity</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.Quntity}
                                    onChange={e => setFormData({ ...formData, Quntity: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700/50 rounded-2xl px-6 py-5 text-white text-3xl font-mono focus:border-rose-500 outline-none transition-all shadow-inner group-hover:border-rose-500/30"
                                    placeholder="0"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-black text-xs uppercase tracking-widest pointer-events-none group-hover:text-rose-500/50 transition-colors">Individual Discs</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-rose-400 font-bold text-[10px] uppercase tracking-widest">
                                <AlertTriangle size={14} /> Clinical Note
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                Ensure real-time stock synchronization. Legacy MS Access mapping <span className="text-rose-500/50 font-mono">'Quntity'</span> is maintained for 100% data integrity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- 2. MEDIA & DOCUMENTATION --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-rose-400" />
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Label / Imagery</h3>
                        </div>
                        <div className="aspect-video bg-black/40 rounded-2xl border-2 border-slate-800 flex items-center justify-center relative overflow-hidden group border-dashed hover:border-rose-500/50 transition-all">
                            {formData.Disc_Image ? (
                                <img src={formData.Disc_Image} className="w-full h-full object-contain p-4" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
                                    <ImageIcon size={32} />
                                    <span className="text-[10px] font-black tracking-[0.2em]">UPLOAD DISC SCAN</span>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, 'Disc_Image')} />
                        </div>
                    </div>

                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FileIcon className="w-4 h-4 text-rose-400" />
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Technical Data Sheets</h3>
                        </div>
                        <div className="aspect-video bg-black/40 rounded-2xl border-2 border-slate-800 flex items-center justify-center relative overflow-hidden group border-dashed hover:border-rose-500/50 transition-all">
                            {formData.Data_Sheet_File ? (
                                <div className="flex flex-col items-center gap-3 text-rose-400">
                                    <FileIcon size={40} className="animate-pulse" />
                                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">DOCUMENT ATTACHED</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
                                    <Upload size={32} />
                                    <span className="text-[10px] font-black tracking-[0.2em]">UPLOAD .PDF / .DOC</span>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'Data_Sheet_File')} />
                        </div>
                    </div>
                </div>

                {/* --- 3. DYNAMIC SCHEMA EXTENSIONS --- */}
                {dynamicFields.length > 0 && (
                    <div className="bg-[#0f172a] p-10 rounded-3xl border border-slate-800 shadow-xl space-y-8 relative z-[20]">
                        <div className="flex items-center gap-2 mb-2">
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Dynamic Inventory Metadata</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                            {dynamicFields.map(col => (
                                <div key={col.key} className="relative group">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 pr-6">
                                        {col.label}
                                        <button onClick={() => handleRemoveField(col.key)} className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity"><X size={12} /></button>
                                    </label>
                                    {col.type === 'select' ? (
                                        <RelationalSelect 
                                            endpoint={col.isRelational ? col.endpoint : null}
                                            options={!col.isRelational ? col.options : null}
                                            value={formData[col.key]}
                                            onChange={(val) => setFormData({ ...formData, [col.key]: val })}
                                        />
                                    ) : col.type === 'image' ? (
                                        <div className="aspect-square bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                                            {formData[col.key] ? <img src={formData[col.key]} className="w-full h-full object-cover" /> : <ImageIcon className="opacity-20" size={20} />}
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, col.key)} />
                                        </div>
                                    ) : col.type === 'file' ? (
                                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center relative overflow-hidden group">
                                            <FileIcon size={16} className={`mx-auto mb-1 ${formData[col.key] ? 'text-emerald-400' : 'text-slate-600'}`} />
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{formData[col.key] ? 'ATTACHED' : 'UPLOAD'}</span>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, col.key)} />
                                        </div>
                                    ) : col.type === 'date' ? (
                                        <input type="date" value={formData[col.key] || ''} onChange={e => setFormData({ ...formData, [col.key]: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all" />
                                    ) : (
                                        <input type={col.type === 'number' ? 'number' : 'text'} value={formData[col.key] || ''} onChange={e => setFormData({ ...formData, [col.key]: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SUBMIT ACTIONS --- */}
                <div className="bg-[#0f172a] p-10 rounded-3xl border border-slate-800 shadow-2xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent pointer-events-none"></div>
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
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 text-slate-500 hover:text-white font-bold transition-all uppercase text-xs tracking-widest">Cancel</button>
                        <button type="submit" disabled={loading} className={`flex items-center gap-4 px-12 py-5 rounded-3xl font-black text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${loading ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-gradient-to-br from-rose-600 to-pink-600 shadow-rose-600/30'}`}>
                            {loading ? <Activity className="animate-spin" size={20} /> : <Save size={20} />}
                            <span className="uppercase tracking-widest text-xs">{loading ? 'Syncing Repository...' : 'Save Antibiotic Disc'}</span>
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
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Evolve Inventory Schema</h2>
                            <p className="text-xs text-slate-500 mb-8 font-mono uppercase tracking-widest opacity-60">MS Access Maintenance Mode &bull; Phase 170</p>
                            
                            <form onSubmit={handleAddField} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Custom Field Name</label>
                                    <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-rose-500 transition-all font-mono" placeholder="e.g. Expiry_Date" autoFocus />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Data Type</label>
                                    <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none focus:border-rose-500 transition-all font-bold">
                                        <option value="text">Clinical Text</option>
                                        <option value="number">Numeric Count</option>
                                        <option value="date">Registry Date</option>
                                        <option value="image">Potency Imagery</option>
                                        <option value="file">Technical Attachment (.doc/.pdf)</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsFieldModalOpen(false)} className="flex-1 px-4 py-4 text-slate-500 font-bold hover:text-white transition-colors uppercase text-[10px] tracking-widest">Cancel</button>
                                    <button type="submit" disabled={isAddingField} className="flex-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 px-8 shadow-xl shadow-rose-600/20">
                                        {isAddingField ? <Activity className="animate-spin" size={18} /> : <CheckCircle size={18} />}
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

export default AntibioticsDiscsEntry;
