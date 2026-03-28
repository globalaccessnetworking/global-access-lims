import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Grid, Filter, Activity, Info, Beaker, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HostRangeMatrix = () => {
    const [interactions, setInteractions] = useState([]);
    const [phages, setPhages] = useState([]);
    const [hosts, setHosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hoveredCell, setHoveredCell] = useState(null);

    // Filter & Pagination State
    const [phageSearch, setPhageSearch] = useState('');
    const [hostSearch, setHostSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const rowsPerPage = 50;

    useEffect(() => {
        fetchData();
    }, [hostSearch, phageSearch, currentPage]);

    const fetchData = async () => {
        if (!loading) setRefreshing(true);
        try {
            // Fetch Phages (with search)
            const phageRes = await api.get('/assets', {
                params: { type: 'Phage', search: phageSearch, limit: 50 }
            });

            // Fetch Hosts (with search and pagination)
            const hostRes = await api.get('/assets', {
                params: {
                    type: 'Strain',
                    search: hostSearch,
                    limit: rowsPerPage,
                    offset: currentPage * rowsPerPage
                }
            });

            // Fetch Interaction Data
            const interactionRes = await api.get('/interactions');

            setPhages(phageRes.data);
            setHosts(hostRes.data);
            setInteractions(interactionRes.data);
            setLoading(false);
            setRefreshing(false);
        } catch (err) {
            console.error("Matrix load failed:", err);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getInteraction = (phageId, hostId) => {
        return interactions.find(i => i.phage_id === phageId && i.host_id === hostId);
    };

    const toggleInteraction = async (phageId, hostId) => {
        const current = getInteraction(phageId, hostId);
        const currentSensitivity = current ? current.sensitivity : 'None';

        let nextSensitivity = 'Clear';
        if (currentSensitivity === 'Clear') nextSensitivity = 'Turbid';
        if (currentSensitivity === 'Turbid') nextSensitivity = 'None';
        if (currentSensitivity === 'None') nextSensitivity = 'Clear';

        try {
            const res = await api.post('/interactions', {
                phage_id: phageId,
                host_id: hostId,
                sensitivity: nextSensitivity
            });

            const updatedInteractions = [...interactions];
            const existingIndex = updatedInteractions.findIndex(i => i.phage_id === phageId && i.host_id === hostId);

            if (existingIndex >= 0) {
                updatedInteractions[existingIndex] = res.data;
            } else {
                updatedInteractions.push(res.data);
            }
            setInteractions(updatedInteractions);
        } catch (err) {
            console.error("Failed to update interaction", err);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-slate-400 animate-pulse font-mono text-sm tracking-widest">INITIALIZING BIOMETRIC MATRIX...</p>
        </div>
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header Section */}
            <div className="flex justify-between items-end bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Grid className="w-8 h-8 text-emerald-400" /> Host-Range Matrix
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Phage-Host Interaction heatmap with server-side indexing.</p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="bg-slate-950/50 backdrop-blur border border-white/10 p-2 rounded-xl flex gap-4 text-[10px] font-black text-slate-500 uppercase items-center px-4 tracking-tighter">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Clear</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Turbid</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-800 border border-white/10"></span> None</div>
                        {refreshing && <div className="ml-4 animate-spin h-3 w-3 border-t border-emerald-400 rounded-full"></div>}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filter Phages..."
                                value={phageSearch}
                                onChange={(e) => setPhageSearch(e.target.value)}
                                className="bg-slate-950 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:border-emerald-500/50 outline-none w-40"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filter Hosts..."
                                value={hostSearch}
                                onChange={(e) => { setHostSearch(e.target.value); setCurrentPage(0); }}
                                className="bg-slate-950 border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:border-emerald-500/50 outline-none w-40"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Core */}
            <div className="flex-1 overflow-auto bg-slate-950 border border-white/5 shadow-2xl relative rounded-2xl custom-scrollbar">
                <table className="border-collapse w-max">
                    <thead>
                        <tr className="bg-slate-900/80 backdrop-blur">
                            <th className="sticky left-0 top-0 z-30 bg-slate-900 border-b border-r border-white/10 p-4 text-left text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] min-w-[220px]">
                                <div className="flex items-center justify-between">
                                    <span>Bacterial Strain</span>
                                    <span className="text-slate-600 text-[8px]">Row: {currentPage * rowsPerPage + 1} - {(currentPage + 1) * rowsPerPage}</span>
                                </div>
                            </th>
                            {phages.map(phage => (
                                <th key={phage.id} className="sticky top-0 z-20 bg-slate-900 border-b border-white/10 p-2 min-w-[64px]">
                                    <div className="h-28 flex items-end justify-center w-full pb-2">
                                        <span className="transform -rotate-90 text-[10px] font-mono font-bold text-slate-400 whitespace-nowrap tracking-widest uppercase">
                                            {phage.strain_number}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {hosts.map(host => (
                            <tr key={host.id} className="group hover:bg-emerald-500/5 transition-colors">
                                <td className="sticky left-0 z-10 bg-slate-900/95 group-hover:bg-slate-800 border-r border-white/10 p-4 py-3">
                                    <div className="font-bold text-slate-200 text-sm tracking-tight">{host.strain_number}</div>
                                    <div className="text-[10px] text-slate-500 truncate max-w-[180px] font-medium uppercase tracking-wider">{host.species}</div>
                                </td>
                                {phages.map(phage => {
                                    const interaction = getInteraction(phage.id, host.id);
                                    const status = interaction ? interaction.sensitivity : 'None';

                                    return (
                                        <td key={phage.id} className="p-0.5 text-center relative">
                                            <button
                                                onClick={() => toggleInteraction(phage.id, host.id)}
                                                onMouseEnter={() => setHoveredCell({ phage, host, status })}
                                                onMouseLeave={() => setHoveredCell(null)}
                                                className={`
                                                    w-10 h-10 rounded-sm transition-all duration-150 border border-transparent
                                                    ${status === 'Clear' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:scale-105' :
                                                        status === 'Turbid' ? 'bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.2)] hover:scale-105' :
                                                            'bg-slate-900 group-hover:bg-slate-800 hover:border-white/20'
                                                    }
                                                `}
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination HUD */}
                <div className="sticky bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-40">
                    <button
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold disabled:opacity-20 transition-all active:scale-95"
                    >
                        PREV
                    </button>
                    <div className="px-4 text-[10px] font-black text-slate-400 tracking-widest uppercase bg-black/40 rounded-lg py-2 border border-white/5">
                        PAGE {currentPage + 1}
                    </div>
                    <button
                        disabled={hosts.length < rowsPerPage}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold disabled:opacity-20 transition-all active:scale-95"
                    >
                        NEXT
                    </button>
                </div>

                <AnimatePresence>
                    {hoveredCell && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed bottom-24 right-8 bg-slate-900/90 border border-emerald-500/30 p-5 rounded-2xl shadow-2xl z-50 w-72 backdrop-blur-2xl ring-1 ring-white/10"
                        >
                            <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                                <Beaker className="w-5 h-5 text-emerald-400" />
                                <span className="font-black text-white text-xs uppercase tracking-widest">Interaction Profile</span>
                            </div>
                            <div className="space-y-4 text-[11px]">
                                <div className="flex justify-between items-center group">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Phage Identity:</span>
                                    <span className="font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">{hoveredCell.phage.strain_number}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Bacterial Host:</span>
                                    <span className="font-mono text-white font-bold bg-white/5 px-2 py-1 rounded border border-white/10">{hoveredCell.host.strain_number}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Lysis Status:</span>
                                    <span className={`px-3 py-1 rounded-full font-black tracking-widest text-[9px] uppercase ${hoveredCell.status === 'Clear' ? 'bg-emerald-500 text-slate-900' :
                                        hoveredCell.status === 'Turbid' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400'
                                        }`}>{hoveredCell.status}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HostRangeMatrix;
