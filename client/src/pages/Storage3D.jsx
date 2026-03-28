import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Snowflake, Search, X, Database, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Storage3D = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBox, setSelectedBox] = useState(null);
    const [hoverBox, setHoverBox] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await api.get('/assets');
                setAssets(res.data);
            } catch (err) {
                console.error("Failed to fetch assets", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    // Group assets by Box ID. 
    // Assuming asset.StorageLocation.box is the key (e.g., "GS-13-B1")
    const boxData = useMemo(() => {
        const boxes = {};
        // Initialize some empty boxes for visual structure if needed, or just let them grow
        for (let i = 1; i <= 25; i++) {
            const id = `GS-13-B${i}`;
            boxes[id] = { id, assets: [], occupancy: 0, status: 'empty' };
        }

        assets.forEach(asset => {
            if (asset.StorageLocation && asset.StorageLocation.box) {
                const boxId = asset.StorageLocation.box;
                if (!boxes[boxId]) {
                    boxes[boxId] = { id: boxId, assets: [], occupancy: 0, status: 'occupied' };
                }
                boxes[boxId].assets.push(asset);
                boxes[boxId].occupancy += 1;
                boxes[boxId].status = 'occupied';
            }
        });
        return Object.values(boxes);
    }, [assets]);

    // Helper to generate 9x9 Grid (A1-I9)
    const renderGrid = (box) => {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        return (
            <div className="grid grid-cols-9 gap-1 sm:gap-2">
                {rows.map(row => (
                    cols.map(col => {
                        const pos = `${row}${col}`;
                        const asset = box.assets.find(a =>
                            a.StorageLocation && a.StorageLocation.position === pos
                        );

                        return (
                            <motion.div
                                key={pos}
                                whileHover={{ scale: 1.1, zIndex: 10 }}
                                onClick={() => asset && navigate(`/library?search=${asset.id}`)}
                                className={`
                                    aspect-square rounded sm:rounded-md border flex items-center justify-center text-[8px] sm:text-[10px] font-bold relative group cursor-pointer
                                    ${asset
                                        ? asset.type === 'Phage' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                            : asset.type === 'Strain' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                                : 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                        : 'bg-slate-800/50 border-white/5 text-slate-700 hover:border-white/20'
                                    }
                                `}
                            >
                                {asset ? (
                                    <>
                                        <span className="truncate max-w-full px-0.5">{asset.strain_number || asset.id}</span>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-white/20 p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                            <p className="font-bold text-white text-xs">{asset.species}</p>
                                            <p className="text-[10px] text-emerald-400 font-mono">{asset.strain_number}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{asset.type} • {pos}</p>
                                        </div>
                                    </>
                                ) : (
                                    <span className="opacity-0 group-hover:opacity-100">{pos}</span>
                                )}
                            </motion.div>
                        );
                    })
                ))}
            </div>
        );
    };

    return (
        <div className="h-full bg-slate-950 p-4 sm:p-8 text-white overflow-hidden relative font-sans flex flex-col">

            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"></div>

            <div className="relative z-10 flex flex-col h-full">

                {/* Header */}
                <div className="flex justify-between items-end mb-8 shrink-0">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                            Freezer GS-13
                        </h1>
                        <p className="text-slate-400 mt-2 flex items-center gap-2">
                            <Snowflake className="w-4 h-4 text-cyan-500" /> -80°C Storage Matrix
                        </p>
                    </div>

                    {/* Legend */}
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-white/10 backdrop-blur-md hidden sm:block">
                        <div className="flex gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500 rounded sm:rounded-sm"></div>
                                <span className="text-slate-300">Strain</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded sm:rounded-sm"></div>
                                <span className="text-slate-300">Phage</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-slate-800 border border-slate-700 rounded sm:rounded-sm"></div>
                                <span className="text-slate-500">Empty</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3D Rack View */}
                <div className="flex-1 flex items-center justify-center perspective-[2000px] overflow-visible pb-20">
                    <motion.div
                        initial={{ rotateX: 20, rotateY: 330, scale: 0.8, opacity: 0 }}
                        animate={{ rotateX: 25, rotateY: 335, scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="grid grid-cols-5 gap-4 sm:gap-6 transform-style-3d relative"
                    >
                        {boxData.slice(0, 25).map((box) => (
                            <motion.div
                                key={box.id}
                                onMouseEnter={() => setHoverBox(box)}
                                onMouseLeave={() => setHoverBox(null)}
                                onClick={() => setSelectedBox(box)}
                                whileHover={{ z: 30, scale: 1.1 }}
                                className={`
                                    w-16 h-16 sm:w-24 sm:h-24 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative shadow-2xl backdrop-blur-sm
                                    ${box.status === 'occupied'
                                        ? 'bg-blue-900/40 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:bg-blue-600/60 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                                        : 'bg-slate-800/20 border-slate-700/30 opacity-50 hover:opacity-100 hover:bg-slate-700/50'
                                    }
                                `}
                            >
                                <Box className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 transition-colors ${box.status === 'occupied' ? 'text-blue-300' : 'text-slate-600'}`} />
                                <span className="text-[10px] sm:text-xs font-bold font-mono text-slate-300">{box.id.split('-')[2]}</span>

                                {/* Occupancy Bar */}
                                {box.status === 'occupied' && (
                                    <div className="absolute bottom-2 left-2 right-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-400 shadow-[0_0_5px_cyan]"
                                            style={{ width: `${(box.occupancy / 81) * 100}%` }}
                                        ></div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Box Detail Modal (Glassmorphism Overlay) */}
                <AnimatePresence>
                    {selectedBox && (
                        <motion.div
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
                            onClick={() => setSelectedBox(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-3xl w-full relative overflow-hidden"
                            >
                                {/* Modal Background Gradient */}
                                <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                            <Box className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{selectedBox.id}</h2>
                                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                                <Database className="w-3 h-3" /> {selectedBox.occupancy} / 81 Vials
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedBox(null)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                {/* The 9x9 Grid */}
                                <div className="relative z-10">
                                    {renderGrid(selectedBox)}
                                </div>

                                <div className="mt-6 flex justify-between items-center text-xs text-slate-500 font-mono relative z-10">
                                    <span>Grid Position: A1 (Top-Left) to I9 (Bottom-Right)</span>
                                    <button className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                                        Export Manifest <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default Storage3D;
