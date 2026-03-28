import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    PlusSquare, Save, Bug, Beaker, Dna, FileText, CheckCircle,
    FlaskConical, AlertTriangle, Disc, X, Search, Microscope,
    Activity, ArrowLeft, LayoutGrid, Database, Trash2, Plus
} from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';

const AddData = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('hub'); // 'hub' | 'form'
    const [activeTab, setActiveTab] = useState('Strain');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [customForms, setCustomForms] = useState([]);

    // Dynamic Form State
    const [selectedCustomForm, setSelectedCustomForm] = useState(null);
    const [dynamicData, setDynamicData] = useState({});
    const [lookupCache, setLookupCache] = useState({}); // Cache for relational options

    // Hub Stats
    const [counts, setCounts] = useState({
        Strain: 0,
        Phage: 0,
        Plasmid: 0,
        Primer: 0,
        Antibiotic: 0,
        Chemical: 0
    });

    const [duplicateWarning, setDuplicateWarning] = useState('');
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateDetails, setDuplicateDetails] = useState(null);
    const [speciesOptions, setSpeciesOptions] = useState([]);
    const [hostOptions, setHostOptions] = useState([]);
    const [antibioticOptions, setAntibioticOptions] = useState([]);

    // Initial Form State
    const initialForm = {
        type: 'Strain',
        // Common
        species: '',
        strain_number: '',
        source: '',
        characteristics: '',
        // Strain Specific
        strain_type: 'Wild-type',
        // Phage Specific
        host_strain: '',
        plaque_morphology: '',
        titer: '',
        lifecycle: 'Lytic',
        capsid_diameter: '',
        tail_length: '',
        virus_family: 'Myoviridae',
        image_url: '',
        // Plasmid/Primer Specific
        sequence: '',
        backbone: '',
        resistance_marker: '',
        // Location
        freezer_name: 'Freezer 1 (-80C)',
        box: '2', // Default to Box 2 (GS-13)
        position: 'A1',
        // Lab Stock
        barcode: '',
        chemical_name: '',
        current_volume: '',
        threshold_limit: '',
        unit: 'mL',
        ghs_hazards: [],
        signal_word: 'None',
        sds_url: ''
    };

    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        // Fetch Assets for Autocomplete & Stats
        const fetchAssets = async () => {
            try {
                const [assetsRes, antiRes, invRes, formsRes] = await Promise.all([
                    api.get('/assets'),
                    api.get('/antibiotics'),
                    api.get('/inventory'),
                    api.get('/forms').catch(() => ({ data: [] })) // Graceful fail for forms
                ]);

                const assets = assetsRes.data;
                const forms = formsRes.data || [];
                setCustomForms(forms);

                // Calculate Stats
                const newCounts = {
                    Strain: assets.filter(a => a.type === 'Strain').length,
                    Phage: assets.filter(a => a.type === 'Phage').length,
                    Plasmid: assets.filter(a => a.type === 'Plasmid').length,
                    Primer: assets.filter(a => a.type === 'Primer').length,
                    Antibiotic: antiRes.data.length,
                    Chemical: invRes.data.length
                };
                setCounts(newCounts);

                // Unique Species for Autocomplete
                const uniqueSpecies = [...new Set(assets.map(a => a.species))].filter(Boolean);
                setSpeciesOptions(uniqueSpecies);

                // Hosts for Phage Form (Filter Strains)
                const strains = assets.filter(a => a.type === 'Strain');
                setHostOptions(strains);

                setAntibioticOptions(antiRes.data.map(a => a.name));

            } catch (e) {
                console.error("Init failed", e);
                if (e.response && e.response.status === 401) navigate('/login');
            }
        };

        fetchAssets();
    }, [navigate]);

    // --- DYNAMIC FORM LOGIC ---

    const fetchRelationalData = async (tableName) => {
        if (lookupCache[tableName]) return lookupCache[tableName];
        try {
            const res = await api.get(`/forms/lookup/${tableName}`);
            setLookupCache(prev => ({ ...prev, [tableName]: res.data }));
            return res.data;
        } catch (err) {
            console.error("Lookup failed", err);
            return [];
        }
    };

    const handleDynamicChange = async (fieldId, value) => {
        setDynamicData(prev => ({ ...prev, [fieldId]: value }));

        // AUTO-FILL LOGIC
        if (selectedCustomForm) {
            const affectedFields = selectedCustomForm.schema_json.filter(f =>
                f.linkedQuery?.active && f.linkedQuery?.parentFieldId === fieldId
            );

            if (affectedFields.length > 0) {
                // Find the parent field definition to know which table to look in
                const parentFieldDef = selectedCustomForm.schema_json.find(f => f.id === fieldId);
                const tableName = parentFieldDef?.binding;

                if (tableName) {
                    // Ensure we have data
                    const tableData = await fetchRelationalData(tableName);
                    // Find the selected row (assuming value is ID or Name)
                    // We try to match by ID first, then Name
                    const selectedRow = tableData.find(r => r.id?.toString() === value?.toString() || r.name === value);

                    if (selectedRow) {
                        const updates = {};
                        affectedFields.forEach(child => {
                            const sourceCol = child.linkedQuery.sourceColumn;
                            if (selectedRow[sourceCol] !== undefined) {
                                updates[child.id] = selectedRow[sourceCol];
                            }
                        });
                        if (Object.keys(updates).length > 0) {
                            setDynamicData(prev => ({ ...prev, ...updates }));
                        }
                    }
                }
            }
        }
    };

    const handleMatrixChange = (fieldId, rowId, colIndex, val) => {
        setDynamicData(prev => {
            const currentRows = prev[fieldId] || [];
            // rowId is a unique simple ID like timestamp
            const existingRowIndex = currentRows.findIndex(r => r._id === rowId);
            const newRows = [...currentRows];

            if (existingRowIndex > -1) {
                newRows[existingRowIndex] = { ...newRows[existingRowIndex], [colIndex]: val };
            } else {
                newRows.push({ _id: rowId, [colIndex]: val });
            }
            return { ...prev, [fieldId]: newRows };
        });
    };

    const addMatrixRow = (fieldId) => {
        setDynamicData(prev => {
            const currentRows = prev[fieldId] || [];
            return { ...prev, [fieldId]: [...currentRows, { _id: Date.now() }] };
        });
    };

    const removeMatrixRow = (fieldId, rowId) => {
        setDynamicData(prev => ({
            ...prev,
            [fieldId]: (prev[fieldId] || []).filter(r => r._id !== rowId)
        }));
    };

    const renderDynamicForm = () => {
        if (!selectedCustomForm) return null;

        return (
            <div className="space-y-6 animate-fade-in">
                {selectedCustomForm.schema_json.map(field => {
                    if (field.type === 'section') return <h3 key={field.id} className="text-xl font-bold text-emerald-400 border-b border-slate-700 pb-2 pt-4">{field.label}</h3>;

                    const widthClass = field.width === 'half' ? 'col-span-1' : 'col-span-2';
                    const isAutoFilled = field.linkedQuery?.active;

                    return (
                        <div key={field.id} className={widthClass}>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-emerald-500"
                                    rows={3}
                                    value={dynamicData[field.id] || ''}
                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            ) : field.type === 'dropdown' ? (
                                <RelationalDropdown
                                    field={field}
                                    value={dynamicData[field.id] || ''}
                                    onChange={(val) => handleDynamicChange(field.id, val)}
                                />
                            ) : field.type === 'matrix' ? (
                                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-xs">
                                            <tr>
                                                {(field.matrixColumns || 'Column 1').split(',').map((c, i) => (
                                                    <th key={i} className="px-4 py-3">{c.trim()}</th>
                                                ))}
                                                <th className="px-2 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(dynamicData[field.id] || []).map((row) => (
                                                <tr key={row._id} className="border-t border-slate-700/50">
                                                    {(field.matrixColumns || 'Column 1').split(',').map((c, i) => (
                                                        <td key={i} className="p-2">
                                                            <input
                                                                className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                value={row[i] || ''}
                                                                onChange={(e) => handleMatrixChange(field.id, row._id, i, e.target.value)}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => removeMatrixRow(field.id, row._id)} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        type="button"
                                        onClick={() => addMatrixRow(field.id)}
                                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Row
                                    </button>
                                </div>
                            ) : field.type === 'checkbox' ? (
                                <div className="flex items-center gap-3 h-full">
                                    <input
                                        type="checkbox"
                                        className="w-6 h-6 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                                        checked={!!dynamicData[field.id]}
                                        onChange={(e) => handleDynamicChange(field.id, e.target.checked)}
                                    />
                                    <span className="text-slate-300">Yes, confirm selection</span>
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    className={`w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-emerald-500 ${isAutoFilled ? 'bg-slate-900/50 text-slate-400 cursor-not-allowed' : ''}`}
                                    value={dynamicData[field.id] || ''}
                                    onChange={(e) => handleDynamicChange(field.id, e.target.value)}
                                    placeholder={field.placeholder}
                                    readOnly={isAutoFilled}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };



    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (['strain_number', 'sequence', 'barcode', 'species'].includes(e.target.name)) {
            setDuplicateWarning('');
        }
    };

    // Real-time Duplicate Checker
    const handleBlur = async (e) => {
        const field = e.target.name;
        const val = e.target.value;
        if (!val) return;

        if (['strain_number', 'sequence', 'barcode', 'species'].includes(field)) {
            try {
                if (activeTab === 'Lab-Stock') {
                    const res = await api.get('/inventory');
                    const exists = res.data.find(c => c.barcode === val);
                    if (exists) {
                        setDuplicateWarning(`Inventory Record Found: ${exists.name} (${exists.current_volume} ${exists.unit})`);
                    }
                } else if (activeTab !== 'Antibiotics Discs') {
                    // Check Assets Server-Side
                    let exists = null;

                    if (field === 'strain_number') {
                        const res = await api.get('/assets', { params: { strain_number: val } });
                        if (res.data.length > 0) exists = res.data[0];
                    }

                    if (exists) {
                        setDuplicateWarning(`Duplicate Warning: ${field} exists used by Asset #${exists.id}`);
                    }
                }
            } catch (error) {
                console.error("Check failed", error);
            }
        }
    };

    // Hub Navigation Logic
    const handleCardClick = (type, customData = null) => {
        if (customData?.isCustom) {
            // Set up Custom Form View
            setActiveTab(customData.label);
            setView('form');
            setSelectedCustomForm(customData); // Set the full schema
            setFormData(prev => ({ ...initialForm, type: 'Custom', customFormId: customData.id }));
            return;
        }

        if (type === 'Strain') {
            navigate('/strain-entry');
        } else if (type === 'Phage') {
            navigate('/phage-entry');
        } else {
            // Simplify logic: Mapping Type to Tab Name
            let tabName = type;
            if (type === 'Chemical') tabName = 'Lab-Stock';
            else if (type === 'Antibiotic') tabName = 'Antibiotics Discs';

            setActiveTab(tabName);
            setView('form');

            // Reset form for new entry context
            setFormData(prev => ({
                ...initialForm,
                type: type === 'Antibiotic' ? 'Antibiotic' : type === 'Chemical' ? 'Chemical' : type,
                freezer_name: prev.freezer_name,
                box: prev.box,
                position: prev.position
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');

        try {
            if (activeTab === 'Antibiotics Discs') {
                await api.post('/antibiotics', {
                    name: formData.antibiotic_name,
                    quantity: formData.antibiotic_quantity
                });
            } else if (activeTab === 'Lab-Stock') {
                await api.put('/inventory', {
                    barcode: formData.barcode,
                    name: formData.chemical_name,
                    current_volume: formData.current_volume,
                    threshold_limit: formData.threshold_limit,
                    unit: formData.unit,
                    ghs_hazards: formData.ghs_hazards,
                    signal_word: formData.signal_word,
                    sds_url: formData.sds_url
                });
            } else if (selectedCustomForm) {
                // CUSTOM FORM SUBMISSION
                // We send the dynamic data map directly
                await api.post(`/forms/${selectedCustomForm.id}/submissions`, {
                    data: dynamicData,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Asset Submission
                let chars = formData.characteristics;

                // Construct Characteristics based on Type
                if (activeTab === 'Plasmid') {
                    chars = `BB: ${formData.backbone} | Res: ${formData.resistance_marker}`;
                }

                const payload = {
                    type: formData.type,
                    species: formData.species,
                    strain_number: formData.strain_number,
                    source: formData.source,
                    characteristics: chars,
                    image_url: formData.image_url,
                    sequence_data: formData.sequence,
                    StorageLocation: {
                        freezer_name: formData.freezer_name,
                        box: formData.box,
                        position: formData.position
                    }
                };

                await api.post('/assets', payload);
            }

            setSuccess(`Successfully added ${activeTab} record!`);
            // Clear specific fields but keep location
            if (activeTab !== 'Strain') {
                setFormData(prev => ({
                    ...initialForm,
                    type: prev.type,
                    freezer_name: prev.freezer_name,
                    box: prev.box,
                    position: prev.position
                }));
                // Reset Dynamic Data
                setDynamicData({});
            }

        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to add record. See console.");
        } finally {
            setLoading(false);
        }
    };

    const isLowStock = activeTab === 'Lab-Stock' &&
        formData.current_volume &&
        formData.threshold_limit &&
        Number(formData.current_volume) < Number(formData.threshold_limit);

    // Render Hub Grid
    if (view === 'hub') {
        const actionCards = [
            { type: 'Strain', label: 'Bacterial Strain', icon: Beaker, count: counts.Strain, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { type: 'Phage', label: 'Bacteriophage', icon: Bug, count: counts.Phage, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            { type: 'Plasmid', label: 'Plasmid DNA', icon: Dna, count: counts.Plasmid, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { type: 'Primer', label: 'Primer', icon: FileText, count: counts.Primer, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { type: 'Antibiotic', label: 'Antibiotic Disc', icon: Disc, count: counts.Antibiotic, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
            { type: 'Chemical', label: 'Lab Chemical', icon: FlaskConical, count: counts.Chemical, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        ];

        // Combine Native + Custom Forms
        const allCards = [
            ...actionCards,
            ...customForms.map(f => ({
                type: 'Custom',
                id: f.id,
                label: f.title,
                icon: FileText,
                count: 0, // dynamic count could be added later
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
                isCustom: true
            }))
        ];

        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-12">
                {/* HUB HEADER */}
                <div className="bg-[#0F172A] rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <LayoutGrid className="w-10 h-10 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Data Entry Hub</h1>
                                <p className="text-slate-400 text-sm mt-1">Select an asset type to begin accession.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACTION GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allCards.map((card, idx) => (
                        <button
                            key={card.id || card.type}
                            onClick={() => handleCardClick(card.type, card)}
                            className={`group relative p-8 rounded-3xl border ${card.border} bg-[#0F172A] hover:bg-slate-900 transition-all duration-300 hover:scale-[1.02] shadow-xl text-left overflow-hidden`}
                            style={{ backdropFilter: 'blur(15px)' }}
                        >
                            {card.isCustom && (
                                <div className="absolute top-4 right-4 px-2 py-0.5 bg-purple-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide">
                                    Custom
                                </div>
                            )}
                            <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl ${card.bg} border-b border-l ${card.border}`}>
                                <card.icon className={`w-8 h-8 ${card.color}`} />
                            </div>

                            <div className="relative z-10 mt-4">
                                <h3 className="text-2xl font-bold text-white mb-2">{card.label}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-3xl font-mono font-bold ${card.color}`}>{card.count}</span>
                                    <span className="text-slate-500 text-sm uppercase font-bold mt-2">Registered</span>
                                </div>
                            </div>

                            <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-${card.color.split('-')[1]}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        </button>
                    ))}

                    {/* Empty State / Create New Button */}
                    {customForms.length === 0 && (
                        <button
                            onClick={() => window.location.href = '/admin/form-builder'}
                            className="group relative p-8 rounded-3xl border-2 border-dashed border-indigo-500 hover:border-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all duration-300 text-left flex flex-col items-center justify-center text-indigo-400 hover:text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                        >
                            <PlusSquare className="w-16 h-16 mb-4 animate-pulse" />
                            <span className="text-2xl font-bold">Create New Form</span>
                            <span className="text-sm uppercase mt-2 font-bold tracking-widest opacity-80">Admin Architect</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Render Inline Form (Plasmid, Primer, Chemical)
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-12">

            {/* Back Button */}
            <button
                onClick={() => setView('hub')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
            >
                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm uppercase tracking-wide">Back to Hub</span>
            </button>

            {/* FORM CONTAINER */}
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-1 overflow-hidden relative min-h-[600px]">

                {/* HEADER */}
                <div className="p-8 border-b border-slate-800 flex items-center gap-4">
                    {activeTab === 'Plasmid' && <Dna className="w-8 h-8 text-purple-500" />}
                    {activeTab === 'Primer' && <FileText className="w-8 h-8 text-amber-500" />}
                    {activeTab === 'Lab-Stock' && <FlaskConical className="w-8 h-8 text-blue-500" />}
                    {activeTab === 'Antibiotics Discs' && <Disc className="w-8 h-8 text-rose-500" />}

                    <div>
                        <h2 className="text-2xl font-bold text-white">{activeTab === 'Lab-Stock' ? 'Chemical Inventory' : activeTab} Entry</h2>
                        <p className="text-slate-400 text-sm">Fill in the details below.</p>
                    </div>
                </div>

                {/* SUCCESS OVERLAY */}
                {success && (
                    <div className="absolute inset-0 z-30 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                        <div className="bg-slate-800 p-8 rounded-3xl border border-emerald-500/50 shadow-2xl flex flex-col items-center gap-4 animate-scale-in max-w-sm w-full">
                            <div className="p-4 bg-emerald-500/20 rounded-full text-emerald-400 border border-emerald-500/30">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">Entry Recorded</h3>
                            <p className="text-slate-400 text-center font-medium">{success}</p>
                            <button
                                onClick={() => setSuccess('')}
                                className="mt-4 w-full px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
                            >
                                Add Another Entry
                            </button>
                        </div>
                    </div>
                )}

                <div className={`h-1.5 w-full bg-slate-800`}></div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* WARNING BANNER */}
                    {duplicateWarning && (
                        <div className="bg-rose-900/20 border border-rose-500/30 p-4 rounded-xl flex items-center gap-3 text-rose-300 font-bold animate-pulse">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            {duplicateWarning}
                        </div>
                    )}

                    {/* DATALISTS */}
                    <datalist id="species-list">{speciesOptions.map((s, i) => <option key={i} value={s} />)}</datalist>
                    <datalist id="antibiotics-list">{antibioticOptions.map((a, i) => <option key={i} value={a} />)}</datalist>

                    {/* FORM LOGIC SWITCHER */}
                    {activeTab === 'Antibiotics Discs' ? (
                        /* --- ANTIBIOTICS FORM --- */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-emerald-400 uppercase mb-2 ml-1">Antibiotic Name</label>
                                <SearchableSelect
                                    options={antibioticOptions.map(a => ({ label: a, value: a }))}
                                    value={formData.antibiotic_name}
                                    onChange={(val) => {
                                        setFormData(prev => ({ ...prev, antibiotic_name: val }));
                                        setTimeout(() => document.getElementById('antibiotic-qty').focus(), 100);
                                    }}
                                    placeholder="Search Antibiotic..."
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-emerald-400 uppercase mb-2 ml-1">Quantity Added</label>
                                <div className="relative">
                                    <input
                                        id="antibiotic-qty"
                                        type="number" name="antibiotic_quantity" required min="1"
                                        value={formData.antibiotic_quantity} onChange={handleChange}
                                        className="w-full pl-6 pr-16 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <span className="absolute right-6 top-5 text-slate-500 font-bold text-sm">DISCS</span>
                                </div>
                            </div>
                        </div>

                    ) : selectedCustomForm ? (
                        /* --- CUSTOM DYNAMIC FORM --- */
                        renderDynamicForm()

                    ) : activeTab === 'Lab-Stock' ? (
                        /* --- LAB STOCK FORM --- */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            {/* Barcode Scanner */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Barcode / ID</label>
                                <div className="relative">
                                    <input type="text" name="barcode" required autoFocus
                                        value={formData.barcode} onChange={handleChange} onBlur={handleBlur}
                                        placeholder="Scan barcode here..."
                                        className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-slate-600"
                                    />
                                    <Activity className="absolute left-4 top-4.5 text-purple-500 w-6 h-6 animate-pulse" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Chemical Name</label>
                                <input type="text" name="chemical_name" required
                                    value={formData.chemical_name} onChange={handleChange}
                                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Current Volume</label>
                                <div className="flex gap-2">
                                    <input type="number" name="current_volume" required
                                        value={formData.current_volume} onChange={handleChange}
                                        className={`w-full px-5 py-4 bg-slate-800 border rounded-2xl text-white font-mono text-xl focus:ring-2 focus:ring-emerald-500 ${isLowStock ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'}`}
                                    />
                                    <select name="unit" value={formData.unit} onChange={handleChange} className="w-24 bg-slate-800 border border-slate-700 rounded-2xl text-white px-3 font-bold">
                                        <option>mL</option><option>L</option><option>g</option><option>kg</option>
                                    </select>
                                </div>
                                {isLowStock && <p className="text-rose-500 text-xs font-bold mt-2 animate-pulse flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> LOW STOCK WARNING</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Low Stock Threshold</label>
                                <input type="number" name="threshold_limit" required
                                    value={formData.threshold_limit} onChange={handleChange}
                                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div className="col-span-2 space-y-4">
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider pb-2 border-b border-slate-800">Chemical Safety (GHS)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Signal Word</label>
                                        <select name="signal_word" value={formData.signal_word} onChange={handleChange} className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-blue-500">
                                            <option value="None">None</option>
                                            <option value="Warning">Warning</option>
                                            <option value="Danger">Danger</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">SDS URL</label>
                                        <input type="url" name="sds_url" value={formData.sds_url} onChange={handleChange} placeholder="https://..." className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Hazard Pictograms (GHS Codes)</label>
                                        <div className="flex flex-wrap gap-2 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                                            {['GHS01', 'GHS02', 'GHS03', 'GHS04', 'GHS05', 'GHS06', 'GHS07', 'GHS08', 'GHS09'].map(code => (
                                                <button
                                                    key={code}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = formData.ghs_hazards || [];
                                                        const next = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
                                                        setFormData({ ...formData, ghs_hazards: next });
                                                    }}
                                                    className={`px-3 py-2 rounded-lg border font-mono text-xs transition-all ${formData.ghs_hazards?.includes(code) ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                                >
                                                    {code}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-2 ml-1 italic text-right">* GHS01: Explosive, GHS02: Flammable, GHS05: Corrosive, GHS06: Toxic, etc.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : (
                        /* --- ASSET FORMS (PLASMID, PRIMER) --- */
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                                        {activeTab === 'Primer' ? 'Primer Name' : activeTab === 'Plasmid' ? 'Plasmid Name' : 'Name'}
                                    </label>
                                    <input type="text" name="species" required list="species-list"
                                        value={formData.species} onChange={handleChange} onBlur={handleBlur}
                                        className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                                        {activeTab === 'Primer' ? 'Unique ID' : 'Catalog / ID No.'}
                                    </label>
                                    <input type="text" name="strain_number" onBlur={handleBlur}
                                        value={formData.strain_number} onChange={handleChange}
                                        className={`w-full px-5 py-4 bg-slate-800 border rounded-2xl text-white font-mono text-lg focus:ring-2 focus:ring-emerald-500 ${duplicateWarning && formData.strain_number ? 'border-rose-500' : 'border-slate-700'}`}
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-6">
                                <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-700">Detailed Profile</h3>

                                {activeTab === 'Plasmid' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Backbone Vector</label>
                                            <input name="backbone" value={formData.backbone} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white" placeholder="e.g. pET-28a" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Antibiotic Marker</label>
                                            <input name="resistance_marker" value={formData.resistance_marker} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white" placeholder="e.g. Kan+" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Sequence</label>
                                            <textarea name="sequence" rows="2" value={formData.sequence} onChange={handleChange} className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white font-mono text-xs" spellCheck="false"></textarea>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Primer' && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">DNA Sequence (5' - 3')</label>
                                        <textarea name="sequence" rows="3" value={formData.sequence} onChange={handleChange} onBlur={handleBlur} className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white font-mono text-xs ${duplicateWarning && formData.sequence ? 'border-rose-500' : 'border-slate-600'}`}></textarea>
                                    </div>
                                )}
                            </div>

                            {/* STORAGE LOCATOR COMMON */}
                            <div className="bg-slate-800/30 p-6 rounded-2xl border border-dashed border-slate-700 grid grid-cols-3 gap-6">
                                <div className="col-span-3 pb-2 border-b border-slate-700/50 mb-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Physical Storage</h3>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Freezer</label>
                                    <select name="freezer_name" value={formData.freezer_name} onChange={handleChange} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm">
                                        <option>-80 Freezer A (Main)</option><option>-80 Freezer B (Backup)</option>
                                        <option>-20 Freezer (Enzymes)</option><option>4C Fridge (Media)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Box</label>
                                    <select name="box" value={formData.box} onChange={handleChange} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm">
                                        <option value="2">Box GS-13 (Phages)</option>
                                        <option value="3">Box GS-14 (Strains)</option>
                                        <option value="12">Box GS-12 (Plasmids)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Position</label>
                                    <input name="position" value={formData.position} onChange={handleChange} className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-center font-mono font-bold" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOOTER ACTIONS */}
                    <div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
                        <button type="button" onClick={() => setFormData(initialForm)} className="px-6 py-3 text-slate-400 font-bold hover:text-white transition-colors">
                            Reset Form
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 box-shadow-glow'
                                }`}
                        >
                            {loading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>Confirm Entry</span>
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

// Helper Component for Lookup Dropdowns
const RelationalDropdown = ({ field, value, onChange }) => {
    const [options, setOptions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (field.binding) {
                try {
                    const res = await api.get(`/forms/lookup/${field.binding}`);
                    setOptions(res.data);
                } catch (err) {
                    console.error("Dropdown lookup failed", err);
                }
            }
        };
        fetchData();
    }, [field.binding]);

    return (
        <select
            className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-emerald-500 appearance-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Select {field.label}...</option>
            {options.map((opt, i) => (
                <option key={i} value={opt.id || opt.name}>
                    {field.multiColumn ? `${opt.id} - ${opt.name}` : (opt.name || opt.id)}
                </option>
            ))}
        </select>
    );
};

export default AddData;
