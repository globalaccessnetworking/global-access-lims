import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Edit3, Database, FlaskConical, Bug, Dna, FileCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import RelationalSelect from './RelationalSelect';

const QuickEditModal = ({ asset, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState('view'); // 'view' or 'edit'
    const [details, setDetails] = useState(null);
    const [schema, setSchema] = useState(null);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});
    const [displayValues, setDisplayValues] = useState({});

    // Mappings for RelationalSelect in Edit Mode
    const FIELD_LOOKUPS = {
        'Host_Bacteria': '/lookup/host-bacteria',
        'Against_Species': '/lookup/species',
        'WT_RECOMB': '/lookup/wild-type-recomb',
        'WT-RECOMB': '/lookup/wild-type-recomb',
        'GS_Freezer_Name': '/lookup/freezers',
        '4C_Fridge_Number': '/lookup/freezers',
        'GS_Racks': '/lookup/racks',
        '_4C_Rack_Number': '/lookup/racks',
        'GS_Box_details': '/lookup/boxes',
        'DNA_storage_Box_detail': '/lookup/freezers'
    };

    useEffect(() => {
        if (asset) fetchDetails();
    }, [asset]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/bio/detail/${asset.type}/${asset.id}`);
            if (res.data.success) {
                setDetails(res.data.data);
                setSchema(res.data.schema);
                setFormData(res.data.data);
                setDisplayValues(res.data.displayValues || {});
            }
        } catch (err) {
            console.error("Fetch details failed", err);
            setError("Failed to resolve asset metadata.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/bio/detail/${asset.type}/${asset.id}`, formData);
            setMode('view');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Save failed", err);
            alert("Sync Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type?.toUpperCase()) {
            case 'PHAGE': return <Bug size={24} className="text-blue-400" />;
            case 'STRAIN': return <Dna size={24} className="text-emerald-400" />;
            case 'PRIMER': return <FileCode size={24} className="text-purple-400" />;
            case 'PLASMID': return <FlaskConical size={24} className="text-amber-400" />;
            default: return <Database size={24} className="text-slate-400" />;
        }
    };

    if (!asset) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between relative bg-gradient-to-r from-white/[0.02] to-transparent">
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl shadow-inner ${
                            asset.type === 'PHAGE' ? 'bg-blue-500/10 border border-blue-500/20' :
                            asset.type === 'STRAIN' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                            'bg-slate-800 border border-white/10'
                        }`}>
                            {getTypeIcon(asset.type)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-white tracking-tight">{details?.name || asset.name}</h2>
                                <span className="px-2 py-0.5 bg-white/5 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest border border-white/5">
                                    REG #{asset.id}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium mt-1">Classification: {asset.type.toUpperCase()}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {mode === 'view' ? (
                            <button 
                                onClick={() => setMode('edit')}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-all text-sm font-bold active:scale-95"
                            >
                                <Edit3 size={16} /> Edit Data
                            </button>
                        ) : (
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Synchronize Updates
                            </button>
                        )}
                        <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                <Loader2 className="text-emerald-400 opacity-40" size={48} />
                            </motion.div>
                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">De-serializing Research Metadata...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
                            <AlertCircle className="text-rose-500/50" size={48} />
                            <p className="text-slate-300 font-bold">{error}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Dynamic Fields */}
                            {(schema?.fields || Object.keys(details || {}).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k)).map(k => ({ id: k, label: k }))).map((field) => {
                                const value = formData[field.id] || '';
                                return (
                                    <div key={field.id} className="space-y-2 group">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-1 group-focus-within:text-emerald-400 transition-colors">
                                            {field.label || field.id.replace(/_/g, ' ')}
                                        </label>
                                        {mode === 'view' ? (
                                            <div className="px-5 py-3.5 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-200 font-medium text-sm min-h-[50px] flex items-center">
                                                {displayValues[field.id] || value || <span className="text-slate-700 italic">Not recorded</span>}
                                            </div>
                                        ) : FIELD_LOOKUPS[field.id] ? (
                                            <RelationalSelect 
                                                label={field.label || field.id}
                                                endpoint={FIELD_LOOKUPS[field.id]}
                                                value={value}
                                                onChange={(val) => setFormData({...formData, [field.id]: val})}
                                            />
                                        ) : (
                                            <input 
                                                type="text"
                                                value={value}
                                                onChange={(e) => setFormData({...formData, [field.id]: e.target.value})}
                                                className="w-full px-5 py-3.5 bg-slate-950 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                                                placeholder={`Enter ${field.label}...`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                {!loading && !error && (
                    <div className="px-8 py-4 bg-slate-950 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-widest">
                            <CheckCircle size={12} className="text-emerald-500" />
                            Data Source: {details ? 'Relational Registry' : 'Memory Cache'}
                        </div>
                        {mode === 'edit' && (
                            <div className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest animate-pulse">
                                Editing Global Matrix Record
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default QuickEditModal;
