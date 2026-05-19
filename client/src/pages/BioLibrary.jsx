import React, { useState, useEffect } from 'react';
import {
    Database,
    Search,
    Download,
    Layers,
    FlaskConical,
    Bug,
    Dna,
    FileCode,
    ChevronRight,
    ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import api from '../api/axios';
import QuickEditModal from '../components/QuickEditModal';

const BioLibrary = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ total: 0, phages: 0, strains: 0, primers: 0, plasmids: 0 });
    const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'PHAGE', 'STRAIN', 'PRIMER', 'PLASMID'
    const [selectedAsset, setSelectedAsset] = useState(null);

    useEffect(() => {
        const fetchBio = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/bio?search=${encodeURIComponent(search)}`);
                
                // [PHASE 138] Payload Extraction Alignment
                if (res.data && res.data.success) {
                    const fetchedAssets = res.data.assets || [];
                    setAssets(fetchedAssets);

                    // Hydrate Stats from Server (Avoids client-side lag)
                    if (res.data.stats) {
                        setStats(res.data.stats);
                    }
                } else {
                    console.error("API returned failure status", res.data);
                    setError(res.data?.error || "Endpoint reported a data sync failure.");
                }
            } catch (err) {
                console.error("Failed to fetch bio library", err);
                setError(err.response?.data?.error || "Library Sync Failed. Please check backend connection.");
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchBio, 300); // Debounce
        return () => clearTimeout(timer);
    }, [search]);

    // Local filtering based on active card with toggle logic
    const handleCardFilter = (type) => {
        setActiveFilter(prev => prev === type ? 'ALL' : type);
    };

    const filteredAssets = activeFilter === 'ALL'
        ? assets
        : assets.filter(a => a.type === activeFilter);

    const getTypeIcon = (type) => {
        switch (type) {
            case 'PHAGE': return <Bug size={16} className="text-blue-400" />;
            case 'STRAIN': return <Dna size={16} className="text-emerald-400" />;
            case 'PRIMER': return <FileCode size={16} className="text-purple-400" />;
            case 'PLASMID': return <FlaskConical size={16} className="text-amber-400" />;
            default: return <FlaskConical size={16} className="text-slate-400" />;
        }
    };

    const getTypeBadge = (type) => {
        const base = "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border";
        switch (type) {
            case 'PHAGE': return `${base} bg-blue-500/10 border-blue-500/20 text-blue-400`;
            case 'STRAIN': return `${base} bg-emerald-500/10 border-emerald-500/20 text-emerald-400`;
            case 'PRIMER': return `${base} bg-purple-500/10 border-purple-500/20 text-purple-400`;
            case 'PLASMID': return `${base} bg-amber-500/10 border-amber-500/20 text-amber-400`;
            default: return `${base} bg-slate-500/10 border-slate-500/20 text-slate-400`;
        }
    };

    const handleExport = () => {
        const dataToExport = filteredAssets.map(a => ({
            ID: a.asset_id,
            Name: a.name,
            Type: a.type.toUpperCase(),
            'Specie / Host': a.specie_host,
            'Box Location': a.box,
            'Concentration / Sequence': a.concentration,
            'Date Created': a.createdAt
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bio-Library");

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `LIMS_BioLibrary_Export_${dateStr}.xlsx`);
    };

    return (
        <div className="p-8 space-y-8 w-full animate-fade-in relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 px-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
                        <Database className="text-emerald-400" size={40} />
                        Bio Library
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg font-medium">Central Repository for all Biological Assets including Bacterial Strains, Bacteriophages, Primers, and Plasmids.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10 transition-all text-sm font-bold shadow-xl active:scale-95"
                    >
                        <Download size={18} />
                        Export to Excel
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-bold shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95">
                        <Layers size={18} />
                        Bulk Actions
                    </button>
                </div>
            </div>

            {/* Interactive Quick Stats Grid - Updated to 5 Columns for Phase 135 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 px-4 relative z-10">
                {[
                    { id: 'ALL', label: 'Total Assets', value: stats.total, color: 'text-white', icon: Database, accent: 'border-white/20 bg-emerald-500/10' },
                    { id: 'PHAGE', label: 'Bacteriophages', value: stats.phages, color: 'text-blue-400', icon: Bug, accent: 'border-blue-500/50 bg-blue-500/10' },
                    { id: 'STRAIN', label: 'Bacterial Strains', value: stats.strains, color: 'text-emerald-400', icon: Dna, accent: 'border-emerald-500/50 bg-emerald-500/10' },
                    { id: 'PRIMER', label: 'Primers & DNA', value: stats.primers, color: 'text-purple-400', icon: FileCode, accent: 'border-purple-500/50 bg-purple-500/10' },
                    { id: 'PLASMID', label: 'Plasmids', value: stats.plasmids, color: 'text-amber-400', icon: FlaskConical, accent: 'border-amber-500/50 bg-amber-500/10' }
                ].map((stat) => (
                    <button
                        key={stat.id}
                        onClick={() => handleCardFilter(stat.id)}
                        className={`
                            text-left transition-all duration-300 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group border
                            ${activeFilter === stat.id
                                ? `${stat.accent} shadow-[0_0_30px_rgba(0,0,0,0.5)] scale-[1.02] ring-2 ring-white/10`
                                : 'bg-slate-900/50 border-white/5 hover:border-white/20'
                            }
                        `}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <stat.icon size={64} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${activeFilter === stat.id ? 'text-white' : 'text-slate-500'}`}>
                            {stat.label}
                        </p>
                        <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value.toLocaleString()}</p>

                        {activeFilter === stat.id && (
                            <motion.div
                                layoutId="activeCardGlow"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-80"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative z-10 mb-8 mx-4">
                {/* Search & Utility Bar */}
                <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Dynamic filter by Name, Species, Box, or Type..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-inner font-medium"
                        />
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">
                            Filtered Census
                        </div>
                        <div className="text-2xl font-black text-white">
                            <span className="text-emerald-400">{filteredAssets.length}</span> <span className="text-slate-600 text-sm">/ {stats.total}</span>
                        </div>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-8 gap-4 px-8 py-5 bg-slate-800/80 text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] border-b border-white/10">
                    <div className="flex items-center gap-2">ID <ArrowUpDown size={12} /></div>
                    <div className="col-span-2 flex items-center gap-2">Asset Identity <ArrowUpDown size={12} /></div>
                    <div className="flex items-center gap-2">Classification</div>
                    <div className="flex items-center gap-2">Specie / Host</div>
                    <div className="flex items-center gap-2">Location Map</div>
                    <div className="flex items-center gap-2">Plaque Assay</div>
                    <div className="text-right">Intelligence</div>
                </div>

                {/* Table Body */}
                <div className="max-h-[800px] overflow-y-auto divide-y divide-white/5 custom-scrollbar bg-slate-950/20">
                    {loading ? (
                        <div className="p-40 text-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="inline-block"
                            >
                                <Database className="text-emerald-400 opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.2)]" size={64} />
                            </motion.div>
                            <p className="mt-6 text-slate-400 font-bold text-lg tracking-wider">AGGREGATING BIO-MAGNET DATA...</p>
                        </div>
                    ) : error ? (
                        <div className="p-40 text-center">
                            <FlaskConical className="mx-auto text-rose-500/50 mb-4" size={64} />
                            <p className="text-slate-300 text-xl font-bold mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all uppercase tracking-widest"
                            >
                                Re-initialize Connection
                            </button>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="p-40 text-center">
                            <Search className="mx-auto text-slate-800 mb-6" size={80} />
                            <p className="text-slate-500 text-2xl font-black">Null Set Detected.</p>
                            <p className="text-slate-600 mt-2 font-medium">Try adjusting your Global Search or Filter Cards.</p>
                            <button
                                onClick={() => { setSearch(''); setActiveFilter('ALL'); }}
                                className="mt-6 text-emerald-400 text-sm font-bold hover:underline tracking-widest uppercase"
                            >
                                Reset All Parameters
                            </button>
                        </div>
                    ) : (
                        filteredAssets.map((asset, idx) => (
                            <motion.div
                                key={`${asset.type}-${asset.asset_id}-${idx}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(idx * 0.005, 0.5) }}
                                className="grid grid-cols-8 gap-4 px-8 py-5 items-center hover:bg-emerald-500/5 transition-all group cursor-pointer border-l-2 border-transparent hover:border-emerald-500/30"
                            >
                                <div className="text-slate-600 font-mono text-xs font-bold tracking-tighter group-hover:text-slate-400 transition-colors">
                                    REG #{asset.asset_id}
                                </div>
                                <div className="col-span-2 flex items-center gap-4">
                                    <div className={`p-3 rounded-xl shadow-lg ${
                                        asset.type === 'phage' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                        asset.type === 'strain' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        asset.type === 'primer' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                        {getTypeIcon(asset.type)}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="font-black text-slate-100 group-hover:text-white transition-colors text-base tracking-wide">
                                            {asset.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 group-hover:text-slate-400">
                                            {asset.type.toUpperCase()} • {asset.createdAt !== 'Pre-Migration Central' && asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'Pre-Migration'}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <span className={getTypeBadge(asset.type)}>
                                        {getTypeIcon(asset.type)}
                                        {asset.type}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-400 italic font-medium">
                                    {asset.specie_host}
                                </div>
                                <div>
                                    <div className="px-3 py-1.5 bg-slate-900 border border-white/5 rounded-xl text-xs text-slate-300 inline-flex items-center gap-2 group-hover:border-emerald-500/40 transition-all">
                                        <Layers size={12} className="text-slate-500" />
                                        {asset.box}
                                    </div>
                                </div>
                                {/* Plaque Assay Result Column */}
                                <div>
                                    {asset.plaque_assay_result ? (
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                            asset.plaque_assay_result.startsWith('+++') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                            asset.plaque_assay_result.startsWith('++')  ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                            asset.plaque_assay_result.startsWith('+')   ? 'bg-lime-500/10 border-lime-500/20 text-lime-400' :
                                            asset.plaque_assay_result.startsWith('±')   ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                            'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                asset.plaque_assay_result.startsWith('+++') ? 'bg-emerald-400' :
                                                asset.plaque_assay_result.startsWith('++')  ? 'bg-green-400' :
                                                asset.plaque_assay_result.startsWith('+')   ? 'bg-lime-400' :
                                                asset.plaque_assay_result.startsWith('±')   ? 'bg-amber-400' :
                                                'bg-rose-500'
                                            }`} />
                                            {asset.plaque_assay_result}
                                        </span>
                                    ) : (
                                        <span className="text-slate-700 text-[10px] font-mono">—</span>
                                    )}
                                </div>
                                <div className="flex justify-end pr-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAsset({ id: asset.asset_id, type: asset.type, name: asset.name });
                                        }}
                                        className="p-2.5 bg-white/5 rounded-xl text-emerald-400 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 hover:bg-emerald-500/20 active:scale-95"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedAsset && (
                    <QuickEditModal 
                        asset={selectedAsset} 
                        onClose={() => setSelectedAsset(null)} 
                        onUpdate={() => {
                            // Re-fetch to show updated data in the list
                            const fetchBio = async () => {
                                const res = await api.get(`/bio?search=${encodeURIComponent(search)}`);
                                if (res.data && res.data.success) {
                                    setAssets(res.data.assets || []);
                                    setStats(res.data.stats);
                                }
                            };
                            fetchBio();
                        }} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};


export default BioLibrary;
