import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { 
    Save, ArrowLeft, CheckCircle, AlertTriangle, 
    Activity, Database, Package, Image as ImageIcon, 
    Upload, File as FileIcon, X, Plus, Trash2, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RelationalSelect from '../../components/RelationalSelect';

/**
 * [ADMIN ARCHITECT] - Dynamic Form Executor v1.1
 * 
 * Production-grade runtime for deployed research forms.
 * Features:
 *  - Schema-driven High-Fidelity Rendering
 *  - Automated Base64 Media Serialization
 *  - Dynamic Relational Binding (v2.1 logic)
 *  - Zero-Clipping Layered UX
 */

const FormExecutor = () => {
    const { formId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [formConfig, setFormConfig] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // --- Data Hydration ---
    const hydrate = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Form Definition
            const configRes = await api.get(`/forms/${formId}`);
            setFormConfig(configRes.data);

            // 2. Initial Data Load if Updating
            const recordId = searchParams.get('id');
            if (recordId && configRes.data.table_name) {
                const dataRes = await api.get(`/system/${configRes.data.table_name}/${recordId}`);
                setFormData(dataRes.data || {});
            }
        } catch (err) {
            console.error("Hydration Failed:", err);
            setError("Failed to initialize dynamic registry engine.");
        } finally {
            setLoading(false);
        }
    }, [formId, searchParams]);

    useEffect(() => { hydrate(); }, [hydrate]);

    // --- Input Handlers ---
    const handleChange = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
    };

    const handleFileUpload = (e, key) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            handleChange(key, reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleMatrixChange = (key, rowIdx, colName, val) => {
        const currentMatrix = Array.isArray(formData[key]) ? [...formData[key]] : [];
        if (!currentMatrix[rowIdx]) currentMatrix[rowIdx] = {};
        currentMatrix[rowIdx][colName] = val;
        handleChange(key, currentMatrix);
    };

    const addMatrixRow = (key) => {
        const currentMatrix = Array.isArray(formData[key]) ? [...formData[key]] : [];
        currentMatrix.push({});
        handleChange(key, currentMatrix);
    };

    // --- Persistence ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const endpoint = `/system/${formConfig.table_name}`;
            const recordId = searchParams.get('id');

            if (recordId) {
                await api.put(`${endpoint}/${recordId}`, formData);
                setSuccess("Registry Entry Synchronized.");
            } else {
                await api.post(endpoint, formData);
                setSuccess("Entry Logged Successfully.");
                setFormData({}); // Clear if new entry
            }
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            setError(err.response?.data?.error || "Deployment Sync Failed.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500">
            <Activity className="animate-spin" size={40} />
            <p className="text-sm font-black uppercase tracking-widest">Initializing Deployed Engine...</p>
        </div>
    );

    if (!formConfig) return null;

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in-up">
            
            {/* Header */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-3xl p-8 border border-slate-800 shadow-2xl mb-8 flex justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <Database className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{formConfig.title}</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-mono mt-1">Live Registry Host &bull; Admin Architect Deployed</p>
                    </div>
                </div>
                <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-800 rounded-full text-slate-500 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Dynamic Content Rendering */}
                <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-visible">
                    
                    <div className="space-y-2">
                        {formConfig.schema_json.map((field, idx) => {
                            const glassInput = "w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all shadow-inner font-medium";
                            
                            if (field.type === 'section') {
                                return (
                                    <div key={idx} className="mt-12 mb-8 border-b border-emerald-500/20 pb-4">
                                        <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.3em]">{field.label}</h3>
                                    </div>
                                );
                            }

                            return (
                                <div key={idx} className={`mb-8 ${field.width === 'half' ? 'w-full md:w-1/2 md:inline-block md:px-4' : 'w-full'}`} style={{ zIndex: 100 - idx }}>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">
                                        {field.label} {field.required && <span className="text-emerald-500/40 italic ml-1">(REQUIRED)</span>}
                                    </label>

                                    {field.type === 'textarea' ? (
                                        <textarea 
                                            required={field.required}
                                            value={formData[field.key] || ''}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                            className={`${glassInput} h-32 italic text-sm`} 
                                            placeholder={field.placeholder} 
                                        />
                                    ) : field.type === 'lookup' ? (
                                        <RelationalSelect 
                                            endpoint={field.binding ? `/lookup/dynamic/${field.binding}${field.labelCol ? `?labelCol=${field.labelCol}` : ''}` : null}
                                            value={formData[field.key] || ''}
                                            onChange={val => handleChange(field.key, val)}
                                            placeholder={field.placeholder || "Select Entry..."}
                                            required={field.required}
                                        />
                                    ) : field.type === 'image' ? (
                                        <div className="aspect-video bg-black/40 rounded-3xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                                            {formData[field.key] ? (
                                                <img src={formData[field.key]} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                    <ImageIcon size={48} />
                                                    <span className="text-xs uppercase font-black tracking-widest">Upload Scientific Photo</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={e => handleFileUpload(e, field.key)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    ) : field.type === 'file' ? (
                                        <div className="p-8 bg-slate-900/50 rounded-[2rem] border border-slate-800 flex items-center justify-between group hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-slate-950 rounded-2xl text-slate-600 group-hover:text-emerald-400 transition-all">
                                                    <FileIcon size={32} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-200 uppercase tracking-widest leading-none">Attachment / Result Sheet</p>
                                                    <p className="text-[10px] text-slate-600 font-mono mt-2 uppercase tracking-tighter">
                                                        {formData[field.key] ? 'FILE_ATTACHED_BASE64' : 'Supported: .PDF, .DOC, .XLS'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Upload size={24} className="text-slate-700 group-hover:text-emerald-500 transition-all" />
                                            <input type="file" onChange={e => handleFileUpload(e, field.key)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </div>
                                    ) : field.type === 'matrix' ? (
                                        <div className="rounded-3xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950/20">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-950/80 text-slate-500 uppercase font-black">
                                                    <tr>
                                                        {field.matrixColumns?.split(',').map((c, i) => <th key={i} className="px-6 py-4 tracking-widest border-r border-slate-800 last:border-0">{c.trim()}</th>) || <th>No Columns</th>}
                                                        <th className="px-6 py-4 w-12 text-center border-slate-800"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.isArray(formData[field.key]) && formData[field.key].map((row, rIdx) => (
                                                        <tr key={rIdx} className="border-t border-slate-800 hover:bg-emerald-500/5 transition-all">
                                                            {field.matrixColumns?.split(',').map((c, cIdx) => (
                                                                <td key={cIdx} className="px-4 py-2 border-r border-slate-800 last:border-r-0">
                                                                    <input 
                                                                        type="text" 
                                                                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-800"
                                                                        placeholder="Result..."
                                                                        value={row[c.trim()] || ''}
                                                                        onChange={e => handleMatrixChange(field.key, rIdx, c.trim(), e.target.value)}
                                                                    />
                                                                </td>
                                                            )) || <td>-</td>}
                                                            <td className="px-2 text-center">
                                                                <button type="button" onClick={() => {
                                                                    const newMatrix = formData[field.key].filter((_, i) => i !== rIdx);
                                                                    handleChange(field.key, newMatrix);
                                                                }} className="p-2 text-rose-500/50 hover:text-rose-500 transition-all">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr>
                                                        <td colSpan={(field.matrixColumns?.split(',').length || 0) + 1} className="p-4">
                                                            <button 
                                                                type="button" 
                                                                onClick={() => addMatrixRow(field.key)}
                                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/70 hover:text-emerald-400 transition-all mx-auto"
                                                            >
                                                                <Plus size={14} /> Add Dataset Row
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <input 
                                            required={field.required}
                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} 
                                            className={glassInput} 
                                            placeholder={field.placeholder} 
                                            value={formData[field.key] || ''}
                                            onChange={e => handleChange(field.key, e.target.value)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-2xl flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>
                    <div className="flex-1 pr-6">
                        <AnimatePresence>
                            {success && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-4 text-emerald-400 font-bold bg-emerald-500/10 px-8 py-5 rounded-[2rem] w-fit border border-emerald-500/20 shadow-lg">
                                    <CheckCircle size={24} /> {success}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-4 text-rose-500 font-bold bg-rose-500/10 px-8 py-5 rounded-[2rem] w-fit border border-rose-500/20 shadow-lg">
                                    <AlertTriangle size={24} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-6 relative z-10 shrink-0">
                        <div className="hidden lg:flex flex-col items-end gap-1 px-6 border-r border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest leading-none">Physically Mapped To:</span>
                            <span className="text-[11px] text-slate-300 font-bold font-mono tracking-tighter uppercase">{formConfig.table_name}</span>
                        </div>
                        <button type="button" onClick={() => navigate(-1)} className="px-8 py-5 text-slate-500 hover:text-white font-black uppercase text-xs tracking-[0.2em] transition-all">Cancel</button>
                        <button 
                            type="submit" 
                            disabled={submitting} 
                            className={`flex items-center gap-4 px-14 py-6 rounded-[2.5rem] font-black text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${submitting ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/30'}`}
                        >
                            {submitting ? <Activity className="animate-spin" size={24} /> : <Save size={24} />}
                            <span className="uppercase tracking-[0.2em] text-sm">{submitting ? 'Deploying Entry...' : (searchParams.get('id') ? 'Update Registry' : 'Save Entry')}</span>
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default FormExecutor;
