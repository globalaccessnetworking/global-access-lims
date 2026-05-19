import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Search, FlaskConical, ChevronRight, Download, Microscope,
    Activity, AlertCircle, Loader2, X, Filter, PlusCircle,
    Save, Info, Dna, TestTube, Edit3, CheckCircle
} from 'lucide-react';

const api = axios.create({ baseURL: '/api' });

const RESULT_OPTIONS = [
    { value: '+++', label: '+++  Complete Lysis',  color: 'bg-emerald-500' },
    { value: '++',  label: '++   Strong Lysis',    color: 'bg-green-500' },
    { value: '+',   label: '+    Partial Lysis',   color: 'bg-lime-500' },
    { value: '±',   label: '±    Turbid Plaques',  color: 'bg-yellow-500' },
    { value: '-',   label: '-    No Infection',    color: 'bg-red-500' },
];

const RESULT_STYLE = {
    '+++': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
    '++':  { bg: 'bg-green-500/20',   text: 'text-green-400',   border: 'border-green-500/40' },
    '+':   { bg: 'bg-lime-500/20',    text: 'text-lime-400',    border: 'border-lime-500/40' },
    '±':   { bg: 'bg-yellow-500/20',  text: 'text-yellow-400',  border: 'border-yellow-500/40' },
    '-':   { bg: 'bg-red-500/20',     text: 'text-red-400',     border: 'border-red-500/40' },
};

export default function PhageInfectivityViewer() {
    const [phages,          setPhages]          = useState([]);
    const [phageSearch,     setPhageSearch]     = useState('');
    const [selectedPhage,   setSelectedPhage]   = useState(null);
    const [profile,         setProfile]         = useState(null);
    const [loadingPhages,   setLoadingPhages]   = useState(true);
    const [loadingProfile,  setLoadingProfile]  = useState(false);
    
    // Tab state
    const [activeTab,       setActiveTab]       = useState('legacy'); // 'legacy' or 'recorded'

    // Record-mode state
    const [strains,         setStrains]         = useState([]);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [strainFilter,    setStrainFilter]    = useState('');
    const [selectedStrain,  setSelectedStrain]  = useState(null);
    const [selectedResult,  setSelectedResult]  = useState('+++');
    const [saving,          setSaving]          = useState(false);
    const [saveMsg,         setSaveMsg]         = useState(null);

    // Filter states for tables
    const [legacySearch,    setLegacySearch]    = useState('');
    const [recordedSearch,  setRecordedSearch]  = useState('');

    // Load phage list
    const loadPhages = useCallback(async (q = '') => {
        setLoadingPhages(true);
        try {
            const res = await api.get('/interactions/all-phages', { params: { search: q } });
            if (res.data.success) setPhages(res.data.phages || []);
        } catch (err) {
            console.error('[VIEWER] phage list error:', err);
        } finally {
            setLoadingPhages(false);
        }
    }, []);

    useEffect(() => { loadPhages(); }, [loadPhages]);

    useEffect(() => {
        const t = setTimeout(() => loadPhages(phageSearch), 350);
        return () => clearTimeout(t);
    }, [phageSearch, loadPhages]);

    // ── Load strains for record mode (with backend search) ────────────────────
    const loadStrains = useCallback(async (q = '') => {
        try {
            const res = await api.get('/interactions/matrix', { params: { phage_limit: 1, strain_limit: 1000, strain_search: q } });
            if (res.data.success) setStrains(res.data.strains || []);
        } catch (err) {}
    }, []);

    useEffect(() => {
        const t = setTimeout(() => loadStrains(strainFilter), 350);
        return () => clearTimeout(t);
    }, [strainFilter, loadStrains]);

    // Load profile
    const loadProfile = useCallback(async (phage) => {
        if (!phage) return;
        setSelectedPhage(phage);
        setProfile(null);
        setLegacySearch('');
        setRecordedSearch('');
        setShowRecordModal(false);
        setSaveMsg(null);
        setLoadingProfile(true);
        try {
            const res = await api.get(`/interactions/profile/${phage.id}`);
            if (res.data.success) setProfile(res.data);
        } catch (err) {
            console.error('[VIEWER] profile error:', err);
        } finally {
            setLoadingProfile(false);
        }
    }, []);

    // Save one interaction
    const saveInteraction = async () => {
        if (!selectedPhage || !selectedStrain || !selectedResult) return;
        setSaving(true);
        setSaveMsg(null);
        try {
            const res = await api.post('/interactions/upsert', {
                phage_id:  selectedPhage.id,
                strain_id: selectedStrain.id,
                result:    selectedResult,
            });
            if (res.data.success) {
                setSaveMsg({ type: 'ok', text: `✅ Saved: ${selectedPhage.phage_name} × ${selectedStrain.name} = ${selectedResult}` });
                // Refresh profile to show updated recorded count
                loadProfile(selectedPhage);
                setTimeout(() => setShowRecordModal(false), 1500);
            } else {
                setSaveMsg({ type: 'err', text: `❌ Error: ${res.data.error}` });
            }
        } catch (err) {
            setSaveMsg({ type: 'err', text: `❌ ${err.response?.data?.error || err.message}` });
        } finally {
            setSaving(false);
        }
    };

    // CSV export
    const exportCSV = (type) => {
        if (!profile) return;
        let rows = [];
        let filename = '';
        if (type === 'legacy' && profile.legacy_strains?.length) {
            rows = profile.legacy_strains.map(r => `"${selectedPhage.phage_name}","${r.strain_name}","${r.species_name}","${r.stock_label || ''}","${r.detail || ''}","Target Host"`);
            filename = `${selectedPhage.phage_name}_legacy_host_range.csv`;
        } else if (type === 'recorded' && profile.recorded_interactions?.length) {
            rows = profile.recorded_interactions.map(r => `"${selectedPhage.phage_name}","${r.strain_name}","${r.species_name}","${r.stock_label || ''}","${r.detail || ''}","${r.result}","${r.tested_by || ''}","${r.date_tested || ''}"`);
            filename = `${selectedPhage.phage_name}_recorded_interactions.csv`;
        } else { return; }

        const header = type === 'legacy' ? 'Phage,Strain,Species,Stock Label,Details,Note' : 'Phage,Strain,Species,Stock Label,Details,Result,Tested By,Date';
        const csv = [header, ...rows].join('\n');
        const a   = Object.assign(document.createElement('a'), {
            href:     URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
            download: filename
        });
        a.click();
    };

    const filteredLegacy = (profile?.legacy_strains || []).filter(r =>
        !legacySearch || r.strain_name?.toLowerCase().includes(legacySearch.toLowerCase())
    );
    const filteredRecorded = (profile?.recorded_interactions || []).filter(r =>
        !recordedSearch || r.strain_name?.toLowerCase().includes(recordedSearch.toLowerCase())
    );
    const filteredStrains = strains.filter(s =>
        !strainFilter || s.name?.toLowerCase().includes(strainFilter.toLowerCase()) ||
        s.species?.toLowerCase().includes(strainFilter.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pt-24 font-sans">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <FlaskConical size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Phage Infectivity Viewer</h1>
                        <p className="text-slate-500 text-sm">Select a bacteriophage to view its infectivity profile and record interactions</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Phage Selector */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search phages..."
                            value={phageSearch}
                            onChange={e => setPhageSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition-colors"
                        />
                    </div>

                    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-220px)]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                Bacteriophages ({phages.filter(p => p.phage_name).length} named)
                            </span>
                            {loadingPhages && <Loader2 size={12} className="text-emerald-400 animate-spin" />}
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {phages.filter(p => p.phage_name).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => loadProfile(p)}
                                    className={`w-full text-left px-4 py-3 border-b border-white/5 transition-all hover:bg-slate-800/50 flex items-center justify-between group ${
                                        selectedPhage?.id === p.id ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : ''
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{p.phage_name}</div>
                                        {p.against_species && (
                                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.against_species}</div>
                                        )}
                                    </div>
                                    <ChevronRight size={14} className={`shrink-0 ml-2 transition-colors ${selectedPhage?.id === p.id ? 'text-emerald-400' : 'text-slate-700 group-hover:text-slate-500'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Profile Panel */}
                <div className="lg:col-span-8">
                    {!selectedPhage ? (
                        <div className="h-full min-h-[400px] bg-slate-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 p-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                                <Microscope size={28} className="text-slate-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-500 font-bold">Select a Phage</p>
                                <p className="text-slate-700 text-sm mt-1">Click any bacteriophage on the left to view its profile</p>
                            </div>
                        </div>
                    ) : loadingProfile ? (
                        <div className="h-full min-h-[400px] bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center gap-3">
                            <Loader2 size={20} className="text-emerald-400 animate-spin" />
                            <span className="text-slate-500 text-sm">Loading profile...</span>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl flex flex-col h-[calc(100vh-220px)]">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-transparent shrink-0">
                                <h2 className="text-xl font-black text-white">{selectedPhage.phage_name}</h2>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedPhage.against_species && (
                                        <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/25 rounded-lg text-purple-400 text-xs font-semibold">
                                            🎯 Target Species: {selectedPhage.against_species}
                                        </span>
                                    )}
                                    {profile?.host_bacteria && (
                                        <span className="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/25 rounded-lg text-cyan-400 text-xs font-semibold">
                                            🧫 Propagation Host: {profile.host_bacteria}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/5 shrink-0">
                                <button
                                    onClick={() => setActiveTab('legacy')}
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
                                        activeTab === 'legacy' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                    }`}
                                >
                                    Legacy Host Range ({profile?.total_legacy || 0})
                                </button>
                                <button
                                    onClick={() => setActiveTab('recorded')}
                                    className={`flex-1 py-4 text-sm font-bold border-b-2 transition-all ${
                                        activeTab === 'recorded' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                    }`}
                                >
                                    Lab Recorded ({profile?.total_recorded || 0})
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 overflow-y-auto">
                                {activeTab === 'legacy' ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="relative flex-1 max-w-xs">
                                                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="text" placeholder="Filter strains..."
                                                    value={legacySearch} onChange={e => setLegacySearch(e.target.value)}
                                                    className="w-full bg-slate-800 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                                                />
                                            </div>
                                            {(profile?.total_legacy || 0) > 0 && (
                                                <button onClick={() => exportCSV('legacy')} className="ml-4 flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all">
                                                    <Download size={14} /> Export CSV
                                                </button>
                                            )}
                                        </div>
                                        {filteredLegacy.length > 0 ? (
                                            <div className="overflow-hidden rounded-xl border border-white/5">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-800/50 border-b border-white/5">
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Strain No.</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Species</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Stock Label</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Details</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredLegacy.map((r, i) => (
                                                            <tr key={i} className="border-b border-white/5 hover:bg-slate-800/30">
                                                                <td className="px-4 py-3 font-bold text-white">
                                                                    {r.strain_name ? r.strain_name : <span className="text-slate-500 italic font-normal">Unnamed Strain</span>}
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-400 text-xs">{r.species_name}</td>
                                                                <td className="px-4 py-3 text-slate-400 text-xs">{r.stock_label || '—'}</td>
                                                                <td className="px-4 py-3 text-slate-500 text-xs italic">{r.detail || '—'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">No legacy strains found.</div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <button
                                                onClick={() => { setShowRecordModal(true); setSaveMsg(null); setSelectedStrain(null); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-900/20"
                                            >
                                                <PlusCircle size={16} /> Record New Test
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-48">
                                                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                    <input
                                                        type="text" placeholder="Filter recorded..."
                                                        value={recordedSearch} onChange={e => setRecordedSearch(e.target.value)}
                                                        className="w-full bg-slate-800 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                                                    />
                                                </div>
                                                {(profile?.total_recorded || 0) > 0 && (
                                                    <button onClick={() => exportCSV('recorded')} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all">
                                                        <Download size={14} /> Export CSV
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {(profile?.total_recorded || 0) === 0 ? (
                                            <div className="text-center py-16">
                                                <TestTube size={32} className="mx-auto text-slate-600 mb-4" />
                                                <p className="text-slate-400 font-bold mb-2">No Interaction Data Recorded Yet</p>
                                                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                                                    Click "Record New Test" to manually enter plaque assay results for this phage.
                                                </p>
                                            </div>
                                        ) : filteredRecorded.length > 0 ? (
                                            <div className="overflow-hidden rounded-xl border border-white/5">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="bg-slate-800/50 border-b border-white/5">
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Result</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Strain No.</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Species</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Stock Label</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Details</th>
                                                            <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredRecorded.map((r, i) => {
                                                            const s = RESULT_STYLE[r.result] || RESULT_STYLE['-'];
                                                            return (
                                                                <tr key={i} className="border-b border-white/5 hover:bg-slate-800/30">
                                                                    <td className="px-4 py-3">
                                                                        <span className={`px-2 py-1 rounded-lg font-black text-xs border ${s.bg} ${s.text} ${s.border}`}>{r.result}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 font-bold text-white">{r.strain_name}</td>
                                                                    <td className="px-4 py-3 text-slate-400 text-xs">{r.species_name}</td>
                                                                    <td className="px-4 py-3 text-slate-400 text-xs">{r.stock_label || '—'}</td>
                                                                    <td className="px-4 py-3 text-slate-500 text-xs italic">{r.detail || '—'}</td>
                                                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.date_tested || '—'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">No recorded tests match filter.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RECORD MODAL OVERLAY */}
            {showRecordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/50 shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Edit3 size={18} className="text-emerald-400" />
                                Record Test: {selectedPhage?.phage_name}
                            </h3>
                            <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-white p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strain picker */}
                                <div className="flex flex-col h-full max-h-[300px]">
                                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 shrink-0">
                                        1. Select Bacterial Strain
                                    </label>
                                    <div className="relative mb-2 shrink-0">
                                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text" placeholder="Search inventory..."
                                            value={strainFilter} onChange={e => setStrainFilter(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="bg-slate-950 border border-white/10 rounded-xl overflow-y-auto flex-1">
                                        {filteredStrains.slice(0, 100).map(s => (
                                            <button key={s.id} onClick={() => setSelectedStrain(s)}
                                                className={`w-full text-left px-3 py-2 border-b border-white/5 text-sm transition-colors ${selectedStrain?.id === s.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}>
                                                <div className="font-bold">{s.name}</div>
                                                <div className="text-[10px] text-slate-500">{s.species || '—'}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Result picker */}
                                <div>
                                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 block">
                                        2. Plaque Assay Result
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        {RESULT_OPTIONS.map(opt => (
                                            <button key={opt.value} onClick={() => setSelectedResult(opt.value)}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all text-left ${
                                                    selectedResult === opt.value
                                                        ? 'bg-slate-800 border-emerald-500 text-white'
                                                        : 'border-white/10 text-slate-400 hover:bg-slate-800/50'
                                                }`}>
                                                <span className={`w-3 h-3 rounded-full ${opt.color} shrink-0`} />
                                                {opt.label}
                                                {selectedResult === opt.value && <CheckCircle size={16} className="ml-auto text-emerald-400" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {saveMsg && (
                                <div className={`mt-6 px-4 py-3 rounded-xl text-sm font-bold border ${
                                    saveMsg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                    {saveMsg.text}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-slate-800/30 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setShowRecordModal(false)} className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={saveInteraction}
                                disabled={!selectedStrain || saving}
                                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all shadow-lg"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {saving ? 'Saving...' : 'Save Result'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
