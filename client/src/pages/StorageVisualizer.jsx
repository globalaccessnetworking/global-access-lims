import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Database, Dna, Bug, FileCode, X, Activity, User, Calendar, Microscope, Filter, Search, Target, TrendingUp, BarChart3, MapPin, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const generateGrid = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    return { rows, cols };
};

const LineageModal = ({ asset, onClose, navigate }) => {
    if (!asset) return null;

    // Type Normalized
    const type = (asset.type || '').toLowerCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border-b border-slate-700">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors cursor-pointer z-50"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center z-10">
                        <div className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-xl border border-white/10
                            ${(type === 'phage' || type === 'bacteriophage') ? 'bg-blue-500/20 text-blue-400' :
                                (type === 'primer' || type === 'plasmid') ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}
                        `}>
                            {/* Icon Logic */}
                            {(type === 'phage' || type === 'bacteriophage') && <Bug size={32} />}
                            {(type === 'strain' || type === 'bacterial strain') && <Dna size={32} />}
                            {(type === 'primer' || type === 'plasmid') && <FileCode size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{asset.name}</h3>
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{type} ID: {asset.id}</span>
                    </div>

                    {/* Background Noise */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Calendar size={14} />
                                <span className="text-xs font-bold uppercase">Origin Date</span>
                            </div>
                            <div className="text-white font-mono text-sm">
                                {asset.lineage?.originDate ? new Date(asset.lineage.originDate).toLocaleDateString() : 'Date Not Recorded'}
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Activity size={14} />
                                <span className="text-xs font-bold uppercase">Concentration</span>
                            </div>
                            <div className="text-emerald-400 font-mono text-sm break-all">
                                {asset.lineage?.concentration || 'Not Recorded'}
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 col-span-2">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Dna size={14} />
                                <span className="text-xs font-bold uppercase">Parent / Source</span>
                            </div>
                            <div className="text-white text-sm">
                                {asset.lineage?.parent || 'Unknown Source'}
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 col-span-2">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <User size={14} />
                                <span className="text-xs font-bold uppercase">Research Associate</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[10px] text-white font-bold">
                                    {(asset.lineage?.associate && asset.lineage.associate !== 'Not Recorded') ? asset.lineage.associate.charAt(0) : 'U'}
                                </div>
                                <span className="text-white text-sm">{asset.lineage?.associate || 'Not Recorded'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => navigate(`/library?search=${asset.id}`)}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Microscope size={18} />
                            View Full Record
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const StorageVisualizer = () => {
    const [boxes, setBoxes] = useState([]);
    const [selectedBox, setSelectedBox] = useState('');
    const [gridData, setGridData] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [filters, setFilters] = useState({
        phage: true,
        strain: true,
        plasmid: true
    });
    const [statistics, setStatistics] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSlotFinder, setShowSlotFinder] = useState(false);
    const [slotRecommendations, setSlotRecommendations] = useState([]);
    const [highlightedCells, setHighlightedCells] = useState(new Set());

    const navigate = useNavigate();
    const { rows, cols } = generateGrid();

    useEffect(() => {
        const fetchBoxes = async () => {
            try {
                const res = await api.get('/storage/boxes');
                setBoxes(res.data || []);
                if (res.data && res.data.length > 0) {
                    setSelectedBox(res.data[0].box);
                }
            } catch (err) {
                console.error("Failed to load boxes", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBoxes();
        fetchStatistics();
        fetchHeatmap();
    }, []);

    useEffect(() => {
        if (!selectedBox) return;

        const fetchGrid = async () => {
            try {
                const res = await api.get(`/storage?box=${encodeURIComponent(selectedBox)}`);
                setGridData(res.data.grid || {});
            } catch (err) {
                console.error("Failed to load grid", err);
            }
        };
        fetchGrid();
    }, [selectedBox]);

    const fetchStatistics = async () => {
        try {
            const res = await api.get('/storage/statistics');
            setStatistics(res.data);
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    };

    const fetchHeatmap = async () => {
        try {
            const res = await api.get('/storage/heatmap');
            setHeatmapData(res.data.heatmap || []);
        } catch (error) {
            console.error('Failed to fetch heatmap:', error);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            setHighlightedCells(new Set());
            return;
        }

        try {
            const res = await api.get(`/storage/search?q=${encodeURIComponent(query)}`);
            setSearchResults(res.data.results || []);

            // Highlight matching cells
            const highlighted = new Set();
            res.data.results.forEach(result => {
                highlighted.add(`${result.boxName}-${result.position}`);
            });
            setHighlightedCells(highlighted);
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleFindSlots = async (type, count) => {
        try {
            const res = await api.post('/storage/find-slots', {
                type,
                count: parseInt(count) || 1,
                preferredBox: selectedBox
            });
            setSlotRecommendations(res.data.recommendations || []);
        } catch (error) {
            console.error('Failed to find slots:', error);
        }
    };

    const jumpToResult = (result) => {
        setSelectedBox(result.boxName);
        setSearchQuery('');
        setSearchResults([]);

        // Highlight the cell
        setTimeout(() => {
            const highlighted = new Set([`${result.boxName}-${result.position}`]);
            setHighlightedCells(highlighted);

            // Clear highlight after 3 seconds
            setTimeout(() => setHighlightedCells(new Set()), 3000);
        }, 300);
    };

    const toggleFilter = (type) => {
        setFilters(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const getAssetCategory = (asset) => {
        if (!asset) return 'empty';
        const type = (asset.type || '').toLowerCase();

        if (type === 'primer') return 'primer';
        if (type === 'phage') return 'phage';
        if (type === 'strain') return 'strain';
        if (type === 'plasmid') return 'plasmid';

        if (type.includes('primer')) return 'primer';
        if (type.includes('phage')) return 'phage';
        if (type.includes('strain') || type.includes('bacteria')) return 'strain';

        return 'strain';
    };

    const getCellColor = (asset, position) => {
        const cellKey = `${selectedBox}-${position}`;
        const isHighlighted = highlightedCells.has(cellKey);

        if (isHighlighted) {
            return 'bg-yellow-500/40 border-yellow-400 animate-pulse shadow-[0_0_20px_rgba(234,179,8,0.6)]';
        }

        if (!asset) return 'bg-slate-800/20 border-white/5 hover:border-white/20';

        const category = getAssetCategory(asset);

        if (category === 'phage' && !filters.phage) return 'opacity-20 grayscale bg-slate-800/20 border-white/5';
        if (category === 'strain' && !filters.strain) return 'opacity-20 grayscale bg-slate-800/20 border-white/5';
        if ((category === 'plasmid' || category === 'primer') && !filters.plasmid) return 'opacity-20 grayscale bg-slate-800/20 border-white/5';

        switch (category) {
            case 'phage':
                return 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
            case 'strain':
                return 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
            case 'plasmid':
            case 'primer':
                return 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
            default:
                return 'bg-slate-700 border-slate-600 text-slate-300';
        }
    };

    const formatBoxLabel = (boxData) => {
        let label = `${boxData.freezer || 'Unknown'}`;
        if (boxData.rack && boxData.rack !== 'Rack ?' && boxData.rack !== 'null') {
            label += ` | ${boxData.rack}`;
        }
        label += ` | ${boxData.box}`;
        return label;
    };

    const handleCellClick = (asset) => {
        if (asset && asset.id) {
            setSelectedAsset(asset);
        }
    };

    const getHeatColor = (occupancyRate) => {
        const rate = parseFloat(occupancyRate);
        if (rate >= 80) return 'bg-red-500';
        if (rate >= 60) return 'bg-orange-500';
        if (rate >= 40) return 'bg-amber-500';
        if (rate >= 20) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-fade-in relative">
            <AnimatePresence>
                {selectedAsset && (
                    <LineageModal
                        asset={selectedAsset}
                        onClose={() => setSelectedAsset(null)}
                        navigate={navigate}
                    />
                )}
            </AnimatePresence>

            {/* Empty Slot Finder Modal */}
            <AnimatePresence>
                {showSlotFinder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Target className="text-emerald-400" size={28} />
                                    <h3 className="text-2xl font-bold text-white">Find Empty Slots</h3>
                                </div>
                                <button onClick={() => setShowSlotFinder(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                                    <X className="text-slate-400" size={20} />
                                </button>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-2">Sample Type</label>
                                        <select id="slotType" className="w-full bg-slate-800 border-slate-700 text-white rounded-lg">
                                            <option value="phage">Phage</option>
                                            <option value="strain">Bacterial Strain</option>
                                            <option value="primer">Primer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-2">Number of Slots</label>
                                        <input
                                            id="slotCount"
                                            type="number"
                                            min="1"
                                            max="10"
                                            defaultValue="1"
                                            className="w-full bg-slate-800 border-slate-700 text-white rounded-lg"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const type = document.getElementById('slotType').value;
                                        const count = document.getElementById('slotCount').value;
                                        handleFindSlots(type, count);
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Zap size={18} />
                                    Find Best Slots
                                </button>
                            </div>

                            {slotRecommendations.length > 0 && (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase">Recommendations</h4>
                                    {slotRecommendations.map((rec, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSelectedBox(rec.box);
                                                setShowSlotFinder(false);
                                                setTimeout(() => {
                                                    const highlighted = new Set([`${rec.box}-${rec.position}`]);
                                                    setHighlightedCells(highlighted);
                                                    setTimeout(() => setHighlightedCells(new Set()), 3000);
                                                }, 300);
                                            }}
                                            className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-emerald-500 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-white">{rec.box} - Position {rec.position}</p>
                                                    <p className="text-sm text-slate-400">{rec.reason} • {rec.emptyCount} empty slots in box</p>
                                                </div>
                                                <MapPin className="text-emerald-400" size={20} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Database className="text-emerald-400" size={32} />
                        Advanced Storage Visualizer
                    </h1>
                    <p className="text-slate-400 mt-1">3D mapping with analytics, search, and smart recommendations</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSlotFinder(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-2"
                    >
                        <Target size={18} />
                        Find Empty Slots
                    </button>
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 ${showHeatmap ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        <BarChart3 size={18} />
                        {showHeatmap ? 'Hide' : 'Show'} Heat Map
                    </button>
                </div>
            </div>

            {/* Statistics Dashboard */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <Database className="text-indigo-200" size={24} />
                            <p className="text-2xl font-bold">{statistics.totalSlots}</p>
                        </div>
                        <p className="text-indigo-100 text-sm font-medium">Total Capacity</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="text-emerald-200" size={24} />
                            <p className="text-2xl font-bold">{statistics.occupied}</p>
                        </div>
                        <p className="text-emerald-100 text-sm font-medium">Occupied ({statistics.occupancyRate}%)</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <Bug className="text-blue-200" size={24} />
                            <p className="text-2xl font-bold">{statistics.byType.phages}</p>
                        </div>
                        <p className="text-blue-100 text-sm font-medium">Phages</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <Dna className="text-purple-200" size={24} />
                            <p className="text-2xl font-bold">{statistics.byType.strains}</p>
                        </div>
                        <p className="text-purple-100 text-sm font-medium">Strains</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-4 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <FileCode className="text-amber-200" size={24} />
                            <p className="text-2xl font-bold">{statistics.byType.primers}</p>
                        </div>
                        <p className="text-amber-100 text-sm font-medium">Primers</p>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search samples across all boxes..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-slate-800 border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                        {searchResults.map((result, idx) => (
                            <div
                                key={idx}
                                onClick={() => jumpToResult(result)}
                                className="bg-slate-800/50 p-3 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {result.type === 'phage' && <Bug className="text-blue-400" size={18} />}
                                    {result.type === 'strain' && <Dna className="text-emerald-400" size={18} />}
                                    {result.type === 'primer' && <FileCode className="text-purple-400" size={18} />}
                                    <div>
                                        <p className="font-bold text-white">{result.name}</p>
                                        <p className="text-xs text-slate-400">{result.details}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono text-emerald-400">{result.boxName}</p>
                                    <p className="text-xs text-slate-500">Position {result.position}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Box Selector */}
            <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                <div className="px-3 py-1 bg-emerald-500/10 rounded-lg text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    Active Box
                </div>
                <select
                    value={selectedBox}
                    onChange={(e) => setSelectedBox(e.target.value)}
                    className="bg-slate-900 border-none text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 rounded-lg py-2 pl-3 pr-8 min-w-[200px] cursor-pointer flex-1"
                >
                    {boxes.length === 0 && <option>No Boxes Found</option>}
                    {boxes.map((boxData, idx) => (
                        <option key={`${boxData.box}-${idx}`} value={boxData.box}>
                            {formatBoxLabel(boxData)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Heat Map View */}
            {showHeatmap && heatmapData.length > 0 && (
                <div className="bg-slate-900/50 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="text-amber-400" size={24} />
                        Occupancy Heat Map
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {heatmapData.slice(0, 24).map((box, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedBox(box.box)}
                                className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-amber-500 cursor-pointer transition-all"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-slate-400">{box.box}</p>
                                    <span className={`w-3 h-3 rounded-full ${getHeatColor(box.occupancyRate)}`}></span>
                                </div>
                                <p className="text-lg font-bold text-white">{box.occupancyRate}%</p>
                                <p className="text-xs text-slate-500">{box.occupiedCount}/81 slots</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid Visualization */}
            <div className="bg-slate-900/50 border border-emerald-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* Columns Header */}
                    <div className="flex gap-4 mb-4 ml-8">
                        {cols.map(col => (
                            <div key={col} className="w-12 text-center text-slate-500 font-mono text-sm">{col}</div>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="space-y-4">
                        {rows.map(row => (
                            <div key={row} className="flex gap-4 items-center">
                                <div className="w-8 text-right text-slate-500 font-mono text-sm font-bold">{row}</div>
                                {cols.map(col => {
                                    const pos = `${row}${col}`;
                                    const asset = gridData[pos];
                                    return (
                                        <div
                                            key={pos}
                                            onClick={() => handleCellClick(asset)}
                                            className={`
                                                w-12 h-12 rounded-xl border transition-all duration-300 cursor-pointer
                                                flex items-center justify-center relative group
                                                ${getCellColor(asset, pos)}
                                                ${asset ? 'hover:scale-110 hover:z-10' : ''}
                                            `}
                                            title={asset ? `${pos}: ${asset.name} (${asset.type})` : `Position: ${pos} - Empty`}
                                        >
                                            {/* Coordinate Label */}
                                            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-white/50 pointer-events-none group-hover:text-white transition-colors z-20">
                                                {pos}
                                            </span>

                                            {asset ? (
                                                <div className="scale-75 group-hover:scale-100 transition-transform">
                                                    {getAssetCategory(asset) === 'strain' && <Dna size={20} />}
                                                    {getAssetCategory(asset) === 'phage' && <Bug size={20} />}
                                                    {(getAssetCategory(asset) === 'plasmid' || getAssetCategory(asset) === 'primer') && <FileCode size={20} />}
                                                </div>
                                            ) : (
                                                <span className="opacity-0 group-hover:opacity-20 text-[10px] font-mono text-slate-500">{pos}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interactive Legend */}
                <div className="mt-8 flex justify-center gap-8 border-t border-white/5 pt-6 w-full max-w-2xl select-none">
                    <div
                        onClick={() => toggleFilter('phage')}
                        className={`flex items-center gap-2 cursor-pointer transition-opacity ${filters.phage ? 'opacity-100' : 'opacity-40 grayscale'}`}
                    >
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        <span className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Bacteriophage</span>
                    </div>

                    <div
                        onClick={() => toggleFilter('strain')}
                        className={`flex items-center gap-2 cursor-pointer transition-opacity ${filters.strain ? 'opacity-100' : 'opacity-40 grayscale'}`}
                    >
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Bacterial Strain</span>
                    </div>

                    <div
                        onClick={() => toggleFilter('plasmid')}
                        className={`flex items-center gap-2 cursor-pointer transition-opacity ${filters.plasmid ? 'opacity-100' : 'opacity-40 grayscale'}`}
                    >
                        <div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                        <span className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Plasmid/Primer</span>
                    </div>

                    <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                        <div className="w-3 h-3 rounded-full border border-slate-600 border-dashed"></div>
                        <span className="text-slate-500 text-sm">Available Slot</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorageVisualizer;
