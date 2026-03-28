import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { Save, Bug, Activity, MapPin, CheckCircle, Upload, ZoomIn, FileText, FlaskConical, Dna } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import { motion, AnimatePresence } from 'framer-motion';

const PhageEntry = () => {
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [hosts, setHosts] = useState([]);
    const [boxAssets, setBoxAssets] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);

    // Form State
    const initialForm = {
        phage_name: '',
        isolation_date: new Date().toISOString().split('T')[0],
        host_strain: '', // ID or Strain Number
        lifecycle: 'Lytic',
        morphology: '',
        titer: '',
        plaque_morphology: '',
        image_url: '',
        // Storage
        freezer_name: 'Freezer 1 (-80C)',
        box: searchParams.get('box') || '2', // Default for Phages
        position: searchParams.get('pos') || ''
    };

    const [formData, setFormData] = useState(initialForm);

    // 1. Fetch Hosts (Strains) & Init Data
    useEffect(() => {
        const initData = async () => {
            try {
                const res = await api.get('/assets', { params: { type: 'Strain' } });
                setHosts(res.data);
            } catch (err) {
                console.error("Init failed", err);
            }
        };
        initData();
    }, []);

    // 2. Fetch Box Occupancy
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

    // Handlers
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData({ ...formData, image_url: reader.result }); // Store Base64 for now
            };
            reader.readAsDataURL(file);
        }
    };

    const formatTiter = (val) => {
        // Simple visual formatter if needed, but keeping raw input for scientific notation is standard
        return val;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');

        try {
            // Prepare structured morphology/metadata
            const morphologyData = {
                titer: formData.titer,
                plaque: formData.plaque_morphology,
                virion: formData.morphology,
                lifecycle: formData.lifecycle,
                isolation_date: formData.isolation_date,
                host_strain: formData.host_strain
            };

            const payload = {
                type: 'Phage',
                species: formData.phage_name,
                strain_number: formData.phage_name, // Unique ID
                host_strain: formData.host_strain, // Send explicitly for controller to catch
                characteristics: `Host: ${formData.host_strain} | Life: ${formData.lifecycle} | Plaque: ${formData.plaque_morphology} | Titer: ${formData.titer}`,
                image_url: formData.image_url,
                morphology: morphologyData, // Send JSON object
                StorageLocation: {
                    freezer_name: formData.freezer_name,
                    box: formData.box,
                    position: formData.position
                }
            };

            await api.post('/assets', payload);
            setSuccess(`Bacteriophage ${formData.phage_name} Registered!`);

            // Reset
            setFormData(prev => ({
                ...initialForm,
                freezer_name: prev.freezer_name,
                box: prev.box
            }));
            setImagePreview(null);

        } catch (error) {
            console.error(error);
            // Show specific server error if available (e.g. Duplicate ID)
            const msg = error.response?.data?.msg || "Failed to save phage.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    // Storage Logic
    const occupiedPositions = boxAssets
        .filter(a => a.StorageLocation)
        .map(a => a.StorageLocation.position);

    const isPositionOccupied = (pos) => occupiedPositions.includes(pos);

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-fade-in-up">

            {/* HEADER */}
            <div className="bg-[#0F172A] rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                            <Bug className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Phage Accession Portal</h1>
                            <p className="text-slate-400">Advanced entry system for bacteriophage isolates & characterization.</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: BIOLOGICAL DATA */}
                <div className="lg:col-span-2 space-y-6">

                    {/* General Info */}
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-lg font-bold text-white">General Information</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Phage ID / Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.phage_name}
                                    onChange={e => setFormData({ ...formData, phage_name: e.target.value })}
                                    placeholder="e.g. vB_SauM_Phage01"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Isolation Date</label>
                                <input
                                    type="date"
                                    value={formData.isolation_date}
                                    onChange={e => setFormData({ ...formData, isolation_date: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Biological Profile */}
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <Dna className="w-5 h-5 text-blue-500" />
                            <h3 className="text-lg font-bold text-white">Biological Profile</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-emerald-400 uppercase mb-2 flex justify-between">
                                    Host Bacteria
                                    <button type="button" className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded hover:bg-emerald-500 hover:text-white transition-colors">
                                        + New Host Strain
                                    </button>
                                </label>
                                <SearchableSelect
                                    options={hosts.map(h => ({
                                        label: `${h.strain_number} - ${h.species} (${h.source || 'N/A'})`,
                                        value: h.strain_number
                                    }))}
                                    value={formData.host_strain}
                                    onChange={val => setFormData({ ...formData, host_strain: val })}
                                    placeholder="Search Host Strain (e.g. ST-1210)..."
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Lifecycle</label>
                                <select
                                    value={formData.lifecycle}
                                    onChange={e => setFormData({ ...formData, lifecycle: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option>Lytic</option>
                                    <option>Lysogenic</option>
                                    <option>Pseudolysogenic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Titer (PFU/mL)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.titer}
                                        onChange={e => setFormData({ ...formData, titer: e.target.value })}
                                        placeholder="e.g. 1.0 x 10^9"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                    <FlaskConical className="absolute right-4 top-3.5 w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Plaque Morphology</label>
                                <input
                                    type="text"
                                    value={formData.plaque_morphology}
                                    onChange={e => setFormData({ ...formData, plaque_morphology: e.target.value })}
                                    placeholder="e.g. Clear, 2mm, halo"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Virion Morphology</label>
                                <input
                                    type="text"
                                    value={formData.morphology}
                                    onChange={e => setFormData({ ...formData, morphology: e.target.value })}
                                    placeholder="e.g. Myoviridae, long tail"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* TEM Image Upload */}
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <Upload className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-bold text-white">TEM Imagery</h3>
                        </div>
                        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center hover:border-emerald-500/50 transition-colors relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                            />
                            {imagePreview ? (
                                <div className="relative z-10">
                                    <img src={imagePreview} alt="TEM Preview" className="max-h-64 mx-auto rounded-lg shadow-2xl border border-slate-600" />
                                    <p className="mt-4 text-emerald-400 text-sm font-bold flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Image Ready for Upload
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 z-10 relative pointer-events-none">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <ZoomIn className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                    <h4 className="text-white font-bold">Upload TEM Micrograph</h4>
                                    <p className="text-slate-500 text-sm">Drag & drop or click to browse</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* RIGHT: STORAGE & ACTIONS */}
                <div className="space-y-6">
                    <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 shadow-lg sticky top-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                            <MapPin className="w-5 h-5 text-indigo-500" />
                            <h3 className="text-lg font-bold text-white">Physical Storage</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Freezer Unit</label>
                                <select
                                    value={formData.freezer_name}
                                    onChange={e => setFormData({ ...formData, freezer_name: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
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
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="GS-13">Box GS-13 (Phages)</option>
                                    <option value="GS-14">Box GS-14 (Strains)</option>
                                    <option value="GS-12">Box GS-12 (Plasmids)</option>
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
                                    disabled={loading || (formData.position && isPositionOccupied(formData.position))}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${loading
                                        ? 'bg-slate-700 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 animate-pulse-glow'
                                        }`}
                                >
                                    {loading ? <Activity className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                    <span>{loading ? 'Registering Phage...' : 'Save & Print Passport'}</span>
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
                                            <p className="font-bold text-emerald-400 text-sm">Accession Success!</p>
                                            <p className="text-emerald-500/80 text-xs">Phage added to Biobank.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-700 transition-all"
                                        onClick={() => alert("Generating Phage Passport PDF...")}
                                    >
                                        <FileText className="w-3 h-3" />
                                        Download Passport
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

export default PhageEntry;
