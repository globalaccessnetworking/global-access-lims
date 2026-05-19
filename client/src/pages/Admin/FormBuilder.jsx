import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import {
    Layout, Type, Hash, Calendar, List, CheckSquare,
    Save, GripVertical, Trash2, Settings, Plus, Eye,
    Database, ArrowLeft, ArrowRight, FileText, Grid, CheckCircle,
    Image as ImageIcon, Upload, File as FileIcon, X, Activity, Zap, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [ADMIN ARCHITECT] - Clinical Form Builder v2.2
 * 
 * Evolved designer for high-fidelity research forms.
 * Supports native Media, Relational Logic, and Automated DB Mapping.
 * 
 * v2.2 Upgrade: 'Autonomous Architect' (MS Access Parity)
 *  - Added Live Column Discovery
 *  - Precise Relational Mapping via Picker
 */

const FormBuilder = () => {
    const navigate = useNavigate();
    const [formTitle, setFormTitle] = useState('New Research Registry');
    const [fields, setFields] = useState([]);
    const [selectedField, setSelectedField] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Dynamic Binding Persistence
    const [bindableTables, setBindableTables] = useState([]);
    const [availableColumns, setAvailableColumns] = useState([]);
    const [loadingColumns, setLoadingColumns] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const init = async () => {
            try {
                const res = await api.get('/forms/meta/tables');
                setBindableTables(res.data || []);
            } catch (err) {
                console.error("Initialization Failed:", err);
            } finally {
                setTimeout(() => setIsLoading(false), 500);
            }
        };
        init();
    }, []);

    // Column Discovery Effect (MS Access Style)
    useEffect(() => {
        const fetchColumns = async () => {
            if (selectedField?.type === 'lookup' && selectedField?.binding) {
                setLoadingColumns(true);
                try {
                    const res = await api.get(`/forms/meta/columns/${selectedField.binding}`);
                    setAvailableColumns(res.data || []);
                } catch (err) {
                    console.error("Discovery Failed:", err);
                    setAvailableColumns([]);
                } finally {
                    setLoadingColumns(false);
                }
            } else {
                setAvailableColumns([]);
            }
        };
        fetchColumns();
    }, [selectedField?.binding, selectedField?.type]);

    // Advanced Clinical Toolbox
    const toolboxItems = [
        { type: 'section', label: 'Section Header', icon: Layout, color: 'text-emerald-400' },
        { type: 'text', label: 'Clinical Text', icon: Type, color: 'text-blue-400' },
        { type: 'number', label: 'Numeric Metric', icon: Hash, color: 'text-purple-400' },
        { type: 'textarea', label: 'Narrative Box', icon: List, color: 'text-indigo-400' },
        { type: 'date', label: 'Registry Date', icon: Calendar, color: 'text-amber-400' },
        { type: 'lookup', label: 'Relational Lookup', icon: Database, color: 'text-rose-400' },
        { type: 'matrix', label: 'Data Matrix', icon: Grid, color: 'text-teal-400' },
        { type: 'image', label: 'Stock Imagery', icon: ImageIcon, color: 'text-pink-400' },
        { type: 'file', label: 'Document (.doc/.pdf)', icon: FileIcon, color: 'text-orange-400' },
        { type: 'checkbox', label: 'Binary Toggle', icon: CheckSquare, color: 'text-slate-400' },
    ];

    const addField = (type) => {
        const item = toolboxItems.find(i => i.type === type);
        const newField = {
            id: Date.now().toString(),
            key: `field_${Date.now()}`,
            type,
            label: `New ${item?.label || type}`,
            placeholder: '',
            required: false,
            binding: '',
            labelCol: '', // Precise Relationship Mapping
            width: 'full', // 'half' or 'full'
            zIndex: 10,
            options: [],
            matrixColumns: 'Result, Observation'
        };
        setFields(prev => [...prev, newField]);
        setSelectedField(newField);
    };

    const removeField = (id) => {
        setFields(prev => prev.filter(f => f.id !== id));
        if (selectedField?.id === id) setSelectedField(null);
    };

    const updateField = (key, val) => {
        if (!selectedField) return;
        const updated = { ...selectedField, [key]: val };
        
        // Auto-sanitize Key for DB compatibility
        if (key === 'label') {
            updated.key = val.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').substring(0, 30);
        }

        setSelectedField(updated);
        setFields(prev => prev.map(f => f.id === updated.id ? updated : f));
    };

    const saveForm = async () => {
        setSaving(true);
        try {
            await api.post('/forms', {
                title: formTitle,
                schema_json: fields,
                status: 'Published'
            });
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                navigate('/admin');
            }, 2000);
        } catch (err) {
            alert('Architect Deployment Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    // --- PREMIUM RENDERER ---

    const renderPreviewField = (field) => {
        const glassInput = "w-full bg-slate-950/80 border border-slate-800 rounded-xl px-5 py-3 text-white focus:border-emerald-500/50 outline-none transition-all shadow-inner";
        
        if (field.type === 'section') {
            return (
                <div className="mt-10 mb-6 border-b border-emerald-500/20 pb-4">
                    <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.3em]">{field.label}</h3>
                </div>
            );
        }

        return (
            <div className={`mb-6 ${field.width === 'half' ? 'w-full md:w-1/2 md:inline-block md:px-3' : 'w-full'}`} style={{ zIndex: field.zIndex }}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">
                    {field.label} {field.required && <span className="text-emerald-500/50 italic ml-1">(Required)</span>}
                </label>

                {field.type === 'textarea' ? (
                    <textarea className={`${glassInput} h-24 italic`} placeholder={field.placeholder} />
                ) : field.type === 'lookup' ? (
                    <div className="relative">
                        <div className={`${glassInput} flex justify-between items-center opacity-70`}>
                            <span>Search {field.binding ? field.binding.replace('ext_', '').toUpperCase() : 'Repository'}...</span>
                            <Database size={14} className="text-emerald-500/50" />
                        </div>
                    </div>
                ) : field.type === 'image' ? (
                    <div className="aspect-video bg-black/40 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-600">
                        <ImageIcon size={32} className="opacity-20" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Upload Clinical Image</span>
                    </div>
                ) : field.type === 'file' ? (
                    <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-center gap-4 text-slate-500">
                        <FileIcon size={24} />
                        <span className="text-xs uppercase font-bold tracking-wider">Attach Documentation (.pdf / .doc)</span>
                    </div>
                ) : field.type === 'matrix' ? (
                    <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-900 text-slate-500 uppercase font-black">
                                <tr>
                                    {field.matrixColumns?.split(',').map((c, i) => <th key={i} className="px-5 py-3 tracking-widest border-r border-slate-800 last:border-0">{c.trim()}</th>) || <th>No Columns</th>}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-slate-950/20">
                                    {field.matrixColumns?.split(',').map((_, i) => <td key={i} className="px-5 py-3 border-r border-slate-800 last:border-0 opacity-20 italic">Data Entry Point...</td>) || <td>-</td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} className={glassInput} placeholder={field.placeholder} />
                )}
            </div>
        );
    };

    if (!isMounted) return null;

    return (
        <div className="h-screen w-full bg-[#0B1120] flex flex-col overflow-hidden text-slate-300">
            
            {/* --- TOP ARCHITECT BAR --- */}
            <header className="h-20 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-8 z-[100] shadow-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/admin')} className="p-3 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-10 w-px bg-slate-800 mx-2"></div>
                    <div>
                        <input
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            className="bg-transparent text-xl font-bold text-white border-none focus:ring-0 placeholder-slate-800 p-0"
                            placeholder="Unnamed Registry..."
                        />
                        <p className="text-[10px] text-emerald-500/50 uppercase font-mono tracking-widest mt-0.5 animate-pulse">● System Architect Active</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${previewMode ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {previewMode ? <Settings size={14} /> : <Eye size={14} />}
                        {previewMode ? 'Architect Mode' : 'Live Preview'}
                    </button>
                    <button
                        onClick={saveForm}
                        disabled={saving}
                        className="bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                        {saving ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}
                        {saving ? 'Deploying...' : 'Deploy Form'}
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                
                {/* --- TOOLBOX (LEFT) --- */}
                {!previewMode && (
                    <aside className="w-80 bg-[#0F172A] border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Registry Elements</h3>
                            <div className="space-y-3">
                                {toolboxItems.map(item => (
                                    <button
                                        key={item.type}
                                        onClick={() => addField(item.type)}
                                        className="w-full flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all group hover:bg-slate-900 shadow-lg"
                                    >
                                        <div className={`p-2 rounded-lg bg-slate-900 ${item.color} group-hover:scale-110 transition-transform shadow-inner`}>
                                            <item.icon size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-slate-200 group-hover:text-white">{item.label}</p>
                                            <p className="text-[9px] text-slate-600 uppercase font-mono tracking-tighter mt-0.5">LIMS Component</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                )}

                {/* --- CANVAS (CENTER) --- */}
                <section className="flex-1 bg-[#090E1A] overflow-y-auto p-12 scroll-smooth">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence>
                            {fields.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[500px] rounded-[3rem] border-4 border-dashed border-slate-900 flex flex-col items-center justify-center text-slate-800">
                                    <Plus size={48} className="mb-4 opacity-10" />
                                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-20 text-center">Drag Components from Toolbox<br/>to start construction</p>
                                </motion.div>
                            ) : (
                                <motion.div layout className={`bg-[#0F172A] p-12 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden ${previewMode ? 'animate-fade-in' : ''}`}>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
                                    
                                    <div className="relative mb-12 border-b border-slate-800 pb-8">
                                        <h1 className="text-3xl font-black text-white tracking-tight">{formTitle}</h1>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest mt-2">{previewMode ? 'Live Clinical Form' : 'Architect Blueprint'}</p>
                                    </div>

                                    <div className="space-y-2">
                                        {fields.map((field) => {
                                            const item = toolboxItems.find(i => i.type === field.type);
                                            const Icon = item?.icon || AlertTriangle;
                                            
                                            return previewMode ? (
                                                <div key={field.id}>{renderPreviewField(field)}</div>
                                            ) : (
                                                <div
                                                    key={field.id}
                                                    onClick={() => setSelectedField(field)}
                                                    className={`group relative p-6 rounded-3xl border-2 transition-all mb-4 cursor-pointer ${selectedField?.id === field.id ? 'border-emerald-500 bg-slate-900 shadow-2xl scale-[1.02]' : 'border-transparent hover:border-slate-800 hover:bg-slate-900/30'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                                                                <Icon size={14} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{field.label}</label>
                                                                <p className="text-[9px] text-slate-700 font-mono mt-0.5 uppercase">ID: {field.key}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="px-2 py-1 bg-slate-800 rounded-md text-[9px] font-mono text-slate-500 uppercase">{field.width}</div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                                                className="p-1.5 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="h-12 bg-slate-950 border border-slate-800/50 rounded-xl w-full opacity-30 shadow-inner"></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* --- PROPERTIES (RIGHT) --- */}
                {!previewMode && (
                    <aside className="w-96 bg-[#0F172A] border-l border-slate-800 flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                            <Settings className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Parameter Architect</h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {!selectedField ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                    <Settings size={48} className="mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">Select an element<br/>to adjust parameters</p>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-fade-in">
                                    
                                    {/* IDENTIFICATION */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Visible Label</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none shadow-inner"
                                                value={selectedField.label}
                                                onChange={(e) => updateField('label', e.target.value)}
                                            />
                                            <p className="text-[9px] text-slate-700 font-mono mt-2 uppercase">DB Column: {selectedField.key}</p>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Placeholder (Optional)</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none shadow-inner"
                                                value={selectedField.placeholder}
                                                onChange={(e) => updateField('placeholder', e.target.value)}
                                                placeholder="e.g. Enter DNA sequence..."
                                            />
                                        </div>
                                    </div>

                                    {/* LAYOUT LOGIC */}
                                    <div className="bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800/50 space-y-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Layout className="w-4 h-4 text-indigo-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Architectural Layout</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={() => updateField('width', 'full')} className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedField.width === 'full' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>Full Width</button>
                                            <button onClick={() => updateField('width', 'half')} className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedField.width === 'half' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}>Split Width</button>
                                        </div>
                                        <div className="flex items-center justify-between pt-2">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compulsory Value</span>
                                            <button onClick={() => updateField('required', !selectedField.required)} className={`w-12 h-6 rounded-full p-1 transition-all ${selectedField.required ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                                                <div className={`w-4 h-4 rounded-full transition-all ${selectedField.required ? 'bg-emerald-400 translate-x-6' : 'bg-slate-600 translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* DATA BINDING (MS ACCESS AUTONOMY) */}
                                    {selectedField.type === 'lookup' && (
                                        <div className="bg-rose-500/5 p-6 rounded-[2rem] border border-rose-500/20 space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Database className="w-4 h-4 text-rose-500" />
                                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Relationship Assignment</span>
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-slate-500 uppercase font-bold mb-2 block">Target Repository (Registry)</label>
                                                <select
                                                    className="w-full bg-slate-950 border border-rose-500/20 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-rose-500 shadow-inner"
                                                    value={selectedField.binding || ''}
                                                    onChange={(e) => updateField('binding', e.target.value)}
                                                >
                                                    <option value="">No Binding / Manual Entry</option>
                                                    {bindableTables.map(t => (
                                                        <option key={t.id} value={t.id}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            {selectedField.binding && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                                    <label className="text-[9px] text-slate-500 uppercase font-bold mb-2 block flex justify-between">
                                                        <span>Display Column (Dropdown Label)</span>
                                                        {loadingColumns && <Activity size={10} className="animate-spin text-rose-500" />}
                                                    </label>
                                                    <select
                                                        className="w-full bg-slate-950 border border-rose-500/20 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-rose-500 shadow-inner"
                                                        value={selectedField.labelCol || ''}
                                                        onChange={(e) => updateField('labelCol', e.target.value)}
                                                        disabled={loadingColumns}
                                                    >
                                                        <option value="">Select Header Name...</option>
                                                        {availableColumns.map(col => (
                                                            <option key={col.id} value={col.id}>{col.label}</option>
                                                        ))}
                                                    </select>
                                                </motion.div>
                                            )}

                                            <p className="text-[9px] text-slate-600 italic leading-relaxed">System will pull live data from the selected registry using the header you specify for the labels.</p>
                                        </div>
                                    )}

                                    {/* MATRIX LOGIC */}
                                    {selectedField.type === 'matrix' && (
                                        <div className="bg-teal-500/5 p-6 rounded-[2rem] border border-teal-500/20 space-y-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Grid className="w-4 h-4 text-teal-400" />
                                                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Matrix Columns</span>
                                            </div>
                                            <input
                                                className="w-full bg-slate-950 border border-teal-500/20 rounded-xl px-4 py-3 text-white text-sm outline-none font-mono"
                                                placeholder="Result, Observation..."
                                                value={selectedField.matrixColumns}
                                                onChange={(e) => updateField('matrixColumns', e.target.value)}
                                            />
                                            <p className="text-[9px] text-slate-600 uppercase tracking-tighter">Comma-separated Clinical headers</p>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </main>
        </div>
    );
};

export default FormBuilder;
