import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Save, FileText, Search, AlertTriangle, CheckCircle, 
    Database, Thermometer, MapPin, X, Activity, FlaskConical, Dna, Box, 
    Settings, Upload, Image as ImageIcon, File as FileIcon, Plus, Zap, Cpu
} from 'lucide-react';
import RelationalSelect from '../components/RelationalSelect';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Primers Library Modernization — Phase 169
 * 
 * Powered by Hybrid-Dynamic Clinical Engine v11.
 * Supports: 
 *  - Runtime Schema Evolution (Add any custom field via UI)
 *  - Native Media Persistence (Gels, Microscopy, Data Sheets)
 *  - Zero-Clipping Layered UX (Z-Index Hierarchy for Select overlaps)
 *  - 100% Functional Parity with MS Access 'Primers-details'
 */

const CORE_FIELDS = [
    'id', 'ID', 'Primer_Name', 'DNA_sequence', 'Purpose',
    'Binds_with_Phage_Bacteria_Plasmid', 'Phage', 'Bacteria', 'Plasmid',
    'Freezer', 'Freezer_Shelve', 'Box_detail', 'Location_in_Box',
    'Primer_Image', 'Attachment_File' // New Media Pillars
];

const PrimerEntry = () => {
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
        ID: '',
        Primer_Name: '',
        DNA_sequence: '',
        Purpose: '',
        Binds_with_Phage_Bacteria_Plasmid: '',
        Phage: '',
        Bacteria: '',
        Plasmid: '',
        Freezer: '',
        Freezer_Shelve: '',
        Box_detail: '',
        Location_in_Box: '',
        Primer_Image: null,
        Attachment_File: null
    });

    // --- Data Hydration ---
    const fetchInitialData = useCallback(async (existingId) => {
        setLoading(true);
        try {
            const [schemaRes, dataRes] = await Promise.all([
                api.get('/system/ext_primers_details/schema'),
                existingId ? api.get(`/system/ext_primers_details/${existingId}`) : Promise.resolve({ data: null })
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
            setError("Failed to link with Primers Repository.");
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
            // Cleanse payload
            Object.keys(payload).forEach(key => {
                if (payload[key] === '' || payload[key] === null) delete payload[key];
            });

            // CONFLICT CHECK
            if (payload.Box_detail && payload.Location_in_Box) {
                const checkRes = await api.get(`/inventory/check-slot?boxName=${encodeURIComponent(payload.Box_detail)}&positionCode=${encodeURIComponent(payload.Location_in_Box)}`);
                if (checkRes.data.success && checkRes.data.occupied) {
                    const occ = checkRes.data.assetDetails;
                    if (!(occ.source_table === 'ext_primers_details' && occ.asset_id === id)) {
                        const confirmMsg = `WARNING: Slot ${payload.Location_in_Box} in Box "${payload.Box_detail}" is already occupied by:\n` +
                                           `- ${occ.asset_label} (${occ.asset_type})\n\n` +
                                           `Do you want to REPLACE the existing item with this new primer?`;
                        if (!window.confirm(confirmMsg)) {
                            setLoading(false);
                            return;
                        }
                        payload._conflictResolution = { previousOccupant: occ };
                    }
                }
            }

            if (id) {
                await api.put(`/system/ext_primers_details/${id}`, payload);
                setSuccess("Primer Metadata Synchronized.");
            } else {
                const res = await api.post('/system/ext_primers_details', payload);
                setFormData(prev => ({ ...prev, id: res.data.record.id }));
                setSuccess("Primer Successfully Registered.");
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
            await api.post('/system/ext_primers_details/add-column', {
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
            await api.post('/system/ext_primers_details/delete-column', { columnName });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field deletion failed.");
        }
    };

    const dynamicFields = schema.filter(col => !CORE_FIELDS.includes(col.key));

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
            
            {/* HEADER (Phase 169 Modernization) */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6 flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                        <Activity className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Primers Library</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Hybrid-Dynamic Clinical Engine &bull; Phase 169</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFieldModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition-all"
                    >
                        <Settings size={14} className="text-amber-400" /> Manage Fields
                    </button>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- 1. MOLECULAR IDENTITY (Z-40 for Selects) --- */}
                <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative z-[40]">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-amber-400" />
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Primer Designation</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end font-medium">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Internal ID</label>
                            <input type="text" value={formData.id || "(Auto)"} readOnly className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-600 font-mono text-xs cursor-not-allowed outline-none shadow-inner" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Legacy ID</label>
                            <input type="text" value={formData.ID} onChange={e => setFormData({ ...formData, ID: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all text-sm font-mono" placeholder="Old mapping ID..." />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Primer Name</label>
                            <input type="text" value={formData.Primer_Name} onChange={e => setFormData({ ...formData, Primer_Name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all text-sm font-bold" placeholder="e.g. 27F-Phage" />
                        </div>
                        <div className="lg:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Purpose / Application</label>
                            <input type="text" value={formData.Purpose} onChange={e => setFormData({ ...formData, Purpose: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all text-sm" placeholder="e.g. 16S rRNA identification..." />
                        </div>
                    </div>
                </div>

                {/* --- 2. BIOLOGICAL TARGETS & BINDING (Z-30) --- */}
                <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative z-[30]">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Binding Specificity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end font-medium">
                        <RelationalSelect label="Binds With" endpoint="/lookup/primer-binding-types" value={formData.Binds_with_Phage_Bacteria_Plasmid} onChange={val => setFormData({ ...formData, Binds_with_Phage_Bacteria_Plasmid: val })} />
                        <RelationalSelect label="Phage Target" endpoint="/lookup/phages" value={formData.Phage} onChange={val => setFormData({ ...formData, Phage: val })} />
                        <RelationalSelect label="Bacteria Target" endpoint="/lookup/bacteria" value={formData.Bacteria} onChange={val => setFormData({ ...formData, Bacteria: val })} />
                        <RelationalSelect label="Plasmid Target" endpoint="/lookup/plasmids" value={formData.Plasmid} onChange={val => setFormData({ ...formData, Plasmid: val })} />
                    </div>
                </div>

                {/* --- 3. LOGISTICS & STORAGE (Z-20) --- */}
                <div className="bg-amber-600/[0.03] p-8 rounded-3xl border border-amber-500/10 shadow-xl space-y-6 relative z-[20]">
                    <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="w-4 h-4 text-amber-400" />
                        <h3 className="text-[11px] font-black text-amber-300 uppercase tracking-widest">Inventory & Storage</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end font-medium">
                        <RelationalSelect label="Freezer" endpoint="/lookup/freezers" value={formData.Freezer} onChange={val => setFormData({ ...formData, Freezer: val })} />
                        <RelationalSelect label="Freezer Shelf" endpoint="/lookup/racks" value={formData.Freezer_Shelve} onChange={val => setFormData({ ...formData, Freezer_Shelve: val })} />
                        <RelationalSelect label="Box Detail" endpoint="/lookup/boxes" value={formData.Box_detail} onChange={val => setFormData({ ...formData, Box_detail: val })} />
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Location in Box</label>
                            <input type="text" value={formData.Location_in_Box} onChange={e => setFormData({ ...formData, Location_in_Box: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all text-sm font-mono" placeholder="Col/Row..." />
                        </div>
                    </div>
                </div>

                {/* --- 4. MEDIA & SEQUENCE --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Sequence Box */}
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu className="w-4 h-4 text-amber-400" />
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sequence Definition</h3>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">DNA Sequence (5' - 3')</label>
                            <textarea rows="6" value={formData.DNA_sequence} onChange={e => setFormData({ ...formData, DNA_sequence: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-emerald-400 font-mono text-sm tracking-widest focus:border-amber-500 outline-none transition-all shadow-inner resize-none" placeholder="GATTACA..." />
                        </div>
                    </div>

                    {/* Media Matrix */}
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Media & Attachments</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Binding Image</label>
                                <div className="aspect-video bg-black/40 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden group cursor-pointer border-dashed hover:border-amber-500/50 transition-all">
                                    {formData.Primer_Image ? (
                                        <img src={formData.Primer_Image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-40">
                                            <ImageIcon size={24} />
                                            <span className="text-[10px] font-bold">DROP IMAGE</span>
                                        </div>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, 'Primer_Image')} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Technical Data</label>
                                <div className="aspect-video bg-black/40 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden group cursor-pointer border-dashed hover:border-amber-500/50 transition-all">
                                    {formData.Attachment_File ? (
                                        <div className="flex flex-col items-center gap-2 text-emerald-400">
                                            <FileIcon size={32} />
                                            <span className="text-[10px] font-bold uppercase">FILE ATTACHED</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-40 text-slate-500">
                                            <Upload size={24} />
                                            <span className="text-[10px] font-bold uppercase">UPLOAD PDF/DOC</span>
                                        </div>
                                    )}
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'Attachment_File')} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 5. DYNAMIC SCHEMA EXTENSIONS --- */}
                {dynamicFields.length > 0 && (
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Custom Clinical Metadata</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
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
                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{formData[col.key] ? 'FILE ATTACHED' : 'UPLOAD'}</span>
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, col.key)} />
                                        </div>
                                    ) : col.type === 'date' ? (
                                        <input type="date" value={formData[col.key] || ''} onChange={e => setFormData({ ...formData, [col.key]: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white" />
                                    ) : (
                                        <input type={col.type === 'number' ? 'number' : 'text'} value={formData[col.key] || ''} onChange={e => setFormData({ ...formData, [col.key]: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- SUBMIT ACTIONS --- */}
                <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none"></div>
                    <div className="flex-1">
                        <AnimatePresence>
                            {success && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-emerald-400 font-bold bg-emerald-500/10 px-6 py-3 rounded-2xl w-fit border border-emerald-500/20 shadow-lg">
                                    <CheckCircle size={18} /> {success}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 text-rose-500 font-bold bg-rose-500/10 px-6 py-3 rounded-2xl w-fit border border-rose-500/20 shadow-lg">
                                    <AlertTriangle size={18} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                        <button type="button" onClick={() => navigate(-1)} className="px-6 py-4 text-slate-500 hover:text-white font-bold transition-all uppercase text-xs tracking-widest">Cancel</button>
                        <button type="submit" disabled={loading} className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-slate-950 shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${loading ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-500/20'}`}>
                            {loading ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
                            <span className="uppercase tracking-widest text-[11px]">{loading ? 'Saving Repository...' : 'Register Primer'}</span>
                        </button>
                    </div>
                </div>

            </form>

            {/* --- ADD FIELD MODAL --- */}
            <AnimatePresence>
                {isFieldModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFieldModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-[#0f172a] border border-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-2">Evolve Schema</h2>
                            <p className="text-xs text-slate-400 mb-6 font-mono uppercase tracking-widest opacity-60">MS Access Maintenance Mode</p>
                            
                            <form onSubmit={handleAddField} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Field Name</label>
                                    <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-all font-mono" placeholder="e.g. Melting_Temp" autoFocus />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">Data Type</label>
                                    <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition-all">
                                        <option value="text">Short Text</option>
                                        <option value="number">Numeric</option>
                                        <option value="date">Date/Time</option>
                                        <option value="image">Microscopy Image</option>
                                        <option value="file">Clinical Attachment (.doc/.pdf)</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsFieldModalOpen(false)} className="flex-1 px-4 py-3 text-slate-500 font-bold hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" disabled={isAddingField} className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                        {isAddingField ? <Activity className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                        DEPLOY FIELD
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

export default PrimerEntry;
