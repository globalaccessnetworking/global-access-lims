import React, { useState, useEffect } from 'react';
import { Box, MapPin, Search } from 'lucide-react';
import api from '../api/axios';
import AssetDetailDrawer from './AssetDetailDrawer';

const StorageMap = () => {
    const [assets, setAssets] = useState([]);
    const [selectedBox, setSelectedBox] = useState('GS-13'); // Default for demo
    const [hoveredCell, setHoveredCell] = useState(null);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Mock Grid Dimensions (9x9 standard cryobox)
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    useEffect(() => {
        fetchBoxData(selectedBox);
    }, [selectedBox]);

    const fetchBoxData = async (boxName) => {
        try {
            // Server-side filtering for performance
            const response = await api.get('/assets', { params: { box: boxName } });
            setAssets(response.data);
        } catch (error) {
            console.error("Failed to load box data", error);
        }
    };

    const getAssetAtPosition = (pos) => {
        return assets.find(a => a.StorageLocation?.position === pos);
    };

    const handleCellClick = (asset) => {
        if (asset) {
            setSelectedAsset(asset);
            setIsDrawerOpen(true);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Box className="w-6 h-6 text-emerald-500" /> Storage Visualizer
                    </h2>
                    <p className="text-slate-500">Interactive map of freezer storage units.</p>
                </div>

                {/* Box Selector (Mock) */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <span className="px-3 text-xs font-bold text-slate-400 uppercase">Current Box</span>
                    <select
                        value={selectedBox}
                        onChange={(e) => setSelectedBox(e.target.value)}
                        className="bg-slate-50 border-none text-slate-700 font-bold text-sm focus:ring-0 rounded-md py-1"
                    >
                        <option value="GS-13">Box GS-13 (Phages)</option>
                        <option value="GS-14">Box GS-14 (Strains)</option>
                        <option value="GS-12">Box GS-12 (Plasmids)</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">

                {/* Grid Container */}
                <div className="bg-slate-800 p-8 rounded-xl shadow-2xl relative">
                    {/* Labels */}
                    <div className="absolute top-2 left-8 right-8 flex justify-between px-2">
                        {cols.map(c => <span key={c} className="text-slate-500 font-mono text-xs w-10 text-center">{c}</span>)}
                    </div>
                    <div className="absolute left-2 top-8 bottom-8 flex flex-col justify-between py-2">
                        {rows.map(r => <span key={r} className="text-slate-500 font-mono text-xs h-10 flex items-center">{r}</span>)}
                    </div>

                    {/* The Grid */}
                    <div className="grid grid-cols-9 gap-3 mt-4 ml-4 transform rotate-x-12 perspective-1000">
                        {rows.map(row => (
                            cols.map(col => {
                                const pos = `${row}${col}`;
                                const asset = getAssetAtPosition(pos);
                                const isHovered = hoveredCell === pos;

                                return (
                                    <div
                                        key={pos}
                                        onMouseEnter={() => setHoveredCell(pos)}
                                        onMouseLeave={() => setHoveredCell(null)}
                                        onClick={() => handleCellClick(asset)}
                                        className={`
                                            w-10 h-10 rounded-full border-2 transition-all duration-300 relative cursor-pointer group transform hover:translate-z-4
                                            ${asset
                                                ? (asset.type === 'Phage' ? 'bg-blue-500 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                                    : asset.type === 'Strain' ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                                        : 'bg-purple-500 border-purple-400')
                                                : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                                            }
                                            ${asset && asset.endotoxin_units < 5.0 ? 'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)] border-red-500 ring-2 ring-red-500' : ''}
                                            ${isHovered && asset ? 'scale-125 z-10' : ''}
                                        `}
                                        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Asset Name Label */}
                                        <div className="flex items-center justify-center h-full w-full">
                                            {asset ? (
                                                <div className="text-[8px] font-bold text-white text-center leading-tight px-0.5" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                                    {asset.phage_id || asset.strain_number || asset.id}
                                                </div>
                                            ) : (
                                                <div className='empty-node' />
                                            )}
                                        </div>
                                        {/* Tooltip */}
                                        {isHovered && asset && (
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-48 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl z-20 pointer-events-none">
                                                <p className="font-bold text-emerald-400 mb-1">{pos}</p>
                                                <p className="font-bold truncate">{asset.species}</p>
                                                <p className="text-slate-400">{asset.strain_number}</p>
                                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900"></div>
                                            </div>
                                        )}

                                        {/* Empty Slot Label */}
                                        {!asset && isHovered && (
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                                                {pos}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-8 flex gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        <span className="text-sm text-slate-600 font-medium">Phage</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-sm text-slate-600 font-medium">Bacterial Strain</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600"></div>
                        <span className="text-sm text-slate-400">Empty Slot</span>
                    </div>
                </div>

            </div>

            <AssetDetailDrawer
                asset={selectedAsset}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </div >
    );
};

export default StorageMap;
