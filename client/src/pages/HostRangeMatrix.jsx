import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Search, FlaskConical, ChevronRight, Download, Microscope,
    Loader2, Filter, Edit3, Save, CheckCircle
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
    
    // Filter states for table
    const [strainSearch,    setStrainSearch]    = useState('');
    
    // Inline editing state
    const [editingStrainId, setEditingStrainId] = useState(null);
    const [savingStrainId,  setSavingStrainId]  = useState(null);

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

    // Load profile
    const loadProfile = useCallback(async (phage) => {
        if (!phage) return;
        setSelectedPhage(phage);
        setProfile(null);
        setStrainSearch('');
        setEditingStrainId(null);
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

    // Save inline interaction
    const saveInteraction = async (strainId, resultValue) => {
        if (!selectedPhage || !strainId || !resultValue) {
            setEditingStrainId(null);
            return;
        }
        setSavingStrainId(strainId);
        try {
            const res = await api.post('/interactions/upsert', {
                phage_id:  selectedPhage.id,
                strain_id: strainId,
                result:    resultValue,
            });
            if (res.data.success) {
                // Update local state without reloading full profile
                setProfile(prev => {
                    if (!prev) return prev;
                    const updatedStrains = prev.strains.map(s => {
                        if (s.strain_id === strainId) {
                            return { ...s, result: resultValue, status: 'recorded' };
                        }
                        return s;
                    });
                    return { ...prev, strains: updatedStrains };
                });
            }
        } catch (err) {
            console.error('Failed to save interaction:', err);
            alert('Failed to save result. Please try again.');
        } finally {
            setSavingStrainId(null);
            setEditingStrainId(null);
        }
    };

    const filteredStrains = (profile?.strains || []).filter(r =>
        !strainSearch || 
        r.strain_name?.toLowerCase().includes(strainSearch.toLowerCase()) ||
        r.species_name?.toLowerCase().includes(strainSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pt-24 font-sans">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <FlaskConical size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Phage-Host Matrix</h1>
                        <p className="text-slate-500 text-sm">Select a bacteriophage to view and record its plaque assay interactions against all bacterial strains</p>
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

                {/* RIGHT: Unified Strains Panel */}
                <div className="lg:col-span-8">
                    {!selectedPhage ? (
                        <div className="h-full min-h-[400px] bg-slate-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 p-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                                <Microscope size={28} className="text-slate-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-500 font-bold">Select a Phage</p>
                                <p className="text-slate-700 text-sm mt-1">Click any bacteriophage on the left to view and edit its host range</p>
                            </div>
                        </div>
                    ) : loadingProfile ? (
                        <div className="h-full min-h-[400px] bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center gap-3">
                            <Loader2 size={20} className="text-emerald-400 animate-spin" />
                            <span className="text-slate-500 text-sm">Loading strains...</span>
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
                                            🦠 Propagation Host: {profile.host_bacteria}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-4 shrink-0">
                                    <div className="relative flex-1 max-w-xs">
                                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text" placeholder="Filter strains..."
                                            value={strainSearch} onChange={e => setStrainSearch(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-4">
                                        All Bacterial Strains ({profile?.total_strains || 0})
                                    </div>
                                </div>
                                
                                <div className="overflow-auto rounded-xl border border-white/5 flex-1">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-slate-900 z-10 shadow-md">
                                            <tr className="bg-slate-800/50 border-b border-white/5">
                                                <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Strain No.</th>
                                                <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Species</th>
                                                <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Stock Label</th>
                                                <th className="text-left px-4 py-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">Assay Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStrains.map((r) => {
                                                const isEditing = editingStrainId === r.strain_id;
                                                const isSaving  = savingStrainId === r.strain_id;
                                                const hasResult = r.result && r.result !== '';
                                                
                                                return (
                                                    <tr key={r.strain_id} className="border-b border-white/5 hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-white">{r.strain_name}</td>
                                                        <td className="px-4 py-3 text-slate-400 text-xs">{r.species_name || '—'}</td>
                                                        <td className="px-4 py-3 text-slate-400 text-xs">{r.stock_label || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            {isEditing ? (
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        autoFocus
                                                                        defaultValue={r.result || ''}
                                                                        onChange={(e) => saveInteraction(r.strain_id, e.target.value)}
                                                                        onBlur={() => setEditingStrainId(null)}
                                                                        disabled={isSaving}
                                                                        className="bg-slate-950 border border-emerald-500/50 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)] w-48"
                                                                    >
                                                                        <option value="" disabled>Select Result...</option>
                                                                        {RESULT_OPTIONS.map(opt => (
                                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                        ))}
                                                                    </select>
                                                                    {isSaving && <Loader2 size={14} className="text-emerald-400 animate-spin" />}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-3 group/edit">
                                                                    {hasResult ? (
                                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${RESULT_STYLE[r.result]?.bg} ${RESULT_STYLE[r.result]?.text} ${RESULT_STYLE[r.result]?.border}`}>
                                                                            {r.result}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-600 text-xs italic">—</span>
                                                                    )}
                                                                    
                                                                    <button 
                                                                        onClick={() => setEditingStrainId(r.strain_id)}
                                                                        className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-all opacity-0 group-hover/edit:opacity-100"
                                                                        title="Edit Result"
                                                                    >
                                                                        <Edit3 size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredStrains.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-12 text-slate-500">
                                                        No strains match filter.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
