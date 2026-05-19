import React, { useState } from 'react';
import axios from 'axios';
import { Search, Loader2, AlertTriangle, Check, X, MoveRight, Box } from 'lucide-react';

const api = axios.create({
    baseURL: 'http://localhost:5004/api',
    withCredentials: true
});

export const PlaceTubeModal = ({ isOpen, onClose, slot, onSuccess }) => {
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState('quick');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !slot) return null;

    const handleSearch = async () => {
        if (!query || query.length < 2) return;
        setSearching(true);
        try {
            const res = await api.get(`/inventory/search-assets?query=${encodeURIComponent(query)}&mode=${mode}`);
            setResults(res.data.results || []);
        } catch (err) {
            console.error('Search error', err);
        } finally {
            setSearching(false);
        }
    };

    const handlePlace = async () => {
        if (!selectedAsset) return;
        setSubmitting(true);
        try {
            const res = await api.post('/inventory/place-tube', {
                slotId: slot.id,
                asset: selectedAsset
            });
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Error placing tube', err);
            alert('Failed to place tube.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Place Tube in {slot.box_name} - {slot.position_code}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search by name, label..." 
                                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <select 
                            value={mode} 
                            onChange={(e) => setMode(e.target.value)}
                            className="border rounded-md px-3 py-2 bg-slate-50 text-slate-700"
                        >
                            <option value="quick">Quick Search</option>
                            <option value="deep">Deep Search</option>
                        </select>
                        <button 
                            onClick={handleSearch}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                        >
                            {searching ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Search'}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2 bg-slate-50">
                        {results.length === 0 && !searching && (
                            <p className="text-center text-slate-500 py-4 text-sm">No assets found. Try searching.</p>
                        )}
                        {results.map(asset => (
                            <div 
                                key={`${asset.type}-${asset.id}`}
                                onClick={() => setSelectedAsset(asset)}
                                className={`p-3 rounded-md cursor-pointer border flex justify-between items-center transition-colors ${selectedAsset?.id === asset.id && selectedAsset?.type === asset.type ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                            >
                                <div>
                                    <span className="text-xs font-bold uppercase text-slate-500">{asset.type}</span>
                                    <p className="font-bold text-slate-800">{asset.label}</p>
                                    <p className="text-xs text-slate-500">{asset.tube_label}</p>
                                </div>
                                {selectedAsset?.id === asset.id && selectedAsset?.type === asset.type && (
                                    <Check className="w-5 h-5 text-indigo-600"/>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button 
                        onClick={handlePlace}
                        disabled={!selectedAsset || submitting}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                        Confirm Placement
                    </button>
                </div>
            </div>
        </div>
    );
};

export const MoveTubeModal = ({ isOpen, onClose, slot, boxes, onSuccess }) => {
    const [targetBox, setTargetBox] = useState('');
    const [targetPos, setTargetPos] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || !slot) return null;

    const handleMove = async () => {
        if (!targetBox || !targetPos) return;
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post('/inventory/move-tube', {
                sourceSlotId: slot.id,
                targetBox,
                targetPosition: targetPos
            });
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Error moving tube', err);
            setError(err.response?.data?.error || 'Failed to move tube.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MoveRight className="w-5 h-5"/> Move Tube</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="p-6">
                    <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current Location</p>
                        <p className="font-bold text-slate-800">{slot.box_name} - {slot.position_code}</p>
                        <p className="text-sm mt-1">{slot.asset_type}: {slot.asset_label}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Target Box</label>
                            <select 
                                className="w-full border rounded-md p-2 focus:ring-indigo-500"
                                value={targetBox}
                                onChange={(e) => setTargetBox(e.target.value)}
                            >
                                <option value="">-- Select Target Box --</option>
                                {boxes.map(b => (
                                    <option key={b.box_name} value={b.box_name}>{b.box_name} ({b.empty_count} empty)</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Target Position (e.g., A1, B5)</label>
                            <input 
                                type="text"
                                className="w-full border rounded-md p-2 uppercase focus:ring-indigo-500"
                                placeholder="A1"
                                value={targetPos}
                                onChange={(e) => setTargetPos(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0"/> {error}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button 
                        onClick={handleMove}
                        disabled={!targetBox || !targetPos || submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                        Confirm Move
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ResolveConflictModal = ({ isOpen, onClose, slot, onSuccess }) => {
    const [decision, setDecision] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    // For REPLACE option
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);

    if (!isOpen || !slot) return null;

    const handleSearch = async () => {
        if (!query || query.length < 2) return;
        setSearching(true);
        try {
            const res = await api.get(`/inventory/search-assets?query=${encodeURIComponent(query)}&mode=quick`);
            setResults(res.data.results || []);
        } catch (err) {
            console.error('Search error', err);
        } finally {
            setSearching(false);
        }
    };

    const handleResolve = async () => {
        if (!decision) return;
        if (decision === 'REPLACE' && !selectedAsset) return;

        setSubmitting(true);
        try {
            const res = await api.post('/inventory/resolve-conflict', {
                slotId: slot.id,
                decision,
                replacementAsset: decision === 'REPLACE' ? selectedAsset : null
            });
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Error resolving', err);
            alert('Failed to resolve conflict.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-red-50">
                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Resolve Conflict</h3>
                    <button onClick={onClose} className="text-red-400 hover:text-red-600"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <p className="font-bold text-slate-800 text-lg mb-2">Slot {slot.position_code}</p>
                        <div className="bg-slate-50 p-4 border rounded-md">
                            <p className="text-sm font-bold mb-1 text-slate-600">System Record:</p>
                            <p className="text-indigo-700 font-bold">{slot.asset_type}: {slot.asset_label}</p>
                        </div>
                        <div className="bg-red-50 p-4 border border-red-200 rounded-md mt-2">
                            <p className="text-sm font-bold mb-1 text-red-600">Legacy Conflict Notes:</p>
                            <p className="text-sm font-mono whitespace-pre-wrap">{slot.notes}</p>
                        </div>
                    </div>

                    <p className="font-bold text-slate-800 mb-4 text-lg border-b pb-2">What do you want to do?</p>
                    
                    <div className="space-y-3">
                        {/* Option 1: Keep */}
                        <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${decision === 'KEEP' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="decision" value="KEEP" checked={decision === 'KEEP'} onChange={() => setDecision('KEEP')} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"/>
                                <div>
                                    <p className="font-bold text-slate-800">Keep current record</p>
                                    <p className="text-sm text-slate-500">Confirm that "{slot.asset_label}" is the correct tube physically in this slot.</p>
                                </div>
                            </div>
                        </label>

                        {/* Option 2: Replace */}
                        <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${decision === 'REPLACE' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-slate-50'}`}>
                            <div className="flex items-start gap-3">
                                <input type="radio" name="decision" value="REPLACE" checked={decision === 'REPLACE'} onChange={() => setDecision('REPLACE')} className="w-5 h-5 mt-1 text-indigo-600 focus:ring-indigo-500"/>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">Replace with another tube</p>
                                    <p className="text-sm text-slate-500 mb-2">Search the database to place the correct tube in this slot.</p>
                                    
                                    {decision === 'REPLACE' && (
                                        <div className="mt-3 p-3 bg-white border rounded-md" onClick={(e) => e.preventDefault()}>
                                            <div className="flex gap-2 mb-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Search..." 
                                                    className="flex-1 border rounded-md px-3 py-1.5 text-sm"
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                />
                                                <button onClick={handleSearch} className="bg-slate-800 text-white px-3 py-1.5 rounded-md text-sm">Search</button>
                                            </div>
                                            <div className="max-h-32 overflow-y-auto space-y-1">
                                                {results.map(asset => (
                                                    <div 
                                                        key={`${asset.type}-${asset.id}`}
                                                        onClick={() => setSelectedAsset(asset)}
                                                        className={`p-2 text-sm border rounded cursor-pointer ${selectedAsset?.id === asset.id ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <b>{asset.label}</b> ({asset.type})
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </label>

                        {/* Option 3: Unverified */}
                        <label className={`block p-4 border rounded-lg cursor-pointer transition-colors ${decision === 'UNVERIFIED' ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-3">
                                <input type="radio" name="decision" value="UNVERIFIED" checked={decision === 'UNVERIFIED'} onChange={() => setDecision('UNVERIFIED')} className="w-5 h-5 text-amber-600 focus:ring-amber-500"/>
                                <div>
                                    <p className="font-bold text-slate-800">Mark as unverified</p>
                                    <p className="text-sm text-slate-500">Keep the conflict flag active. Requires lab technician physical confirmation.</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-md">Cancel</button>
                    <button 
                        onClick={handleResolve}
                        disabled={!decision || (decision === 'REPLACE' && !selectedAsset) || submitting}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                        Confirm Decision
                    </button>
                </div>
            </div>
        </div>
    );
};
