import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Save, Microscope, CheckCircle, AlertTriangle, Database, X, 
    Activity, FlaskConical, Zap, Box, Thermometer, Upload, Trash2, Camera, Eye, Settings, Plus, FileText, Image as ImageIcon
} from 'lucide-react';
import RelationalSelect from '../components/RelationalSelect';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Host Bacteria Entry — Phase 166
 * 
 * HYBRID-DYNAMIC ARCHITECTURE:
 * 1. Restores the missing MS Access 'Host Bacteria' module.
 * 2. Matches clinical rigor of Phages/Strains registries.
 * 3. Supports Advanced Media & Structural Schema Evolution.
 * 4. Zero-Clipping Layout (Phase 164 Stabilized).
 */
const HostBacteriaEntry = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [schema, setSchema] = useState([]);
    
    // Field Manager Modal State
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [newField, setNewField] = useState({ name: '', type: 'text' });
    const [isAddingField, setIsAddingField] = useState(false);

    // Core Clinical Fields (MS Access Parity)
    const CORE_FIELDS = [
        'id', 'ID', 'Host_Bacteria_No', 'Specie', 'Wild_type_Recom', 
        'Researcher', 'Date_of_Storage', 'Glycerol_Stock_tube_label', 
        'GS_Freezer_Number', 'GS_Rack_Number', 'GS_Box_details', 
        'Location_in_Box_GS', 'Notes', 'Picture'
    ];

    const initialForm = {
        id: null,
        ID: '',
        Host_Bacteria_No: '',
        Specie: '',
        Wild_type_Recom: '',
        Researcher: '',
        Date_of_Storage: new Date().toISOString().split('T')[0],
        Glycerol_Stock_tube_label: '',
        GS_Freezer_Number: '',
        GS_Rack_Number: '',
        GS_Box_details: '',
        Location_in_Box_GS: '',
        Notes: '',
        Picture: ''
    };

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        const id = searchParams.get('id');
        fetchInitialData(id);
    }, [searchParams]);

    const fetchInitialData = async (id) => {
        setLoading(true);
        try {
            // 1. Fetch Dynamic Schema
            const schemaRes = await api.get('/system/ext_host_bacteria/schema');
            if (schemaRes.data.schema) {
                setSchema(schemaRes.data.schema);
                const extendedForm = { ...initialForm };
                schemaRes.data.schema.forEach(col => {
                    if (!CORE_FIELDS.includes(col.key)) extendedForm[col.key] = '';
                });
                setFormData(extendedForm);
            }

            // 2. Hydrate Record
            if (id) {
                const res = await api.get(`/system/ext_host_bacteria/${id}`);
                if (res.data) {
                    setFormData(prev => ({ 
                        ...prev, 
                        ...res.data, 
                        id: res.data.id,
                        Date_of_Storage: res.data.Date_of_Storage ? res.data.Date_of_Storage.split('T')[0] : ''
                    }));
                }
            }
        } catch (err) {
            console.error("Host initialization failed", err);
            setError("Could not load host bacteria data.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { id, ...payload } = formData;
            
            // Cleanup empty fields
            Object.keys(payload).forEach(key => {
                if (payload[key] === '' || payload[key] === null) delete payload[key];
            });

            if (id) {
                await api.put(`/system/ext_host_bacteria/${id}`, payload);
                setSuccess(`Host Record Updated Successfully.`);
            } else {
                const res = await api.post('/system/ext_host_bacteria', payload);
                setSuccess(`New Host Registered! ID: ${res.data.id || 'new'}.`);
                setFormData({ ...initialForm, id: null });
            }
            
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || "Submission failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, [key]: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleAddField = async (e) => {
        e.preventDefault();
        if (!newField.name) return;
        setIsAddingField(true);
        try {
            await api.post('/system/ext_host_bacteria/add-column', {
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
        if (!window.confirm(`PERMANENT ACTION: Delete clinical field '${columnName}'?`)) return;
        try {
            await api.post('/system/ext_host_bacteria/delete-column', { columnName });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field deletion failed.");
        }
    };

    const dynamicFields = schema.filter(col => !CORE_FIELDS.includes(col.key));

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
            
            {/* HEADER (Phase 166) */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6 flex justify-between items-center relative transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                        <Microscope className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Host Bacteria Registry</h1>
                        <p className="text-xs text-slate-500 uppercase font-mono tracking-widest mt-0.5">Clinical Infrastructure (Phase 166)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFieldModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition-all"
                    >
                        <Settings size={14} className="text-blue-400" /> Manage Fields
                    </button>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- 1. IDENTITY & TAXONOMY (Layer 40) --- */}
                <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative z-[40]">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Host Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end font-medium">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Strain No (Clinical)</label>
                            <input type="text" value={formData.Host_Bacteria_No} onChange={e => setFormData({ ...formData, Host_Bacteria_No: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all text-sm font-bold" placeholder="e.g. HB-99" required />
                        </div>
                        <RelationalSelect label="Species" endpoint="/lookup/species" value={formData.Specie} onChange={(id) => setFormData({ ...formData, Specie: id })} />
                        <RelationalSelect label="Host Type" endpoint="/lookup/wild-type-recomb" value={formData.Wild_type_Recom} onChange={(id) => setFormData({ ...formData, Wild_type_Recom: id })} />
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Researcher</label>
                            <input type="text" value={formData.Researcher} onChange={e => setFormData({ ...formData, Researcher: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all text-sm" placeholder="In-charge name..." />
                        </div>
                    </div>
                </div>

                {/* --- 2. STORAGE (GLYCEROL & DOCUMENTATION) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-medium">
                    
                    {/* Glycerol Storage (Layer 30) */}
                    <div className="lg:col-span-2 bg-[#0b1221] rounded-3xl border border-blue-500/20 shadow-xl relative z-[30]">
                        <div className="bg-blue-600/10 px-6 py-4 border-b border-blue-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Thermometer className="w-4 h-4 text-blue-400" />
                                <h3 className="text-[11px] font-black text-blue-300 uppercase tracking-widest">Glycerol Stock Details</h3>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Glycerol Stock tube label</label>
                                <input type="text" value={formData.Glycerol_Stock_tube_label} onChange={e => setFormData({ ...formData, Glycerol_Stock_tube_label: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
                            </div>
                            <RelationalSelect label="GS Freezer" endpoint="/lookup/freezers" value={formData.GS_Freezer_Number} onChange={(id) => setFormData({ ...formData, GS_Freezer_Number: id })} />
                            <RelationalSelect label="GS Rack" endpoint="/lookup/racks" value={formData.GS_Rack_Number} onChange={(id) => setFormData({ ...formData, GS_Rack_Number: id })} />
                            <RelationalSelect label="GS Box Detail" endpoint="/lookup/boxes" value={formData.GS_Box_details} onChange={(id) => setFormData({ ...formData, GS_Box_details: id })} />
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">GS Position</label>
                                <input type="text" value={formData.Location_in_Box_GS} onChange={e => setFormData({ ...formData, Location_in_Box_GS: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-blue-300 text-sm font-mono shadow-inner" placeholder="Row/Col..." />
                            </div>
                        </div>
                    </div>

                    {/* Metadata & Media Loop */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-[#0f172a] rounded-3xl border border-white/5 shadow-2xl p-6 relative z-[20]">
                             <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                                <Plus className="w-4 h-4 text-blue-400" />
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Additional Metadata</h3>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {dynamicFields.length === 0 ? (
                                    <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-8 border-2 border-dashed border-white/5 rounded-2xl">No custom metadata.<br/>Use "Manage Fields".</p>
                                ) : (
                                    dynamicFields.map(field => (
                                        <div key={field.key} className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 relative group/field animate-fade-in-right">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    {field.type === 'image' && <ImageIcon size={12} className="text-blue-400" />}
                                                    {field.type === 'file' && <FileText size={12} className="text-blue-400" />}
                                                    {field.label}
                                                </label>
                                                <button type="button" onClick={() => handleRemoveField(field.key)} className="opacity-0 group-hover/field:opacity-100 p-1 hover:bg-rose-500/10 text-rose-500 rounded transition-all"><Trash2 size={12} /></button>
                                            </div>
                                            {(field.type === 'image' || field.type === 'file') ? (
                                                <div className="space-y-3">
                                                    {formData[field.key] ? (
                                                        <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-blue-500/20">
                                                            <div className="flex items-center gap-3">
                                                                {field.type === 'image' ? ( <img src={formData[field.key]} className="w-10 h-10 rounded object-cover border border-white/10" /> ) : ( <FileText className="w-8 h-8 text-blue-400/50" /> )}
                                                                <span className="text-[10px] text-blue-400 font-bold uppercase truncate max-w-[80px]">Attached</span>
                                                            </div>
                                                            <button onClick={() => setFormData({ ...formData, [field.key]: '' })} className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-md"><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <label className="group flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-800 rounded-2xl hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer transition-all">
                                                            <Upload className="w-5 h-5 text-slate-700 group-hover:text-blue-400 mb-1" />
                                                            <span className="text-[9px] text-slate-600 font-bold uppercase">Click to Create {field.type}</span>
                                                            <input type="file" className="hidden" accept={field.type === 'image' ? 'image/*' : '.pdf,.doc,.docx'} onChange={(e) => handleFileUpload(e, field.key)} />
                                                        </label>
                                                    )}
                                                </div>
                                            ) : (
                                                <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-blue-500" placeholder={`Enter ${field.label}...`} />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. MICROSCOPY & CLINICAL NOTES --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#0f172a] rounded-3xl border border-slate-800 shadow-xl p-8 space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <Camera className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Host Characterization</h3>
                        </div>
                        <div className="relative group aspect-video bg-slate-950 rounded-3xl border-2 border-dashed border-slate-800 hover:border-blue-500/50 transition-all flex flex-col items-center justify-center overflow-hidden">
                            {formData.Picture ? (
                                <>
                                    <img src={formData.Picture} alt="Microscopy" className="w-full h-full object-contain p-4" />
                                    <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button type="button" onClick={() => setFormData({ ...formData, Picture: '' })} className="p-3 bg-rose-500/20 text-rose-500 rounded-full border border-rose-500/30 hover:bg-rose-500 transition-all"><Trash2 size={20} /></button>
                                        <div className="p-3 bg-blue-500/20 text-blue-500 rounded-full border border-blue-500/30"><Eye size={20} /></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 bg-slate-900 rounded-2xl mb-4 group-hover:scale-110 transition-transform"><Camera className="text-slate-600" /></div>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter text-center">Click to Upload Host Picture<br/>(Microscopy/Gram-Stain)</p>
                                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'Picture')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#0f172a] rounded-3xl border border-slate-800 shadow-xl p-8 space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Clinical Notes</h3>
                        </div>
                        <textarea rows="8" value={formData.Notes} onChange={e => setFormData({ ...formData, Notes: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-blue-500 outline-none transition-all resize-none shadow-inner text-sm" placeholder="Sensitivity, lytic profiling, growth conditions..." />
                    </div>
                </div>

                {/* --- FOOTER (Staging Zone) --- */}
                <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm">
                    <div className="flex-1 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                        <AnimatePresence>
                            {success && ( <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-400 font-black"> <CheckCircle size={18} /> {success} </motion.div> )}
                            {error && ( <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-rose-500 font-black"> <AlertTriangle size={18} /> {error} </motion.div> )}
                        </AnimatePresence>
                        {!success && !error && `Host Bacteria Registry Stabilized • Phase 166`}
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className={`flex items-center gap-2 px-12 py-3.5 rounded-2xl font-black text-white shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'}`}>
                            {loading ? <Activity className="animate-spin" size={18} /> : (formData.id ? <Database size={18} /> : <Save size={18} />)}
                            {loading ? 'Processing...' : (formData.id ? 'Update Host' : 'Register Host')}
                        </button>
                    </div>
                </div>
            </form>

            {/* FIELD MANAGER MODAL */}
            <AnimatePresence>
                {isFieldModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"> <Plus size={16} className="text-blue-400" /> New Host Attribute</h3>
                                <button onClick={() => setIsFieldModalOpen(false)}><X size={18} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleAddField} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-black">Attribute Name</label>
                                    <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} placeholder="e.g. Sensitivity_Level" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 font-bold" required />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['text', 'number', 'date', 'image', 'file'].map(type => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => setNewField({ ...newField, type })}
                                            className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${newField.type === type ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-500'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" disabled={isAddingField} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95 disabled:bg-slate-700">
                                    {isAddingField ? 'Refactoring Registry...' : 'Add to Host Engine'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HostBacteriaEntry;
