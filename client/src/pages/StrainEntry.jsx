import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Save, Microscope, Search, AlertTriangle, CheckCircle, Database, 
    Thermometer, MapPin, X, Activity, Beaker, Plus, Settings,
    FileText, Image as ImageIcon, Trash2, Upload
} from 'lucide-react';
import RelationalSelect from '../components/RelationalSelect';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Bacterial Strains Entry Form — Phase 163
 * 
 * HYBRID-DYNAMIC ARCHITECTURE:
 * 1. Matches MS Access "High-Fidelity" layout for Core Clinical Sections (GD/GS).
 * 2. Automatically renders "Additional Research Metadata" for custom user-added fields.
 * 3. Supports Image and File Uploads (serialized to Base64) with Identity Preservation.
 * 4. Allows researchers to permanently manage schema directly from the UI.
 */
const StrainEntry = () => {
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

    // Core "Fixed" Fields for Layout Filtering (Identified from MS Access source of truth)
    const CORE_FIELDS = [
        'id', 'Strain_No', 'Specie', 'Wild_type_Recom', 'Genomic_DNA_tube_Label', 
        'GD_Freezer_Number', 'GD_Rack_Number', 'GD_Box_detail', 'Loction_in_Box_PD',
        'Glycerol_Stock_tube_label', 'GS_Freezer_Number', 'GS_Rack_Number', 
        'GS_Box_details', 'Location_in_Box_GS', 'Antibiotic_sensitivity', 
        'Antibiotic_resistance', 'Detail_of_Bacterial_Strain'
    ];

    const initialForm = {
        id: null,
        Strain_No: '',
        Specie: '',
        Wild_type_Recom: '',
        Genomic_DNA_tube_Label: '',
        GD_Freezer_Number: '',
        GD_Rack_Number: '',
        GD_Box_detail: '',
        Loction_in_Box_PD: '',
        Glycerol_Stock_tube_label: '',
        GS_Freezer_Number: '',
        GS_Rack_Number: '',
        GS_Box_details: '',
        Location_in_Box_GS: '',
        Antibiotic_sensitivity: '',
        Antibiotic_resistance: '',
        Detail_of_Bacterial_Strain: ''
    };

    const [formData, setFormData] = useState(initialForm);

    // Initial Hydration & Schema Fetch
    useEffect(() => {
        const id = searchParams.get('id');
        fetchInitialData(id);
    }, [searchParams]);

    const fetchInitialData = async (id) => {
        setLoading(true);
        try {
            // 1. Fetch Schema to know about custom fields (Phase 163 Dynamic Engine)
            const schemaRes = await api.get('/system/ext_bacterial_strains/schema');
            if (schemaRes.data.schema) {
                setSchema(schemaRes.data.schema);
                // Dynamically append any non-core fields to initial state
                const extendedForm = { ...initialForm };
                schemaRes.data.schema.forEach(col => {
                    if (!CORE_FIELDS.includes(col.key)) {
                        extendedForm[col.key] = '';
                    }
                });
                setFormData(extendedForm);
            }

            // 2. Hydrate data if editing
            if (id) {
                const res = await api.get(`/system/ext_bacterial_strains/${id}`);
                if (res.data) {
                    setFormData(prev => ({ ...prev, ...res.data, id: res.data.id }));
                }
            }
        } catch (err) {
            console.error("Initialization failed", err);
            setError("Could not load module data.");
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
            
            // Cleanse payload (convert empty strings to null for consistent DB state)
            Object.keys(payload).forEach(key => {
                if (payload[key] === '' || payload[key] === null || payload[key] === undefined) delete payload[key];
            });

            if (id) {
                await api.put(`/system/ext_bacterial_strains/${id}`, payload);
                setSuccess(`Strain Updated Successfully.`);
            } else {
                const res = await api.post('/system/ext_bacterial_strains', payload);
                setSuccess(`Success! Recorded Strain as ID ${res.data.id || 'new'}.`);
                setFormData({ ...initialForm, id: null });
            }
            
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || "Submission failed.");
        } finally {
            setLoading(false);
        }
    };

    // --- Media Manager (Phase 163) ---
    const handleFileUpload = (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, [key]: reader.result });
        };
        reader.readAsDataURL(file);
    };

    // --- Schema Evolution (Dynamic Engine) ---
    const handleAddField = async (e) => {
        e.preventDefault();
        if (!newField.name) return;
        setIsAddingField(true);
        try {
            await api.post('/system/ext_bacterial_strains/add-column', {
                columnName: newField.name.trim().replace(/\s+/g, '_'),
                type: newField.type
            });
            setIsFieldModalOpen(false);
            setNewField({ name: '', type: 'text' });
            fetchInitialData(formData.id); // Refresh schema & preservation tags
        } catch (err) {
            alert("Field creation failed: " + (err.response?.data?.error || err.message));
        } finally {
            setIsAddingField(false);
        }
    };

    const handleRemoveField = async (columnName) => {
        const displayLabel = columnName.replace(/_/g, ' ');
        if (!window.confirm(`PERMANENT ACTION: Are you sure you want to delete the field '${displayLabel}'? All clinical data for ALL strains in this column will be lost.`)) return;
        try {
            await api.post('/system/ext_bacterial_strains/delete-column', { columnName });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field deletion failed: " + (err.response?.data?.error || err.message));
        }
    };

    const dynamicFields = schema.filter(col => !CORE_FIELDS.includes(col.key));

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
            
            {/* HEADER (Phase 163 Upgrade) */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6 flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                        <Microscope className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Bacterial Strains Registry</h1>
                        <p className="text-xs text-slate-500 uppercase font-mono tracking-widest mt-0.5 pointer-events-none">Hybrid-Dynamic Engine (Phase 164)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFieldModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition-all"
                    >
                        <Settings size={14} className="text-emerald-400" /> Manage Fields
                    </button>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- 1. IDENTITY & CLASSIFICATION (Top Layer 40) --- */}
                <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative z-[40]">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Strain Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end font-medium">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Internal ID</label>
                            <input type="text" value={formData.id || "(New)"} readOnly className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 font-mono text-xs cursor-not-allowed outline-none shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Strain No</label>
                            <input type="text" value={formData.Strain_No} onChange={e => setFormData({ ...formData, Strain_No: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all text-sm" placeholder="e.g. MSTA-44" />
                        </div>
                        <RelationalSelect label="Species" endpoint="/lookup/species" value={formData.Specie} onChange={(id) => setFormData({ ...formData, Specie: id })} />
                        <RelationalSelect label="Wild-type/Recom" endpoint="/lookup/wild-type-recomb" value={formData.Wild_type_Recom} onChange={(id) => setFormData({ ...formData, Wild_type_Recom: id })} />
                    </div>
                </div>

                {/* --- 2. STORAGE (DNA & GLYCEROL) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* DNA Storage Container (z-indexing for clipping fix) */}
                    <div className="bg-[#0f172a] rounded-3xl border border-blue-500/20 shadow-xl relative z-[30]">
                        <div className="bg-blue-600/10 px-6 py-4 border-b border-blue-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="w-4 h-4 text-blue-400" />
                                <h3 className="text-[11px] font-black text-blue-300 uppercase tracking-widest">Genomic DNA Storage</h3>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Genomic DNA Tube Label</label>
                                <input type="text" value={formData.Genomic_DNA_tube_Label} onChange={e => setFormData({ ...formData, Genomic_DNA_tube_Label: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <RelationalSelect label="GD Freezer" endpoint="/lookup/freezers" value={formData.GD_Freezer_Number} onChange={(id) => setFormData({ ...formData, GD_Freezer_Number: id })} />
                            <RelationalSelect label="GD Rack" endpoint="/lookup/racks" value={formData.GD_Rack_Number} onChange={(id) => setFormData({ ...formData, GD_Rack_Number: id })} />
                            <RelationalSelect label="GD Box Detail" endpoint="/lookup/boxes" value={formData.GD_Box_detail} onChange={(id) => setFormData({ ...formData, GD_Box_detail: id })} />
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Location in Box-PD</label>
                                <input type="text" value={formData.Loction_in_Box_PD} onChange={e => setFormData({ ...formData, Loction_in_Box_PD: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-blue-400 text-sm font-mono" />
                            </div>
                        </div>
                    </div>

                    {/* Glycerol Storage Container (Clipper fix) */}
                    <div className="bg-[#0f172a] rounded-3xl border border-emerald-500/20 shadow-xl relative z-[20]">
                        <div className="bg-emerald-600/10 px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Thermometer className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-[11px] font-black text-emerald-300 uppercase tracking-widest">Glycerol Stock Detail</h3>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Glycerol Stock Tube Label</label>
                                <input type="text" value={formData.Glycerol_Stock_tube_label} onChange={e => setFormData({ ...formData, Glycerol_Stock_tube_label: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <RelationalSelect label="GS Freezer" endpoint="/lookup/freezers" value={formData.GS_Freezer_Number} onChange={(id) => setFormData({ ...formData, GS_Freezer_Number: id })} />
                            <RelationalSelect label="GS Rack" endpoint="/lookup/racks" value={formData.GS_Rack_Number} onChange={(id) => setFormData({ ...formData, GS_Rack_Number: id })} />
                            <RelationalSelect label="GS Box Detail" endpoint="/lookup/boxes" value={formData.GS_Box_details} onChange={(id) => setFormData({ ...formData, GS_Box_details: id })} />
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Location in Box-GS</label>
                                <input type="text" value={formData.Location_in_Box_GS} onChange={e => setFormData({ ...formData, Location_in_Box_GS: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-emerald-400 text-sm font-mono" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. ANTIBIOTICS & RESEARCH METADATA --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-[#0f172a] rounded-3xl border border-rose-500/20 shadow-xl self-start">
                        <div className="bg-rose-600/10 px-6 py-4 border-b border-rose-500/20 flex items-center gap-3">
                            <Beaker className="w-4 h-4 text-rose-400" />
                            <h3 className="text-xs font-black text-rose-300 uppercase tracking-widest">Antibiotic Profiling</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <RelationalSelect label="Antibiotic sensitivity" endpoint="/lookup/antibiotics" value={formData.Antibiotic_sensitivity} multiple={true} onChange={(val) => setFormData({ ...formData, Antibiotic_sensitivity: val })} />
                            <RelationalSelect label="Antibiotic resistance" endpoint="/lookup/antibiotics" value={formData.Antibiotic_resistance} multiple={true} onChange={(val) => setFormData({ ...formData, Antibiotic_resistance: val })} />
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-[#0f172a] rounded-3xl border border-white/5 shadow-2xl p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
                            <Plus className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Additional Research Metadata</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Strain Details & Notes</label>
                                    <textarea rows="8" value={formData.Detail_of_Bacterial_Strain} onChange={e => setFormData({ ...formData, Detail_of_Bacterial_Strain: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-blue-500 outline-none transition-all resize-none shadow-inner text-sm" placeholder="Characterization, growth media, references..." />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {dynamicFields.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-3xl bg-black/20 text-center">
                                        <Database className="w-8 h-8 text-slate-800 mb-2" />
                                        <p className="text-xs text-slate-600 font-medium">No custom fields added yet.<br />Use "Manage Fields" to extend your database.</p>
                                    </div>
                                ) : (
                                    dynamicFields.map(field => (
                                        <div key={field.key} className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 relative group/field">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    {field.type === 'image' && <ImageIcon size={12} className="text-blue-400" />}
                                                    {field.type === 'file' && <FileText size={12} className="text-amber-400" />}
                                                    {field.label}
                                                </label>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveField(field.key)}
                                                    className="opacity-0 group-hover/field:opacity-100 p-1 hover:bg-rose-500/10 text-rose-500 rounded transition-all"
                                                    title="Delete this field permanently"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            {(field.type === 'image' || field.type === 'file') ? (
                                                <div className="space-y-3">
                                                    {formData[field.key] ? (
                                                        <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-emerald-500/20">
                                                            <div className="flex items-center gap-3">
                                                                {field.type === 'image' ? (
                                                                    <img src={formData[field.key]} className="w-10 h-10 rounded object-cover border border-white/10" alt="Preview" />
                                                                ) : (
                                                                    <FileText className="w-8 h-8 text-emerald-400/50" />
                                                                )}
                                                                <span className="text-[10px] text-emerald-400 font-bold uppercase truncate max-w-[100px]">Uploaded OK</span>
                                                            </div>
                                                            <button onClick={() => setFormData({ ...formData, [field.key]: '' })} className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-md transition-colors"><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <label className="group flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-800 rounded-2xl hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer transition-all">
                                                            <Upload className="w-5 h-5 text-slate-700 group-hover:text-emerald-400 mb-1" />
                                                            <span className="text-[10px] text-slate-600 font-bold uppercase">Click to Create {field.type === 'image' ? 'Image' : '.doc, .pdf'}</span>
                                                            <input type="file" className="hidden" accept={field.type === 'image' ? 'image/*' : '.pdf,.doc,.docx'} onChange={(e) => handleFileUpload(e, field.key)} />
                                                        </label>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                    value={formData[field.key] || ''}
                                                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500"
                                                    placeholder={`Enter ${field.label}...`}
                                                />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm">
                    <div className="flex-1 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                        <AnimatePresence>
                            {success && ( <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-emerald-400 tracking-normal capitalize font-black"> <CheckCircle size={18} /> {success} </motion.div> )}
                            {error && ( <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-rose-500 tracking-normal capitalize font-black"> <AlertTriangle size={18} /> {error} </motion.div> )}
                        </AnimatePresence>
                        {!success && !error && `Table: ext_bacterial_strains • Schema Version: 2.3.0`}
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className={`flex items-center gap-2 px-12 py-3.5 rounded-2xl font-bold font-black text-white shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'}`}>
                            {loading ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
                            {loading ? 'Processing...' : 'Register Strain'}
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
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"> <Plus size={16} className="text-emerald-400" /> New Strain Attribute</h3>
                                <button onClick={() => setIsFieldModalOpen(false)}><X size={18} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleAddField} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Attribute Name</label>
                                    <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} placeholder="e.g. Growth_Notes" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500" required />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['text', 'number', 'date', 'image', 'file'].map(type => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => setNewField({ ...newField, type })}
                                            className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${newField.type === type ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-500'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" disabled={isAddingField} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95 disabled:bg-slate-700">
                                    {isAddingField ? 'Refactoring Schema...' : 'Add to Strain Engine'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StrainEntry;
