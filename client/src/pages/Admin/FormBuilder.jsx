import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Layout, Type, Hash, Calendar, List, CheckSquare,
    Save, GripVertical, Trash2, Settings, Plus, Eye,
    Database, ArrowLeft, ArrowRight, FileText, Grid, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FormBuilder = () => {
    const navigate = useNavigate();
    const [formTitle, setFormTitle] = useState('New Research Form');
    const [fields, setFields] = useState([]);
    const [selectedField, setSelectedField] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Core Tables Hardcoded for Immediate Availability
    const [bindableTables, setBindableTables] = useState([
        { name: 'BiologicalAssets', label: 'Biological Assets (General)' },
        { name: 'BacterialStrains', label: 'Bacterial Strains' },
        { name: 'Bacteriophages', label: 'Bacteriophages' },
        { name: 'AntibioticDiscs', label: 'Antibiotic Discs' },
        { name: 'Plasmids', label: 'Plasmids' },
        { name: 'Primers', label: 'Primers' }
    ]);

    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Initial Load & Auth Check
    useEffect(() => {
        setIsMounted(true);
        const token = localStorage.getItem('token');
        if (!token) {
            // Show Login Modal or Redirect
            navigate('/login');
        }

        const init = async () => {
            // Simulate "loading" for smooth UX
            setTimeout(() => setIsLoading(false), 800);

            try {
                // We use the hardcoded tables as base, merge if API succeeds
                const tablesRes = await api.get('/forms/meta/tables');
                if (tablesRes.data && tablesRes.data.length > 0) {
                    setBindableTables(tablesRes.data);
                }
            } catch (err) {
                console.error("Using offline tables", err);
                if (err.response && err.response.status === 401) {
                    navigate('/login');
                }
            }
        };
        init();
    }, [navigate]);

    // Toolbox Items - Hardcoded & Always Visible
    const toolboxItems = [
        { type: 'text', label: 'Text Input', icon: Type },
        { type: 'number', label: 'Number Input', icon: Hash },
        { type: 'textarea', label: 'Text Area', icon: List },
        { type: 'date', label: 'Date Picker', icon: Calendar },
        { type: 'dropdown', label: 'Relational Lookup', icon: Database },
        { type: 'matrix', label: 'Data Matrix', icon: Grid },
        { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
        { type: 'section', label: 'Section Header', icon: Layout },
    ];


    // Standard Field Definitions for Quick Start
    const standardFields = [
        { key: 'phage_id', label: 'Phage ID', type: 'text' },
        { key: 'host_strain', label: 'Host Strain', type: 'dropdown', binding: 'BacterialStrains' },
        { key: 'sensitivity_zone', label: 'Sensitivity Zone', type: 'number' },
        { key: 'incubation_time', label: 'Incubation Time', type: 'number' },
        { key: 'notes', label: 'Notes', type: 'textarea' }
    ];

    const addField = (type) => {
        const newField = {
            id: Date.now().toString(),
            type,
            label: `New ${type}`,
            placeholder: '',
            required: false,
            options: [],
            binding: '',
            width: 'full',
            databaseColumn: '' // New property for mapping
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

        // Auto-update Label if Database Column is selected
        if (key === 'databaseColumn') {
            const standard = standardFields.find(sf => sf.key === val);
            if (standard) {
                updated.label = standard.label;
                if (standard.binding) updated.binding = standard.binding;
            }
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
            }, 1500);
        } catch (err) {
            console.error(err);
            alert('Save Failed');
        } finally {
            setSaving(false);
        }
    };

    // --- RENDERERS ---

    const renderPreviewField = (field) => {
        const commonClasses = "block w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none mt-2";

        if (field.type === 'section') return <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2 mt-6 mb-4">{field.label}</h3>;

        return (
            <div className={`mb-4 ${field.width === 'half' ? 'w-1/2 inline-block px-2' : 'w-full'}`}>
                <label className="block text-xs font-bold text-slate-400 uppercase">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                    {field.linkedQuery?.active && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">Auto-Fill</span>}
                </label>

                {field.type === 'textarea' ? (
                    <textarea className={commonClasses} placeholder={field.placeholder} rows={3} />
                ) : field.type === 'dropdown' ? (
                    <select className={commonClasses}>
                        <option>Select...</option>
                        {field.binding ? <option disabled>(Bound to {field.binding} {field.multiColumn ? '[ID - Name]' : ''})</option> : null}
                    </select>
                ) : field.type === 'matrix' ? (
                    <div className="mt-2 overflow-hidden rounded-lg border border-slate-700">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="bg-slate-800 text-slate-200 font-bold uppercase text-xs">
                                <tr>
                                    {field.matrixColumns ? field.matrixColumns.split(',').map((c, i) => <th key={i} className="px-4 py-3">{c.trim()}</th>) : <th className="px-4 py-3">Column 1</th>}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-700 bg-slate-900/50">
                                    <td className="px-4 py-3 text-emerald-500 italic">Dynamic Entry Row...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : field.type === 'checkbox' ? (
                    <div className="mt-2 flex items-center gap-2">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500" />
                        <span className="text-sm text-slate-300">Yes</span>
                    </div>
                ) : (
                    <input type={field.type} className={commonClasses} placeholder={field.placeholder} disabled={field.linkedQuery?.active} value={field.linkedQuery?.active ? '(Auto-filled)' : ''} />
                )}
            </div>
        );
    };

    if (!isMounted) return null; // Prevent hydration mismatch

    // Properties Panel Renderer Check
    const renderPropertiesPanel = () => {
        if (!selectedField) return null;

        return (
            <div className="w-80 bg-slate-900/90 backdrop-blur-xl border-l border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</h3>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">

                    {/* TARGET ENTITY MAPPING */}
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-2">Target Entity / DB Column</label>
                        <select
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-emerald-500"
                            value={selectedField.databaseColumn || ''}
                            onChange={(e) => updateField('databaseColumn', e.target.value)}
                        >
                            <option value="">Custom / No Mapping</option>
                            {standardFields.map(sf => (
                                <option key={sf.key} value={sf.key}>{sf.label} ({sf.key})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Field Label</label>
                        <input
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                            value={selectedField.label}
                            onChange={(e) => updateField('label', e.target.value)}
                        />
                    </div>

                    {['text', 'number', 'textarea'].includes(selectedField.type) && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Placeholder</label>
                            <input
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                value={selectedField.placeholder}
                                onChange={(e) => updateField('placeholder', e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500"
                            checked={selectedField.required}
                            onChange={(e) => updateField('required', e.target.checked)}
                        />
                        <label className="text-sm font-bold text-slate-300">Required Field</label>
                    </div>

                    {/* RELATIONAL BINDING */}
                    {selectedField.type === 'dropdown' && (
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                                <Database className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Table Binding</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Bind this dropdown to a system table to auto-populate options.
                            </p>
                            <select
                                className="w-full bg-slate-900 border border-indigo-500/30 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                value={selectedField.binding}
                                onChange={(e) => updateField('binding', e.target.value)}
                            >
                                <option value="">No Binding (Manual)</option>
                                {bindableTables.map(t => (
                                    <option key={t.name} value={t.name}>{t.label}</option>
                                ))}
                            </select>

                            <div className="flex items-center gap-2 pt-2 border-t border-indigo-500/20">
                                <input
                                    type="checkbox"
                                    className="rounded bg-slate-900 border-indigo-500/50 text-indigo-500"
                                    checked={selectedField.multiColumn || false}
                                    onChange={(e) => updateField('multiColumn', e.target.checked)}
                                />
                                <span className="text-xs text-indigo-300">Multi-Column (ID - Name)</span>
                            </div>
                        </div>
                    )}

                    {/* MATRIX CONFIGURATION */}
                    {selectedField.type === 'matrix' && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                <Grid className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Matrix Columns</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Define columns separated by commas (e.g., Antibiotic, Zone Size, Result).
                            </p>
                            <input
                                className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                                placeholder="Col1, Col2, Col3..."
                                value={selectedField.matrixColumns || ''}
                                onChange={(e) => updateField('matrixColumns', e.target.value)}
                            />
                        </div>
                    )}

                    {/* AUTO-FILL / LINKED QUERY */}
                    {['text', 'number'].includes(selectedField.type) && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-blue-400 mb-1">
                                <ArrowRight className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Auto-Fill Linkage</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Enable Fetch</span>
                                <input
                                    type="checkbox"
                                    className="rounded bg-slate-900 border-blue-500/50 text-blue-500"
                                    checked={selectedField.linkedQuery?.active || false}
                                    onChange={(e) => updateField('linkedQuery', { ...selectedField.linkedQuery, active: e.target.checked })}
                                />
                            </div>

                            {selectedField.linkedQuery?.active && (
                                <div className="space-y-2 animate-fade-in">
                                    <label className="text-[10px] text-blue-300 uppercase font-bold">Parent Field (Trigger)</label>
                                    <select
                                        className="w-full bg-slate-900 border border-blue-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none"
                                        value={selectedField.linkedQuery?.parentFieldId || ''}
                                        onChange={(e) => updateField('linkedQuery', { ...selectedField.linkedQuery, parentFieldId: e.target.value })}
                                    >
                                        <option value="">Select Parent...</option>
                                        {fields.filter(f => f.type === 'dropdown' && f.id !== selectedField.id).map(f => (
                                            <option key={f.id} value={f.id}>{f.label}</option>
                                        ))}
                                    </select>

                                    <label className="text-[10px] text-blue-300 uppercase font-bold mt-2 block">Source Column Name</label>
                                    <input
                                        className="w-full bg-slate-900 border border-blue-500/30 rounded-lg px-3 py-2 text-white text-sm outline-none placeholder-slate-600"
                                        placeholder="e.g. species"
                                        value={selectedField.linkedQuery?.sourceColumn || ''}
                                        onChange={(e) => updateField('linkedQuery', { ...selectedField.linkedQuery, sourceColumn: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-[#0F172A] flex flex-col overflow-hidden text-slate-200 font-sans relative">
            {/* HEADER */}
            <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <input
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="bg-transparent text-xl font-bold text-white border-none focus:ring-0 placeholder-slate-600"
                        placeholder="Form Title..."
                    />
                </div>
                <div className="flex items-center gap-3">
                    {showSuccess && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 animate-pulse">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-bold">Form Schema Saved Successfully</span>
                        </div>
                    )}
                    <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${previewMode ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <Eye className="w-4 h-4" />
                        {previewMode ? 'Edit Mode' : 'Preview'}
                    </button>
                    <button
                        onClick={saveForm}
                        disabled={saving}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Form'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: TOOLBOX (Hidden in Preview) */}
                {!previewMode && (
                    <div className="w-64 bg-slate-900/50 backdrop-blur-md border-r border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toolbox</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoading ? (
                                // Skeleton Loader for Toolbox
                                [1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse"></div>
                                ))
                            ) : (
                                toolboxItems.map(item => (
                                    <button
                                        key={item.type}
                                        onClick={() => addField(item.type)}
                                        className="w-full flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all group text-left shadow-sm"
                                    >
                                        <div className="p-2 bg-slate-900 rounded-lg group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 transition-colors">
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white">{item.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* CENTER: CANVAS */}
                <div className="flex-1 bg-[#0B1120] relative overflow-y-auto p-12">
                    {isLoading ? (
                        <div className="max-w-3xl mx-auto min-h-[500px] bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl p-8 relative animate-pulse">
                            <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
                            <div className="space-y-6">
                                <div className="h-20 bg-slate-800 rounded-xl"></div>
                                <div className="h-20 bg-slate-800 rounded-xl"></div>
                                <div className="h-20 bg-slate-800 rounded-xl"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto min-h-[500px] bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl p-8 relative">
                            {fields.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 m-4 rounded-2xl">
                                    <Layout className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Drag field here or click Toolbox to add</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fields.map((field) => (
                                        previewMode ? (
                                            <React.Fragment key={field.id}>{renderPreviewField(field)}</React.Fragment>
                                        ) : (
                                            <div
                                                key={field.id}
                                                onClick={() => setSelectedField(field)}
                                                className={`relative group p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedField?.id === field.id ? 'border-emerald-500 bg-slate-900' : 'border-transparent hover:border-slate-700 hover:bg-slate-900/50'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2 pointer-events-none">
                                                    <label className="text-xs font-bold text-slate-400 uppercase">{field.label}</label>
                                                    <GripVertical className="text-slate-600 w-4 h-4 opacity-0 group-hover:opacity-100" />
                                                </div>
                                                <div className="h-10 bg-slate-950 border border-slate-700 rounded-lg w-full opacity-50 pointer-events-none"></div>

                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                                    className="absolute -right-2 -top-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg hover:bg-rose-600 transition-all z-10"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            {previewMode && (
                                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                                    <button disabled className="px-6 py-3 bg-emerald-600 opacity-50 rounded-xl font-bold text-white cursor-not-allowed">
                                        Submit Form
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: PROPERTIES (Hidden in Preview) */}
                {!previewMode && renderPropertiesPanel()}
            </div>
        </div>
    );
};

export default FormBuilder;
