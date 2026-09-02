import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
    Search, FlaskConical, ChevronRight, Microscope,
    Loader2, Filter, Edit3, X, Plus, ChevronLeft
} from 'lucide-react';

const api = axios.create({ baseURL: '/api' });

const RESULT_OPTIONS = [
    { value: '+++', label: '+++ Complete Lysis',  color: 'bg-emerald-500', desc: 'Clear plaque, robust infection' },
    { value: '++',  label: '++ Strong Lysis',    color: 'bg-green-500', desc: 'Slightly turbid but strong infection' },
    { value: '+',   label: '+ Partial Lysis',   color: 'bg-lime-500', desc: 'Weak or partial clearing' },
    { value: '±',   label: '± Turbid Plaques',  color: 'bg-yellow-500', desc: 'Very turbid/spotty plaques' },
    { value: '-',   label: '- No Infection',    color: 'bg-red-500', desc: 'No visible plaque formation' },
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
    
    // Filter & Pagination states for main table
    const [strainSearch,    setStrainSearch]    = useState('');
    const [currentPage,     setCurrentPage]     = useState(1);
    const rowsPerPage = 50;
    
    // Modal states
    const [recordModalData, setRecordModalData] = useState(null);
    const [savingStrainId,  setSavingStrainId]  = useState(null);
    
    // Custom strain test modal state (Async)
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customSearch,    setCustomSearch]    = useState('');
    const [asyncStrains,    setAsyncStrains]    = useState([]);
    const [loadingAsync,    setLoadingAsync]    = useState(false);

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

    // Load profile (Main Matrix)
    const loadProfile = useCallback(async (phage) => {
        if (!phage) return;
        setSelectedPhage(phage);
        setProfile(null);
        setStrainSearch('');
        setCurrentPage(1);
        setRecordModalData(null);
        setShowCustomModal(false);
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

    // Load custom strains (Async search)
    useEffect(() => {
        if (!showCustomModal || !selectedPhage) return;
        const fetchCustom = async () => {
            setLoadingAsync(true);
            try {
                const res = await api.get('/interactions/strains/search', {
                    params: { q: customSearch, phage_id: selectedPhage.id }
                });
                if (res.data.success) {
                    setAsyncStrains(res.data.strains || []);
                }
            } catch (err) {
                console.error('Async search error:', err);
            } finally {
                setLoadingAsync(false);
            }
        };
        const t = setTimeout(fetchCustom, 350);
        return () => clearTimeout(t);
    }, [customSearch, showCustomModal, selectedPhage]);

    // Save interaction
    const saveInteraction = async (strainId, resultValue) => {
        if (!selectedPhage || !strainId || !resultValue) return;
        
        setSavingStrainId(strainId);
        try {
            const res = await api.post('/interactions/upsert', {
                phage_id:  selectedPhage.id,
                strain_id: strainId,
                result:    resultValue,
            });
            if (res.data.success) {
                // Update main matrix inline
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
                // Update async strains list inline if open
                setAsyncStrains(prev => prev.map(s => {
                    if (s.strain_id === strainId) return { ...s, result: resultValue };
                    return s;
                }));
                setRecordModalData(null);
            }
        } catch (err) {
            console.error('Failed to save interaction:', err);
            alert('Failed to save result. Please try again.');
        } finally {
            setSavingStrainId(null);
        }
    };

    // Client-side pagination logic
    const { paginatedStrains, totalFiltered, totalPages } = useMemo(() => {
        const all = profile?.strains || [];
        const filtered = all.filter(r =>
            !strainSearch || 
            r.strain_name?.toLowerCase().includes(strainSearch.toLowerCase()) ||
            r.species_name?.toLowerCase().includes(strainSearch.toLowerCase())
        );
        const startIndex = (currentPage - 1) * rowsPerPage;
        const paginated = filtered.slice(startIndex, startIndex + rowsPerPage);
        return {
            paginatedStrains: paginated,
            totalFiltered: filtered.length,
            totalPages: Math.ceil(filtered.length / rowsPerPage)
        };
    }, [profile, strainSearch, currentPage]);

    // Reset page on search
    useEffect(() => { setCurrentPage(1); }, [strainSearch]);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pt-24 font-sans flex flex-col">
            <div className="mb-6 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center border border-emerald-500/20">
                        <FlaskConical size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Phage-Host Matrix</h1>
                        <p className="text-slate-500 text-sm">Select a bacteriophage to view and record its plaque assay interactions against bacterial strains</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-[calc(100vh-180px)] min-h-[600px]">
                {/* LEFT: Phage Selector */}
                <div className="lg:col-span-3 flex flex-col gap-4 h-full">
                    <div className="relative shrink-0">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search phages..."
                            value={phageSearch}
                            onChange={e => setPhageSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:border-emerald-500 outline-none transition-colors"
                        />
                    </div>

                    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                Bacteriophages ({phages.length})
                            </span>
                            {loadingPhages && <Loader2 size={12} className="text-emerald-400 animate-spin" />}
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                            {phages.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => loadProfile(p)}
                                    className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all flex items-center justify-between group ${
                                        selectedPhage?.id === p.id 
                                            ? 'bg-emerald-500/15 border border-emerald-500/30' 
                                            : 'border border-transparent hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate">{p.phage_name || '—'}</div>
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
                <div className="lg:col-span-9 flex flex-col h-full min-h-0">
                    {!selectedPhage ? (
                        <div className="flex-1 bg-slate-900 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 p-12">
                            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center">
                                <Microscope size={28} className="text-slate-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-500 font-bold">Select a Phage</p>
                                <p className="text-slate-700 text-sm mt-1">Click any bacteriophage on the left to view and edit its host range</p>
                            </div>
                        </div>
                    ) : loadingProfile ? (
                        <div className="flex-1 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center gap-3">
                            <Loader2 size={20} className="text-emerald-400 animate-spin" />
                            <span className="text-slate-500 text-sm">Loading matrix...</span>
                        </div>
                    ) : (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl flex flex-col flex-1 overflow-hidden shadow-2xl h-full">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-transparent shrink-0 flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-white">{selectedPhage.phage_name || '—'}</h2>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {selectedPhage.against_species && (
                                            <span className="px-3 py-1 bg-purple-500/15 border border-purple-500/25 rounded-lg text-purple-400 text-sm font-semibold">
                                                🎯 Target Species: {selectedPhage.against_species}
                                            </span>
                                        )}
                                        {profile?.host_bacteria && (
                                            <span className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/25 rounded-lg text-cyan-400 text-sm font-semibold">
                                                🦠 Propagation Host: {profile.host_bacteria}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setCustomSearch(''); setShowCustomModal(true); }}
                                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus size={18} /> Test Custom Strain
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-4 shrink-0">
                                    <div className="relative flex-1 max-w-md">
                                        <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="text" placeholder="Filter strains in matrix..."
                                            value={strainSearch} onChange={e => setStrainSearch(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 bg-slate-800/50 px-4 py-2 rounded-xl border border-white/5">
                                        <div className="text-slate-400 text-sm font-semibold">
                                            {totalFiltered} strains
                                        </div>
                                        <div className="w-px h-4 bg-white/10"></div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => p - 1)}
                                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronLeft size={18} />
                                            </button>
                                            <span className="text-sm font-bold text-white px-2">Page {currentPage} of {totalPages || 1}</span>
                                            <button 
                                                disabled={currentPage >= totalPages}
                                                onClick={() => setCurrentPage(p => p + 1)}
                                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="overflow-auto rounded-xl border border-white/5 flex-1 bg-slate-950/50">
                                    <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-slate-900 z-10 shadow-md">
                                            <tr className="bg-slate-800/50 border-b border-white/5">
                                                <th className="px-6 py-4 text-slate-400 text-sm font-semibold uppercase tracking-wider w-1/4">Strain No.</th>
                                                <th className="px-6 py-4 text-slate-400 text-sm font-semibold uppercase tracking-wider w-1/4">Species</th>
                                                <th className="px-6 py-4 text-slate-400 text-sm font-semibold uppercase tracking-wider w-1/4">Assay Result</th>
                                                <th className="px-6 py-4 text-slate-400 text-sm font-semibold uppercase tracking-wider w-1/4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {paginatedStrains.map((r) => {
                                                const hasResult = r.result && r.result !== '';
                                                return (
                                                    <tr key={r.strain_id} className="hover:bg-slate-800/50 transition-colors group text-base">
                                                        <td className="px-6 py-4 font-bold text-white">{r.strain_name || '—'}</td>
                                                        <td className="px-6 py-4 text-slate-400">{r.species_name || '—'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold border ${RESULT_STYLE[r.result]?.bg} ${RESULT_STYLE[r.result]?.text} ${RESULT_STYLE[r.result]?.border}`}>
                                                                {RESULT_OPTIONS.find(o => o.value === r.result)?.label || r.result}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => setRecordModalData(r)}
                                                                className="inline-flex items-center gap-2 px-5 py-2.5 text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/30 rounded-lg transition-all font-bold text-sm tracking-wide shadow-sm"
                                                            >
                                                                <Edit3 size={16} /> Update
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {paginatedStrains.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center py-16 text-slate-500">
                                                        <div className="flex flex-col items-center justify-center gap-3">
                                                            <Search size={32} className="text-slate-700" />
                                                            <p className="text-lg">No strains match your filter criteria.</p>
                                                        </div>
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

            {/* MODAL: Record / Update Result */}
            {recordModalData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
                            <div>
                                <h3 className="text-2xl font-black text-white">Record Plaque Assay</h3>
                                <p className="text-slate-400 text-base mt-2">
                                    {selectedPhage?.phage_name || '—'} × <span className="text-emerald-400 font-bold">{recordModalData.strain_name || '—'}</span>
                                </p>
                            </div>
                            <button onClick={() => setRecordModalData(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-xl">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-3 bg-slate-900 relative">
                            <p className="text-sm font-semibold text-slate-300 mb-2 uppercase tracking-wider">Select Assay Result</p>
                            {RESULT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => saveInteraction(recordModalData.strain_id, opt.value)}
                                    disabled={savingStrainId === recordModalData.strain_id}
                                    className={`w-full text-left p-5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                                        recordModalData.result === opt.value 
                                            ? `${RESULT_STYLE[opt.value].bg} ${RESULT_STYLE[opt.value].border} ring-2 ring-emerald-500/50 shadow-lg` 
                                            : 'border-white/5 bg-slate-950 hover:border-slate-600 hover:bg-slate-800'
                                    }`}
                                >
                                    <div className={`font-bold text-xl ${recordModalData.result === opt.value ? RESULT_STYLE[opt.value].text : 'text-slate-200'}`}>
                                        {opt.label}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {opt.desc}
                                    </div>
                                </button>
                            ))}

                            {savingStrainId === recordModalData.strain_id && (
                                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                                    <Loader2 size={40} className="text-emerald-400 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Test Custom Strain */}
            {showCustomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-emerald-500/10">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <Search size={24} className="text-emerald-400" />
                                    Test Custom Strain
                                </h3>
                                <p className="text-emerald-400/80 text-base mt-2">
                                    Search the entire database and quickly record a test for {selectedPhage?.phage_name || '—'}
                                </p>
                            </div>
                            <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-3 rounded-xl">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 border-b border-white/5 bg-slate-950 shrink-0">
                            <div className="relative">
                                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Type to search ANY bacterial strain in the database..."
                                    value={customSearch}
                                    onChange={e => setCustomSearch(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl py-5 pl-14 pr-6 text-lg text-white focus:border-emerald-500 outline-none shadow-lg shadow-emerald-500/10"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-6 bg-slate-950/50">
                            {loadingAsync ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <Loader2 size={32} className="text-emerald-400 animate-spin" />
                                    <div className="text-slate-500">Searching global database...</div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {asyncStrains.map(r => {
                                        const hasResult = r.result && r.result !== '';
                                        return (
                                            <div key={r.strain_id} className="bg-slate-900 border border-white/5 rounded-xl p-5 flex items-center justify-between hover:bg-slate-800/50 transition-colors group">
                                                <div>
                                                    <div className="font-bold text-white text-xl">{r.strain_name || '—'}</div>
                                                    <div className="text-slate-400 text-base mt-1">{r.species_name || 'Unknown Species'}</div>
                                                    
                                                    {hasResult && (
                                                        <div className="mt-3 text-sm font-semibold text-slate-500 bg-slate-950 inline-block px-3 py-1.5 rounded-lg border border-white/5">
                                                            Current Result: <span className={RESULT_STYLE[r.result]?.text}>{RESULT_OPTIONS.find(o => o.value === r.result)?.label}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <button
                                                    onClick={() => setRecordModalData(r)}
                                                    className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-xl font-bold text-base transition-all shadow-sm"
                                                >
                                                    {hasResult ? 'Update Result' : 'Record Result'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {asyncStrains.length === 0 && (
                                        <div className="text-center py-16 text-slate-500">
                                            <p className="text-lg">No strains match your search.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
