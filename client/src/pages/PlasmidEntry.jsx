import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Save, Dna, CheckCircle, AlertTriangle, Database, X, 
    Activity, ArrowLeft, Zap, Box, Thermometer, Upload, Trash2, Camera, Eye, Settings, Plus, FileText, Image as ImageIcon
} from 'lucide-react';
import RelationalSelect from '../components/RelationalSelect';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Plasmid Entry Form — Phase 165
 * 
 * HYBRID-DYNAMIC ARCHITECTURE:
 * 1. Matches MS Access "High-Fidelity" layout for Clinical Storage (GS/DNA).
 * 2. Automatically renders "Additional Research Metadata" for custom user-added fields.
 * 3. Supports Advanced Media Uploads (Base64) with Structural Identity Preservation.
 * 4. Resolves the "Clipper Bug" via Global Z-Index Layering and Overflow Stripping.
 */
const PlasmidEntry = () => {
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
        'id', 'ID', 'Plasmid_Name', 'Plasmid_Backbone', 'Gene_Source', 'Cloning_Method', 
        'Antibiotic_Marker', 'Cloned_Gene_Sequence', 'Cloned_Protein_Sequence', 
        'Host_Bacteria', 'Activity_Shown_Against', 'Glycerol_Stock_Tube_Label', 
        'GLycerol_Stock_Freezer', 'Glycerol_Stock_Rack', 'Glycerol_Stock_Box', 
        'Location_in_Box_GS', 'PLasmid_DNA_Label', 'DNA_Store_Freezer', 
        'DNA_Store_Rack', 'DNA_Store_Box_Detail', 'Protein_Purification_status',
        'Expression_Picture', 'Purified_Protein_Picture'
    ];

    const initialForm = {
        id: null,
        ID: '', // Legacy string ID
        Plasmid_Name: '',
        Plasmid_Backbone: '',
        Gene_Source: '',
        Cloning_Method: '',
        Antibiotic_Marker: '',
        Cloned_Gene_Sequence: '',
        Cloned_Protein_Sequence: '',
        Host_Bacteria: '',
        Activity_Shown_Against: '',
        Glycerol_Stock_Tube_Label: '',
        GLycerol_Stock_Freezer: '',
        Glycerol_Stock_Rack: '',
        Glycerol_Stock_Box: '',
        Location_in_Box_GS: '',
        PLasmid_DNA_Label: '',
        DNA_Store_Freezer: '',
        DNA_Store_Rack: '',
        DNA_Store_Box_Detail: '',
        Protein_Purification_status: 'No',
        Expression_Picture: '',
        Purified_Protein_Picture: ''
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
            // 1. Fetch Schema for ext_plasmids (Dynamic Engine Phase 165)
            const schemaRes = await api.get('/system/ext_plasmids/schema');
            if (schemaRes.data.schema) {
                setSchema(schemaRes.data.schema);
                const extendedForm = { ...initialForm };
                schemaRes.data.schema.forEach(col => {
                    if (!CORE_FIELDS.includes(col.key)) extendedForm[col.key] = '';
                });
                setFormData(extendedForm);
            }

            // 2. Hydrate data if editing
            if (id) {
                const res = await api.get(`/system/ext_plasmids/${id}`);
                if (res.data) {
                    setFormData(prev => ({ 
                        ...prev, 
                        ...res.data, 
                        id: res.data.id,
                        Protein_Purification_status: res.data.Protein_Purification_status === 'Yes' ? 'Yes' : 'No'
                    }));
                }
            }
        } catch (err) {
            console.error("Initialization failed", err);
            setError("Could not load plasmid data.");
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
            
            // Cleanse payload
            Object.keys(payload).forEach(key => {
                if (payload[key] === '' || payload[key] === null) delete payload[key];
            });

            if (id) {
                await api.put(`/system/ext_plasmids/${id}`, payload);
                setSuccess(`Plasmid Updated Successfully.`);
            } else {
                const res = await api.post('/system/ext_plasmids', payload);
                setSuccess(`Success! Assigned ID: ${res.data.id || 'new'}.`);
                setFormData({ ...initialForm, id: null });
            }
            
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || "Submission failed.");
        } finally {
            setLoading(false);
        }
    };

    // --- Media Manager (Phase 165) ---
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
            await api.post('/system/ext_plasmids/add-column', {
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
            await api.post('/system/ext_plasmids/delete-column', { columnName });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field deletion failed.");
        }
    };

    const dynamicFields = schema.filter(col => !CORE_FIELDS.includes(col.key));

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
            
            {/* HEADER (Phase 165 Upgrade) */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6 flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                        <Dna className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Plasmid Accession</h1>
                        <p className="text-xs text-slate-500 uppercase font-mono tracking-widest mt-0.5 pointer-events-none">Hybrid-Dynamic Engine (Phase 165)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFieldModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-white/5 transition-all"
                    >
                        <Settings size={14} className="text-purple-400" /> Manage Fields
                    </button>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- 1. IDENTITY & SEQUENCE (Top Layer 40 for Dropdowns) --- */}
                <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6 relative z-[40]">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Plasmid Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end font-medium">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Internal ID</label>
                            <input type="text" value={formData.id || "(New)"} readOnly className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 font-mono text-xs cursor-not-allowed outline-none shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Legacy ID</label>
                            <input type="text" value={formData.ID} onChange={e => setFormData({ ...formData, ID: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all text-xs font-mono" placeholder="Old mapping ID..." />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Plasmid Name</label>
                            <input type="text" value={formData.Plasmid_Name} onChange={e => setFormData({ ...formData, Plasmid_Name: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all text-sm font-bold" placeholder="e.g. pET28a-EGFP" />
                        </div>
                        <RelationalSelect label="Plasmid Backbone" endpoint="/lookup/plasmid-vectors" value={formData.Plasmid_Backbone} onChange={(id) => setFormData({ ...formData, Plasmid_Backbone: id })} />
                        <RelationalSelect label="Gene Source" endpoint="/lookup/gene-sources" value={formData.Gene_Source} onChange={(id) => setFormData({ ...formData, Gene_Source: id })} />
                        <RelationalSelect label="Cloning Method" endpoint="/lookup/cloning-methods" value={formData.Cloning_Method} onChange={(id) => setFormData({ ...formData, Cloning_Method: id })} />
                        <RelationalSelect label="Antibiotic Marker" endpoint="/lookup/antibiotics" value={formData.Antibiotic_Marker} onChange={(id) => setFormData({ ...formData, Antibiotic_Marker: id })} />
                    </div>
                </div>

                {/* --- 2. STORAGE (GLYCEROL & DNA) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-medium">
                    
                    {/* Glycerol Storage Container (Layer 30) - NO OVERFLOW */}
                    <div className="bg-emerald-500/[0.03] rounded-3xl border border-emerald-500/20 shadow-xl relative z-[30]">
                        <div className="bg-emerald-600/10 px-6 py-4 border-b border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Thermometer className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-[11px] font-black text-emerald-300 uppercase tracking-widest">Glycerol Stock detail</h3>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Glycerol Stock Tube Label</label>
                                <input type="text" value={formData.Glycerol_Stock_Tube_Label} onChange={e => setFormData({ ...formData, Glycerol_Stock_Tube_Label: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <RelationalSelect label="GS Freezer" endpoint="/lookup/freezers" value={formData.GLycerol_Stock_Freezer} onChange={(id) => setFormData({ ...formData, GLycerol_Stock_Freezer: id })} />
                            <RelationalSelect label="GS Rack" endpoint="/lookup/racks" value={formData.Glycerol_Stock_Rack} onChange={(id) => setFormData({ ...formData, Glycerol_Stock_Rack: id })} />
                            <RelationalSelect label="GS Box Detail" endpoint="/lookup/boxes" value={formData.Glycerol_Stock_Box} onChange={(id) => setFormData({ ...formData, Glycerol_Stock_Box: id })} />
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Location in Box-GS</label>
                                <input type="text" value={formData.Location_in_Box_GS} onChange={e => setFormData({ ...formData, Location_in_Box_GS: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-emerald-400 text-sm font-mono" placeholder="Col/Row..." />
                            </div>
                        </div>
                    </div>

                    {/* DNA Storage Container (Layer 20) - NO OVERFLOW */}
                    <div className="bg-orange-500/[0.03] rounded-3xl border border-orange-500/20 shadow-xl relative z-[20]">
                        <div className="bg-orange-600/10 px-6 py-4 border-b border-orange-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Box className="w-4 h-4 text-orange-400" />
                                <h3 className="text-[11px] font-black text-orange-300 uppercase tracking-widest">DNA Storage Detail</h3>
                            </div>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">PLasmid DNA Label</label>
                                <input type="text" value={formData.PLasmid_DNA_Label} onChange={e => setFormData({ ...formData, PLasmid_DNA_Label: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <RelationalSelect label="DNA Freezer" endpoint="/lookup/freezers" value={formData.DNA_Store_Freezer} onChange={(id) => setFormData({ ...formData, DNA_Store_Freezer: id })} />
                            <RelationalSelect label="DNA Rack" endpoint="/lookup/racks" value={formData.DNA_Store_Rack} onChange={(id) => setFormData({ ...formData, DNA_Store_Rack: id })} />
                            <div className="md:col-span-2">
                                <RelationalSelect label="DNA Box Detail" endpoint="/lookup/boxes" value={formData.DNA_Store_Box_Detail} onChange={(id) => setFormData({ ...formData, DNA_Store_Box_Detail: id })} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. SEQUENCE & RESEARCH METADATA --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-[#0f172a] rounded-3xl border border-white/5 shadow-xl self-start">
                        <div className="bg-slate-800/20 px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <Zap className="w-4 h-4 text-purple-400" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Biological Targets</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <RelationalSelect label="Host Bacteria" endpoint="/lookup/host-bacteria" value={formData.Host_Bacteria} onChange={(id) => setFormData({ ...formData, Host_Bacteria: id })} />
                            <RelationalSelect label="Activity Shown Against" endpoint="/lookup/species" value={formData.Activity_Shown_Against} onChange={(id) => setFormData({ ...formData, Activity_Shown_Against: id })} />
                            <div className="flex items-center gap-8 bg-black/20 p-5 rounded-2xl border border-white/5">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Protein Purification status</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.Protein_Purification_status === 'Yes'} onChange={e => setFormData({ ...formData, Protein_Purification_status: e.target.checked ? 'Yes' : 'No' })} />
                                    <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-[#0f172a] rounded-3xl border border-white/5 shadow-2xl p-8 space-y-6 font-medium">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
                            <Plus className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Research Evidence & Sequences</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Cloned Gene Sequence (DNA)</label>
                                    <textarea rows="4" value={formData.Cloned_Gene_Sequence} onChange={e => setFormData({ ...formData, Cloned_Gene_Sequence: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-emerald-400 font-mono text-xs focus:border-purple-500 outline-none transition-all resize-none shadow-inner" placeholder="AGCT..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Cloned Protein Sequence (AA)</label>
                                    <textarea rows="4" value={formData.Cloned_Protein_Sequence} onChange={e => setFormData({ ...formData, Cloned_Protein_Sequence: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-blue-400 font-mono text-xs focus:border-purple-500 outline-none transition-all resize-none shadow-inner" placeholder="MAPK..." />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Core Media Previews */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Expression Pic</label>
                                        <div className="aspect-square bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                                            {formData.Expression_Picture ? (
                                                <img src={formData.Expression_Picture} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-slate-800" size={24} />
                                            )}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, 'Expression_Picture')} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Purified Pic</label>
                                        <div className="aspect-square bg-slate-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                                            {formData.Purified_Protein_Picture ? (
                                                <img src={formData.Purified_Protein_Picture} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-slate-800" size={24} />
                                            )}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, 'Purified_Protein_Picture')} />
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Fields Render */}
                                {dynamicFields.map(field => (
                                    <div key={field.key} className="p-4 bg-slate-950/40 rounded-2xl border border-white/5 relative group/field">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                {field.type === 'image' && <ImageIcon size={12} className="text-blue-400" />}
                                                {field.type === 'file' && <FileText size={12} className="text-amber-400" />}
                                                {field.label}
                                            </label>
                                            <button type="button" onClick={() => handleRemoveField(field.key)} className="opacity-0 group-hover/field:opacity-100 p-1 hover:bg-rose-500/10 text-rose-500 rounded transition-all"><Trash2 size={12} /></button>
                                        </div>
                                        {(field.type === 'image' || field.type === 'file') ? (
                                            <div className="space-y-3">
                                                {formData[field.key] ? (
                                                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded-lg border border-purple-500/20">
                                                        <div className="flex items-center gap-3">
                                                            {field.type === 'image' ? ( <img src={formData[field.key]} className="w-10 h-10 rounded object-cover border border-white/10" /> ) : ( <FileText className="w-8 h-8 text-purple-400/50" /> )}
                                                            <span className="text-[10px] text-purple-400 font-bold uppercase truncate max-w-[100px]">Attached</span>
                                                        </div>
                                                        <button onClick={() => setFormData({ ...formData, [field.key]: '' })} className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-md"><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <label className="group flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-800 rounded-2xl hover:border-purple-500/30 hover:bg-purple-500/5 cursor-pointer transition-all">
                                                        <Upload className="w-5 h-5 text-slate-700 group-hover:text-purple-400 mb-1" />
                                                        <span className="text-[10px] text-slate-600 font-bold uppercase">Click to Create {field.type === 'image' ? 'Image' : '.doc, .pdf'}</span>
                                                        <input type="file" className="hidden" accept={field.type === 'image' ? 'image/*' : '.pdf,.doc,.docx'} onChange={(e) => handleFileUpload(e, field.key)} />
                                                    </label>
                                                )}
                                            </div>
                                        ) : (
                                            <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-purple-500" placeholder={`Enter ${field.label}...`} />
                                        )}
                                    </div>
                                ))}
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
                        {!success && !error && `Plasmid Schema Evolution • Phase 165 Stabilized`}
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className={`flex items-center gap-2 px-12 py-3.5 rounded-2xl font-bold font-black text-white shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20'}`}>
                            {loading ? <Activity className="animate-spin" size={18} /> : (formData.id ? <Database size={18} /> : <Save size={18} />)}
                            {loading ? 'Processing...' : (formData.id ? 'Update Plasmid' : 'Register Plasmid')}
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
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"> <Plus size={16} className="text-purple-400" /> New Plasmid Attribute</h3>
                                <button onClick={() => setIsFieldModalOpen(false)}><X size={18} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleAddField} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-black">Attribute Name</label>
                                    <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} placeholder="e.g. Map_File" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500 font-bold" required />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['text', 'number', 'date', 'image', 'file'].map(type => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => setNewField({ ...newField, type })}
                                            className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${newField.type === type ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-500'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                <button type="submit" disabled={isAddingField} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-xl transition-all active:scale-95 disabled:bg-slate-700">
                                    {isAddingField ? 'Refactoring Schema...' : 'Add to Plasmid Engine'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlasmidEntry;
