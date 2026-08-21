import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Save, Bug, Search, AlertTriangle, CheckCircle, Database, 
    Thermometer, MapPin, X, Activity, FlaskConical, Microscope,
    Settings, Plus, FileText, Image as ImageIcon, Trash2, Upload
} from 'lucide-react';
import RelationalSelect from '../components/RelationalSelect';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Bacteriophages Entry Form — Phase 161
 * 
 * HYBRID-DYNAMIC ARCHITECTURE:
 * 1. Matches MS Access "High-Fidelity" layout for Core Clinical Sections.
 * 2. Automatically renders "Additional Research Metadata" for custom user-added fields.
 * 3. Supports Image and File Uploads (serialized to Base64).
 * 4. NEW: Allows researchers to permanentally remove custom fields.
 */
const PhageEntry = () => {
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

    // Core "Fixed" Fields for Layout Filtering
    const CORE_FIELDS = [
        'id', 'Bacteriophage_Name', 'Against_Species', 'Host_Bacteria', 'Genome_Size', 'Host_Range', 'WT_RECOMB',
        'Glycerol_Stock_tube_Label', 'GS_Freezer_Name', 'GS_Racks', 'GS_Box_details', 'GS_position_in_Box',
        '_4C_Stock_detail', '_4C_Fridge_Number', '_4C_Rack_Number', '_4C_Position_in_box',
        'DNA_Storage_Label', 'DNA_storage_Box_detail', 'Characterization_details', 'Plaque_Morphology', 'Antibiotic_resistance',
        'plaque_assay_result'
    ];

    const initialForm = {
        id: null,
        Bacteriophage_Name: '',
        Against_Species: '',
        Host_Bacteria: '',
        Genome_Size: '',
        Host_Range: '',
        WT_RECOMB: '',
        Glycerol_Stock_tube_Label: '',
        GS_Freezer_Name: '',
        GS_Racks: '',
        GS_Box_details: '',
        GS_position_in_Box: '',
        _4C_Stock_detail: '',
        _4C_Fridge_Number: '',
        _4C_Rack_Number: '',
        _4C_Position_in_box: '',
        DNA_Storage_Label: '',
        DNA_storage_Box_detail: '',
        Characterization_details: '',
        Plaque_Morphology: '',
        Antibiotic_resistance: '',
        plaque_assay_result: ''
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
            // 1. Fetch Schema to know about custom fields
            const schemaRes = await api.get('/system/ext_bacteriophages/schema');
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
                const res = await api.get(`/system/ext_bacteriophages/${id}`);
                if (res.data) {
                    setFormData(prev => ({ ...prev, ...res.data, id: res.data.id }));
                }
            } else {
                setFormData(extendedForm);
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
            
            // Cleanse payload
            Object.keys(payload).forEach(key => {
                if (payload[key] === '' || payload[key] === null) delete payload[key];
            });

            // CONFLICT CHECK
            if (payload.GS_Box_details && payload.GS_position_in_Box) {
                const checkRes = await api.get(`/inventory/check-slot?boxName=${encodeURIComponent(payload.GS_Box_details)}&positionCode=${encodeURIComponent(payload.GS_position_in_Box)}`);
                if (checkRes.data.success && checkRes.data.occupied) {
                    const occ = checkRes.data.assetDetails;
                    if (!(occ.source_table === 'ext_bacteriophages' && occ.asset_id === id)) {
                        const confirmMsg = `WARNING: Slot ${payload.GS_position_in_Box} in Box "${payload.GS_Box_details}" is already occupied by:\n` +
                                           `- ${occ.asset_label} (${occ.asset_type})\n\n` +
                                           `Do you want to REPLACE the existing item with this new phage?`;
                        if (!window.confirm(confirmMsg)) {
                            setLoading(false);
                            return;
                        }
                        payload._conflictResolution = { previousOccupant: occ };
                    }
                }
            }

            if (id) {
                await api.put(`/system/ext_bacteriophages/${id}`, payload);
                setSuccess(`Record Updated Successfully.`);
            } else {
                const res = await api.post('/system/ext_bacteriophages', payload);
                setSuccess(`Success! Recorded Phage as ID ${res.data.id || 'new'}.`);
                setFormData({ ...initialForm, id: null });
            }
            
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || "Submission failed.");
        } finally {
            setLoading(false);
        }
    };

    // --- Media Manager ---
    const handleFileUpload = (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, [key]: reader.result });
        };
        reader.readAsDataURL(file);
    };

    // --- Schema Evolution ---
    const handleAddField = async (e) => {
        e.preventDefault();
        if (!newField.name) return;
        setIsAddingField(true);
        try {
            await api.post('/system/ext_bacteriophages/add-column', {
                columnName: newField.name.trim().replace(/\s+/g, '_'),
                type: newField.type
            });
            setIsFieldModalOpen(false);
            setNewField({ name: '', type: 'text' });
            fetchInitialData(formData.id); // Refresh schema
        } catch (err) {
            alert("Field creation failed: " + (err.response?.data?.error || err.message));
        } finally {
            setIsAddingField(false);
        }
    };

    const handleRemoveField = async (columnName) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY delete the field '${columnName}'? All data in this column for ALL records will be lost.`)) return;
        try {
            await api.post('/system/ext_bacteriophages/delete-column', { columnName });
            fetchInitialData(formData.id);
        } catch (err) {
            alert("Field deletion failed: " + (err.response?.data?.error || err.message));
        }
    };

    const dynamicFields = schema.filter(col => !CORE_FIELDS.includes(col.key));

    return (
        <div className="max-w-6xl mx-auto pb-12 animate-fade-in-up">
            
            {/* HEADER */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl mb-6 flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
                        <Bug className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Bacteriophages Registry</h1>
                        <p className="text-xs text-slate-500 uppercase font-mono tracking-widest mt-0.5 pointer-events-none">MS Access Dynamic Engine (Phase 164)</p>
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
                        <Microscope className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Classification & Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end font-medium">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Internal ID</label>
                            <input type="text" value={formData.id || "(New)"} readOnly className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-500 font-mono text-xs cursor-not-allowed outline-none shadow-inner" />
                        </div>
                        <RelationalSelect label="Bacteriophage Name" endpoint="/lookup/phage-names" value={formData.Bacteriophage_Name} onChange={(id) => setFormData({ ...formData, Bacteriophage_Name: id })} />
                        <RelationalSelect label="WT/RECOMB" endpoint="/lookup/wild-type-recomb" value={formData.WT_RECOMB} onChange={(id) => setFormData({ ...formData, WT_RECOMB: id })} />
                        <RelationalSelect label="Against Species" endpoint="/lookup/species" value={formData.Against_Species} onChange={(id) => setFormData({ ...formData, Against_Species: id })} />
                        <RelationalSelect label="Host Bacteria" endpoint="/lookup/host-bacteria" value={formData.Host_Bacteria} onChange={(id) => setFormData({ ...formData, Host_Bacteria: id })} />
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Genome Size</label>
                            <input type="text" value={formData.Genome_Size} onChange={e => setFormData({ ...formData, Genome_Size: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all text-sm" placeholder="e.g. 50kb" />
                        </div>
                        <div className="lg:col-span-2">
                            <RelationalSelect label="Host Range Strains" endpoint="/lookup/host-bacteria" value={formData.Host_Range} onChange={(id) => setFormData({ ...formData, Host_Range: id })} multiple={true} placeholder="Select multiple host strains..." />
                        </div>
                        <div className="lg:col-span-2">
                            <RelationalSelect label="Antibiotic Resistance" endpoint="/lookup/antibiotics" value={formData.Antibiotic_resistance} onChange={(id) => setFormData({ ...formData, Antibiotic_resistance: id })} multiple={true} placeholder="Select resistances..." />
                        </div>
                    </div>
                </div>

                {/* --- 2. STORAGE (Glycerol & 4C) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Glycerol Storage Container (Layer 30) */}
                    <div className="bg-[#0f172a] rounded-3xl border border-blue-500/20 shadow-xl relative z-[30]">
                        <div className="bg-blue-600/10 px-6 py-4 border-b border-blue-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="w-4 h-4 text-blue-400" />
                                <h3 className="text-[11px] font-black text-blue-300 uppercase tracking-widest">Glycerol Stock Detail</h3>
                            </div>
                            <Thermometer className="w-4 h-4 text-blue-500/50" />
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Glycerol Stock Tube Label</label>
                                <input type="text" value={formData.Glycerol_Stock_tube_Label} onChange={e => setFormData({ ...formData, Glycerol_Stock_tube_Label: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <RelationalSelect label="Freezer Name" endpoint="/lookup/freezers" value={formData.GS_Freezer_Name} onChange={(id) => setFormData({ ...formData, GS_Freezer_Name: id })} />
                            <RelationalSelect label="Rack Detail" endpoint="/lookup/racks" value={formData.GS_Racks} onChange={(id) => setFormData({ ...formData, GS_Racks: id })} />
                            <RelationalSelect label="Box Detail" endpoint="/lookup/boxes" value={formData.GS_Box_details} onChange={(id) => setFormData({ ...formData, GS_Box_details: id })} />
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">GS Position</label>
                                <input type="text" value={formData.GS_position_in_Box} onChange={e => setFormData({ ...formData, GS_position_in_Box: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-emerald-400 text-sm font-mono" />
                            </div>
                        </div>
                    </div>

                    {/* 4C Fridge Container (Layer 20) */}
                    <div className="bg-[#0f172a] rounded-3xl border border-emerald-500/20 shadow-xl relative z-[20]">
                        <div className="bg-emerald-600/10 px-6 py-4 border-b border-emerald-500/20 flex items-center gap-3">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-[11px] font-black text-emerald-300 uppercase tracking-widest">4C Fridge Stock</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">4C Stock Detail</label>
                                <input type="text" value={formData._4C_Stock_detail} onChange={e => setFormData({ ...formData, _4C_Stock_detail: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <RelationalSelect label="Fridge Name" endpoint="/lookup/freezers" value={formData._4C_Fridge_Number} onChange={(id) => setFormData({ ...formData, _4C_Fridge_Number: id })} />
                            <RelationalSelect label="Rack Number" endpoint="/lookup/racks" value={formData._4C_Rack_Number} onChange={(id) => setFormData({ ...formData, _4C_Rack_Number: id })} />
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fridge/Rack Position</label>
                                <input type="text" value={formData._4C_Position_in_box} onChange={e => setFormData({ ...formData, _4C_Position_in_box: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-amber-400 text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. DNA & ATTACHMENTS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-[#0f172a] rounded-3xl border border-slate-800 shadow-xl self-start">
                        <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
                            <FlaskConical className="w-4 h-4 text-white" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">DNA Library</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">DNA Storage Label</label>
                                <input type="text" value={formData.DNA_Storage_Label} onChange={e => setFormData({ ...formData, DNA_Storage_Label: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm" />
                            </div>
                            <RelationalSelect label="DNA Storage Location" endpoint="/lookup/freezers" value={formData.DNA_storage_Box_detail} onChange={(id) => setFormData({ ...formData, DNA_storage_Box_detail: id })} />
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
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Characterization Details</label>
                                    <textarea rows="3" value={formData.Characterization_details} onChange={e => setFormData({ ...formData, Characterization_details: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-blue-500 outline-none transition-all resize-none shadow-inner text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Plaque Morphology</label>
                                    <textarea rows="3" value={formData.Plaque_Morphology} onChange={e => setFormData({ ...formData, Plaque_Morphology: e.target.value })} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-blue-500 outline-none transition-all resize-none shadow-inner text-sm" />
                                </div>

                                {/* ── PLAQUE ASSAY RESULT DROPDOWN ── */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Plaque Assay Result</label>
                                    <div className="relative">
                                        <select
                                            value={formData.plaque_assay_result}
                                            onChange={e => setFormData({ ...formData, plaque_assay_result: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-emerald-500 outline-none transition-all text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">— Select Result —</option>
                                            <option value="+++ Complete Lysis">+++ Complete Lysis</option>
                                            <option value="++ Strong Lysis">++ Strong Lysis</option>
                                            <option value="+ Partial Lysis">+ Partial Lysis</option>
                                            <option value="± Turbid Plaques">± Turbid Plaques</option>
                                            <option value="- No Infection">- No Infection</option>
                                        </select>
                                        {/* Color indicator */}
                                        {formData.plaque_assay_result && (
                                            <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${
                                                formData.plaque_assay_result.startsWith('+++') ? 'bg-emerald-400' :
                                                formData.plaque_assay_result.startsWith('++')  ? 'bg-green-400'   :
                                                formData.plaque_assay_result.startsWith('+')   ? 'bg-lime-400'    :
                                                formData.plaque_assay_result.startsWith('±')   ? 'bg-amber-400'   :
                                                'bg-rose-500'
                                            }`} />
                                        )}
                                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
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
                                                            <span className="text-[10px] text-slate-600 font-bold uppercase">Click to Upload {field.type === 'image' ? 'Image' : '.doc, .pdf'}</span>
                                                            <input type="file" className="hidden" accept={field.type === 'image' ? 'image/*' : '.pdf,.doc,.docx'} onChange={(e) => handleFileUpload(e, field.key)} />
                                                        </label>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    type={field.type === 'number' ? 'number' : 'text'}
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
                        {!success && !error && `Table: ext_bacteriophages • Schema Version: 2.1.2`}
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className={`flex items-center gap-2 px-12 py-3.5 rounded-2xl font-bold font-black text-white shadow-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'}`}>
                            {loading ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
                            {loading ? 'Processing...' : 'Register Phage'}
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
                                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 rotate-0 transition-transform"> <Plus size={16} className="text-emerald-400" /> New Phage Attribute</h3>
                                <button onClick={() => setIsFieldModalOpen(false)}><X size={18} className="text-slate-500" /></button>
                            </div>
                            <form onSubmit={handleAddField} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Internal Name (Column)</label>
                                    <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} placeholder="e.g. Scanning_Notes" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500" required />
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
                                    {isAddingField ? 'Creating Column...' : 'Add to Phage Schema'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PhageEntry;
