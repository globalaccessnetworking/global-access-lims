import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Save, Beaker, Dna, Activity, Search, AlertTriangle, CheckCircle, Plus, Trash2, Microscope, Thermometer, MapPin } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import { motion, AnimatePresence } from 'framer-motion';

const StrainEntry = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [lastStrainId, setLastStrainId] = useState('');
    const [sources, setSources] = useState([]);
    const [antibiotics, setAntibiotics] = useState([]);
    const [existingAssets, setExistingAssets] = useState([]);

    // Form State
    const initialForm = {
        strain_number: '',
        species: '',
        sub_species: '',
        source: '', // This will store source_id if selected, or string if manual?
        source_id: '',
        isolation_date: new Date().toISOString().split('T')[0],
        characteristics: '',
        gram_stain: 'Gram Positive',
        morphology: '',
        // Storage
        freezer_name: 'Freezer 1 (-80C)',
        box: searchParams.get('box') || '3', // Default to Box 3 (GS-14)
        position: searchParams.get('pos') || '',
        // Sensitivity
        antibiotic_sensitivity: [] // Array of { antibiotic_id, zone_size, interpretation }
    };

    const [formData, setFormData] = useState(initialForm);
    const [sensitivityRows, setSensitivityRows] = useState([]);

    // Fetch Initial Data
    const [boxAssets, setBoxAssets] = useState([]);

    // Fetch Initial Data & Strains for ID
    useEffect(() => {
        const initData = async () => {
            try {
                const [strainsRes, sourceRes, antiRes] = await Promise.all([
                    api.get('/assets', { params: { type: 'Strain', limit: 1 } }), // Just need latest, but we need numeric max. 
                    // Actually, to find max ID we might need all strains or a specific endpoint. 
                    // For now, let's fetch all Strains (lighter than all assets)
                    api.get('/assets', { params: { type: 'Strain' } }),
                    api.get('/sources'),
                    api.get('/antibiotics')
                ]);

                // Auto-Increment Logic
                // Assuming format ST-XXXX
                const numbers = strainsRes.data
                    .map(s => parseInt(s.strain_number.replace('ST-', '')))
                    .filter(n => !isNaN(n));

                const maxId = numbers.length > 0 ? Math.max(...numbers) + 1 : 1213;
                setLastStrainId(`ST-${maxId}`);
                setFormData(prev => ({ ...prev, strain_number: `ST-${maxId}` }));

                setSources(sourceRes.data);
                setAntibiotics(antiRes.data);

            } catch (err) {
                console.error("Init failed", err);
            }
        };
        initData();
    }, []);

    // Fetch Box Assets when Box changes
    useEffect(() => {
        const fetchBox = async () => {
            if (!formData.box) return;
            try {
                const res = await api.get('/assets', { params: { box: formData.box } });
                setBoxAssets(res.data);
            } catch (err) {
                console.error("Box fetch failed", err);
            }
        };
        fetchBox();
    }, [formData.box]);

    // Duplicate Check
    const checkDuplicate = async (val) => {
        if (!val) return;
        try {
            const res = await api.get('/assets', { params: { strain_number: val } });
            if (res.data.length > 0) {
                alert(`Warning: Strain ${val} already exists (ID: ${res.data[0].id})`);
            }
        } catch (e) { console.error(e); }
    };

    // ... existing handlers ...

    const handleChange = (e) => {
        // ...
    };

    // Handle Sensitivity Row Add
    const addSensitivityRow = () => {
        setSensitivityRows([...sensitivityRows, { antibiotic_id: '', zone_size: '', interpretation: 'Sensitive' }]);
    };

    const removeSensitivityRow = (index) => {
        const newRows = [...sensitivityRows];
        newRows.splice(index, 1);
        setSensitivityRows(newRows);
    };

    const updateSensitivityRow = (index, field, value) => {
        const newRows = [...sensitivityRows];
        newRows[index][field] = value;

        // Auto-interpret based on Zone Size (Mock Logic)
        if (field === 'zone_size') {
            const size = parseFloat(value);
            if (size >= 20) newRows[index].interpretation = 'Sensitive';
            else if (size >= 15) newRows[index].interpretation = 'Intermediate';
            else if (size > 0) newRows[index].interpretation = 'Resistant';
        }

        setSensitivityRows(newRows);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');

        try {
            // Check Duplicates Server-Side
            const dupRes = await api.get('/assets', { params: { strain_number: formData.strain_number } });
            if (dupRes.data.length > 0) {
                alert(`Error: Strain Number ${formData.strain_number} already exists!`);
                setLoading(false);
                return;
            }

            const payload = {
                type: 'Strain',
                species: formData.species + (formData.sub_species ? ` ${formData.sub_species}` : ''),
                strain_number: formData.strain_number,
                characteristics: `Gram: ${formData.gram_stain} | Morph: ${formData.morphology} | ${formData.characteristics}`,
                source_id: formData.source_id, // Send ID if using new model
                StorageLocation: {
                    freezer_name: formData.freezer_name,
                    box: formData.box,
                    position: formData.position
                },
                antibiotic_sensitivity: sensitivityRows.filter(r => r.antibiotic_id && r.zone_size)
            };

            await api.post('/assets', payload);

            setSuccess(`Strain ${formData.strain_number} Registered Successfully!`);
            // Reset but keep some context
            const nextNum = parseInt(formData.strain_number.replace('ST-', '')) + 1;
            setFormData(prev => ({
                ...initialForm,
                strain_number: `ST-${nextNum}`,
                box: prev.box,
                freezer_name: prev.freezer_name
            }));
            setSensitivityRows([]);

        } catch (error) {
            console.error(error);
            alert("Failed to save strain.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Occupied Slots for current Box
    const occupiedPositions = boxAssets
        .filter(a => a.StorageLocation)
        .map(a => a.StorageLocation.position);

    const isPositionOccupied = (pos) => occupiedPositions.includes(pos);

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-fade-in-up">

            {/* HEADER */}
            <div className="bg-[#0F172A] rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                <Microscope className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Bacterial Strain Portal</h1>
                        </div>
                        <p className="text-slate-400 ml-16 max-w-lg">
                            Comprehensive entry system for bacterial isolates with integrated antibiotic sensitivity profiling and storage tracking.
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="inline-block px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                            <p className="text-xs text-slate-500 uppercase font-bold">Next Recommended ID</p>
                            <p className="text-2xl font-mono font-bold text-emerald-400">{formData.strain_number}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN FORM */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: CORE DATA */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Identity Section */}
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <Dna className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-lg font-bold text-white">Strain Identity</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Strain No</label>
                                <input
                                    type="text"
                                    value={formData.strain_number}
                                    onChange={e => setFormData({ ...formData, strain_number: e.target.value })}
                                    onBlur={(e) => checkDuplicate(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Date Isolated</label>
                                <input
                                    type="date"
                                    value={formData.isolation_date}
                                    onChange={e => setFormData({ ...formData, isolation_date: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Species Name</label>
                                <SearchableSelect
                                    options={[
                                        { label: 'Staphylococcus aureus', value: 'Staphylococcus aureus' },
                                        { label: 'Pseudomonas aeruginosa', value: 'Pseudomonas aeruginosa' },
                                        { label: 'Escherichia coli', value: 'Escherichia coli' },
                                        { label: 'Klebsiella pneumoniae', value: 'Klebsiella pneumoniae' },
                                        { label: 'Acinetobacter baumannii', value: 'Acinetobacter baumannii' },
                                        { label: 'Salmonella enterica', value: 'Salmonella enterica' }
                                    ]}
                                    value={formData.species}
                                    onChange={val => setFormData({ ...formData, species: val })}
                                    placeholder="Select or Type Species..."
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Sub-species / Serotype</label>
                                <input
                                    type="text"
                                    value={formData.sub_species}
                                    onChange={e => setFormData({ ...formData, sub_species: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder-slate-600"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Clinical Source</label>
                                <select
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={formData.source_id}
                                    onChange={e => setFormData({ ...formData, source_id: e.target.value })}
                                >
                                    <option value="">Select Source...</option>
                                    {sources.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type})</option>)}
                                    <option value="new">+ Add New Source (N/A)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Characteristics */}
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <Activity className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-bold text-white">Microbiological Profile</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Gram Stain</label>
                                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gram_stain: 'Gram Positive' })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.gram_stain === 'Gram Positive'
                                            ? 'bg-purple-600 text-white shadow-lg'
                                            : 'text-slate-500 hover:text-white'
                                            }`}
                                    >
                                        Positive (+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, gram_stain: 'Gram Negative' })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.gram_stain === 'Gram Negative'
                                            ? 'bg-pink-600 text-white shadow-lg'
                                            : 'text-slate-500 hover:text-white'
                                            }`}
                                    >
                                        Negative (-)
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Colony Morphology</label>
                                <input
                                    type="text"
                                    value={formData.morphology}
                                    onChange={e => setFormData({ ...formData, morphology: e.target.value })}
                                    placeholder="e.g. Golden yellow, round..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Other Characteristics</label>
                                <textarea
                                    rows="2"
                                    value={formData.characteristics}
                                    onChange={e => setFormData({ ...formData, characteristics: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* ANTIBIOTIC SENSITIVITY SUB-FORM */}
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <Beaker className="w-5 h-5 text-rose-500" />
                                <h3 className="text-lg font-bold text-white">Antibiotic Susceptibility</h3>
                            </div>
                            <button
                                type="button"
                                onClick={addSensitivityRow}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold transition-colors border border-slate-700"
                            >
                                <Plus className="w-3 h-3" /> Add Disc
                            </button>
                        </div>

                        <div className="space-y-3">
                            {sensitivityRows.length === 0 && (
                                <p className="text-center text-slate-600 text-sm py-4 italic">No antibiotic data added.</p>
                            )}

                            {sensitivityRows.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-slate-900/50 p-3 rounded-xl border border-slate-800 animate-fade-in">
                                    <div className="col-span-12 md:col-span-5">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Antibiotic</label>
                                        <select
                                            value={row.antibiotic_id}
                                            onChange={e => updateSensitivityRow(idx, 'antibiotic_id', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                                        >
                                            <option value="">Select Disc...</option>
                                            {antibiotics.map(a => <option key={a.id} value={a.id}>{a.name} [{a.code || 'N/A'}]</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-6 md:col-span-3">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Zone (mm)</label>
                                        <input
                                            type="number"
                                            value={row.zone_size}
                                            onChange={e => updateSensitivityRow(idx, 'zone_size', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-3">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Result</label>
                                        <div className={`px-3 py-2 rounded-lg text-xs font-bold text-center border ${row.interpretation === 'Resistant' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            row.interpretation === 'Intermediate' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {row.interpretation}
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeSensitivityRow(idx)}
                                            className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: STORAGE & ACTIONS */}
                <div className="space-y-6">

                    {/* Visual Storage Binding */}
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg sticky top-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <MapPin className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-white">Storage Link</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Freezer Unit</label>
                                <select
                                    value={formData.freezer_name}
                                    onChange={e => setFormData({ ...formData, freezer_name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                >
                                    <option>Freezer 1 (-80C)</option>
                                    <option>Freezer 2 (-80C)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Box</label>
                                <select
                                    value={formData.box}
                                    onChange={e => setFormData({ ...formData, box: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white"
                                >
                                    <option value="3">Box GS-14 (Strains)</option>
                                    <option value="2">Box GS-13 (Phages)</option>
                                    <option value="12">Box GS-12 (Plasmids)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-emerald-400 uppercase mb-2 flex justify-between">
                                    Target Position
                                </label>
                                <select
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-white font-mono font-bold text-lg focus:ring-2 focus:ring-emerald-500 outline-none ${isPositionOccupied(formData.position) ? 'border-rose-500' : 'border-slate-700'
                                        }`}
                                >
                                    <option value="">Select Slot...</option>
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(row => (
                                        [1, 2, 3, 4, 5, 6, 7, 8, 9].map(col => {
                                            const pos = `${row}${col}`;
                                            const isOcc = isPositionOccupied(pos);
                                            return (
                                                <option
                                                    key={pos}
                                                    value={pos}
                                                    disabled={isOcc}
                                                    className={isOcc ? 'text-slate-600 bg-slate-950' : 'text-white'}
                                                >
                                                    {pos} {isOcc ? '(Occupied)' : ''}
                                                </option>
                                            )
                                        })
                                    ))}
                                </select>
                                <div className="flex items-center justify-between mt-2 px-1">
                                    <p className="text-[10px] text-slate-500">
                                        Box {formData.box}: {81 - occupiedPositions.length} Slots Available
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${formData.position && !isPositionOccupied(formData.position) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-700'}`}></div>
                                        <span className={`text-[10px] font-bold ${formData.position && !isPositionOccupied(formData.position) ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {formData.position ? 'SELECTED' : 'WAITING'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${loading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 animate-pulse-glow'
                                        }`}
                                >
                                    {loading ? <Activity className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                    <span>{loading ? 'Registering Strain...' : 'Confirm Entry'}</span>
                                </button>
                            </div>
                        </div>

                        {/* SUCCESS MESSAGE */}
                        <AnimatePresence>
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        <div>
                                            <p className="font-bold text-emerald-400 text-sm">Success!</p>
                                            <p className="text-emerald-500/80 text-xs">Record saved to DB.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                                        onClick={() => alert("Printing QR Code for Dymo LabelWriter 450...")}
                                    >
                                        <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                                            <div className="bg-white rounded-[1px]"></div><div className="bg-white rounded-[1px]"></div>
                                            <div className="bg-white rounded-[1px]"></div><div className="bg-transparent rounded-[1px]"></div>
                                        </div>
                                        Print Tube Label
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

            </form>
        </div>
    );
};

export default StrainEntry;
