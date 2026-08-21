import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Layers, AlertTriangle, Info, Map, Beaker, Circle, Filter } from 'lucide-react';
import { PlaceTubeModal, MoveTubeModal, ResolveConflictModal } from '../components/InventoryModals';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const ASSET_COLORS = {
    phage: 'bg-purple-100 text-purple-800 border-purple-300',
    bacteria: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    plasmid: 'bg-amber-100 text-amber-800 border-amber-300',
    primer: 'bg-blue-100 text-blue-800 border-blue-300',
    empty: 'bg-gray-50 border-gray-300 border-dashed text-gray-400'
};

const BoxMatrix = () => {
    const [boxes, setBoxes] = useState([]);
    const [freezers, setFreezers] = useState([]);
    const [selectedFreezer, setSelectedFreezer] = useState('');
    const [selectedBox, setSelectedBox] = useState('');
    const [matrix, setMatrix] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Modal States
    const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

    useEffect(() => {
        fetchBoxes();
        fetchFreezers();
    }, []);

    useEffect(() => {
        if (selectedBox) fetchMatrix(selectedBox);
    }, [selectedBox]);

    const fetchBoxes = async () => {
        try {
            const res = await api.get('/inventory/boxes');
            if (res.data.success) {
                setBoxes(res.data.boxes);
            }
        } catch (err) {
            console.error('Error fetching boxes', err);
        }
    };

    const fetchFreezers = async () => {
        try {
            const res = await api.get('/inventory/freezers');
            if (res.data.success) {
                setFreezers(res.data.freezers);
            }
        } catch (err) {
            console.error('Error fetching freezers', err);
        }
    };

    const fetchMatrix = async (boxName) => {
        setLoading(true);
        setSelectedSlot(null);
        try {
            const res = await api.get(`/inventory/box-matrix/${encodeURIComponent(boxName)}`);
            if (res.data.success) {
                setMatrix(res.data.matrix);
            }
        } catch (err) {
            console.error('Error fetching matrix', err);
        } finally {
            setLoading(false);
        }
    };

    const getSlot = (row, col) => {
        return matrix.find(m => m.row === row && m.column === col);
    };

    const handleMutationSuccess = () => {
        fetchBoxes();
        if (selectedBox) fetchMatrix(selectedBox);
    };

    const handleRemoveTube = async () => {
        if (!selectedSlot) return;
        const confirmDelete = window.confirm('Are you sure you want to remove this tube from the box? This will clear its location data.');
        if (!confirmDelete) return;

        setLoading(true);
        try {
            const res = await api.post('/inventory/remove-tube', { slotId: selectedSlot.id });
            if (res.data.success) {
                handleMutationSuccess();
                setSelectedSlot(null);
            } else {
                alert(res.data.error || 'Failed to remove tube');
            }
        } catch (err) {
            console.error('Error removing tube:', err);
            alert(err.response?.data?.error || 'Failed to remove tube');
        } finally {
            setLoading(false);
        }
    };

    const filteredBoxes = selectedFreezer ? boxes.filter(b => b.freezer_name === selectedFreezer) : boxes;
    const currentBoxStats = boxes.find(b => b.box_name === selectedBox);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Map className="w-6 h-6 text-indigo-600" />
                        Universal Freezer Box Matrix
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Select a box to view its full 100-slot grid.
                    </p>
                </div>
                
                <div className="flex-1 max-w-xl flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Filter className="w-3 h-3"/> Filter by Freezer</label>
                        <select
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            value={selectedFreezer}
                            onChange={(e) => { setSelectedFreezer(e.target.value); setSelectedBox(''); }}
                        >
                            <option value="">All Freezers</option>
                            {freezers.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="flex-[2]">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Box to View</label>
                        <select
                            className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-medium text-slate-800 text-sm"
                            value={selectedBox}
                            onChange={(e) => setSelectedBox(e.target.value)}
                        >
                            <option value="">-- Choose a box --</option>
                            {filteredBoxes.map(b => (
                                <option key={b.box_name} value={b.box_name}>
                                    {b.box_name} - {b.box_display_name || 'No Label'} (Occ: {b.occupied_count} | ⚠: {b.conflict_count})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedBox && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Matrix Grid Area */}
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                        <div className="mb-4 flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                {selectedBox} - {currentBoxStats?.box_display_name || 'Descriptive Label Missing'}
                            </h2>
                            {currentBoxStats && (
                                <div className="flex gap-6 text-sm font-bold">
                                    <span className="text-emerald-600 flex items-center gap-1.5 bg-emerald-100 px-3 py-1 rounded-full"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {currentBoxStats.empty_count} Empty Slots</span>
                                    <span className="text-slate-600 flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border shadow-sm"> {currentBoxStats.occupied_count} Occupied</span>
                                    {currentBoxStats.conflict_count > 0 && (
                                        <span className="text-red-600 flex items-center gap-1.5 bg-red-100 px-3 py-1 rounded-full ring-1 ring-red-300 shadow-sm">
                                            <AlertTriangle className="w-4 h-4"/> {currentBoxStats.conflict_count} Conflicts
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mb-6 text-xs font-semibold bg-white border rounded-lg p-3 shadow-sm">
                            <span className="text-slate-500 uppercase tracking-widest mr-2 flex items-center">Legend:</span>
                            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded shadow-sm bg-purple-100 border border-purple-300"></span> Phage</span>
                            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded shadow-sm bg-emerald-100 border border-emerald-300"></span> Bacteria</span>
                            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded shadow-sm bg-amber-100 border border-amber-300"></span> Plasmid</span>
                            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded shadow-sm bg-blue-100 border border-blue-300"></span> Primer</span>
                            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-50 border border-gray-300 border-dashed"></span> Empty</span>
                            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-50 border-2 border-red-500 flex items-center justify-center"><AlertTriangle className="w-3 h-3 text-red-500"/></span> Conflict</span>
                        </div>

                        {/* The Grid */}
                        <div className="min-w-[800px]">
                            {/* Column Headers */}
                            <div className="grid grid-cols-11 gap-2 mb-2 text-center">
                                <div className="w-8 h-8"></div>
                                {COLS.map(c => (
                                    <div key={c} className="font-bold text-slate-400 text-sm">{c}</div>
                                ))}
                            </div>

                            {/* Rows */}
                            {ROWS.map(row => (
                                <div key={row} className="grid grid-cols-11 gap-2 mb-2">
                                    <div className="flex items-center justify-center font-bold text-slate-400 text-sm">
                                        {row}
                                    </div>
                                    {COLS.map(col => {
                                        const slot = getSlot(row, col);
                                        if (!slot) return <div key={col} className="h-14 bg-gray-50 border-2 border-dashed border-gray-200 rounded-md"></div>;
                                        
                                        const isOccupied = slot.is_occupied;
                                        const isConflict = slot.conflict_flag;
                                        const isSelected = selectedSlot?.id === slot.id;
                                        const colorClass = isOccupied ? ASSET_COLORS[slot.asset_type] || 'bg-slate-100 border-slate-300' : ASSET_COLORS.empty;
                                        
                                        // Strong visual indicators
                                        const conflictBorder = isConflict ? 'ring-2 ring-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] z-10' : '';
                                        const selectedBorder = isSelected ? 'ring-4 ring-indigo-500 ring-offset-1 border-indigo-600 shadow-lg scale-105 z-20' : '';

                                        return (
                                            <div 
                                                key={col}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`
                                                    h-14 rounded-md border-2 p-1 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center relative hover:shadow-md hover:scale-105
                                                    ${colorClass} ${conflictBorder} ${selectedBorder}
                                                `}
                                                title={isOccupied ? `${slot.asset_type}: ${slot.asset_label}` : 'Empty Slot'}
                                            >
                                                {isConflict && (
                                                    <AlertTriangle className="absolute -top-2 -right-2 w-5 h-5 text-red-500 bg-white rounded-full" />
                                                )}
                                                {isOccupied ? (
                                                    <>
                                                        <span className="text-[10px] uppercase font-bold truncate w-full text-center opacity-70">
                                                            {slot.asset_type?.substring(0,4)}
                                                        </span>
                                                        <span className="text-xs font-bold truncate w-full text-center">
                                                            {slot.asset_label || slot.tube_label || '??'}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs opacity-0 hover:opacity-50">Add</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Details Panel */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-500" /> Slot Details
                        </h3>
                        
                        {!selectedSlot ? (
                            <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                                <Circle className="w-12 h-12 mb-2 opacity-20" />
                                <p>Click any slot on the grid to view details</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Position</p>
                                    <p className="text-xl font-bold text-slate-800">{selectedSlot.position_code}</p>
                                </div>

                                {!selectedSlot.is_occupied ? (
                                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-emerald-800 flex items-start gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-full"><Beaker className="w-5 h-5 text-emerald-600"/></div>
                                        <div>
                                            <p className="font-bold">Empty Slot</p>
                                            <p className="text-sm mt-1">This location is available for new tubes.</p>
                                            <button 
                                                onClick={() => setIsPlaceModalOpen(true)}
                                                className="mt-3 w-full bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                                            >
                                                Add Tube Here
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Asset Info</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ASSET_COLORS[selectedSlot.asset_type]?.split(' ')[0]} ${ASSET_COLORS[selectedSlot.asset_type]?.split(' ')[1]}`}>
                                                    {selectedSlot.asset_type}
                                                </span>
                                                <span className="font-bold text-slate-800">{selectedSlot.asset_label}</span>
                                            </div>
                                        </div>

                                        {selectedSlot.tube_label && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Tube Label</p>
                                                <p className="text-sm text-slate-800 font-medium">{selectedSlot.tube_label}</p>
                                            </div>
                                        )}

                                        {selectedSlot.freezer_name && (
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Freezer</p>
                                                <p className="text-sm text-slate-800">{selectedSlot.freezer_name}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Source Database Table</p>
                                            <p className="text-sm font-mono bg-slate-100 p-1 rounded text-slate-600 mt-1">
                                                {selectedSlot.source_table}
                                            </p>
                                        </div>

                                        {selectedSlot.conflict_flag && (
                                            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800 mt-6">
                                                <p className="font-bold flex items-center gap-1 mb-2">
                                                    <AlertTriangle className="w-4 h-4"/> Conflict Detected
                                                </p>
                                                <p className="text-xs whitespace-pre-wrap font-mono bg-white p-2 rounded border border-red-100 mb-3">
                                                    {selectedSlot.notes}
                                                </p>
                                                <button 
                                                    onClick={() => setIsResolveModalOpen(true)}
                                                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                                                >
                                                    Resolve Conflict
                                                </button>
                                            </div>
                                        )}

                                        {!selectedSlot.conflict_flag && (
                                            <>
                                                <button 
                                                    onClick={() => setIsMoveModalOpen(true)}
                                                    className="mt-6 w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                                                >
                                                    Move Tube
                                                </button>
                                                <button 
                                                    onClick={handleRemoveTube}
                                                    className="mt-3 w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                                                >
                                                    Remove Tube
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {loading && (
                <div className="h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {/* Modals */}
            <PlaceTubeModal 
                isOpen={isPlaceModalOpen} 
                onClose={() => setIsPlaceModalOpen(false)} 
                slot={selectedSlot}
                onSuccess={handleMutationSuccess}
            />
            <MoveTubeModal 
                isOpen={isMoveModalOpen} 
                onClose={() => setIsMoveModalOpen(false)} 
                slot={selectedSlot}
                boxes={boxes}
                onSuccess={handleMutationSuccess}
            />
            <ResolveConflictModal 
                isOpen={isResolveModalOpen} 
                onClose={() => setIsResolveModalOpen(false)} 
                slot={selectedSlot}
                onSuccess={handleMutationSuccess}
            />
        </div>
    );
};

export default BoxMatrix;
