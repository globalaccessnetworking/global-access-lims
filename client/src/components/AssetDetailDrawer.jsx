import React from 'react';
import { X, MapPin, Activity, Dna, FileText, Calendar, Box, ShieldCheck, Thermometer } from 'lucide-react';

const AssetDetailDrawer = ({ asset, isOpen, onClose }) => {
    if (!isOpen || !asset) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Drawer Panel */}
            <div className="absolute inset-y-0 right-0 max-w-lg w-full flex">
                <div className="h-full w-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">

                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${asset.type === 'Phage' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    asset.type === 'Strain' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                        asset.type === 'Plasmid' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                            'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>
                                    {asset.type}
                                </span>
                                <span className="text-xs font-mono text-slate-400">#{asset.id}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                                {asset.species}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium">{asset.strain_number}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 shadow-sm">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">

                        {/* HERO: Location Card */}
                        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <MapPin className="w-32 h-32 text-white" />
                            </div>

                            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
                                <Thermometer className="w-4 h-4" /> -80°C Storage Location
                            </h4>

                            <div className="grid grid-cols-2 gap-y-6 relative z-10">
                                <div className="col-span-2">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Freezer Name</p>
                                    <p className="text-xl font-bold text-white">{asset.StorageLocation?.freezer_name || 'Unassigned'}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Rack & Box</p>
                                    <div className="flex items-center gap-2">
                                        <Box className="w-5 h-5 text-slate-500" />
                                        <p className="text-lg font-bold text-white">
                                            {asset.StorageLocation?.rack ? `Rack ${asset.StorageLocation.rack}` : '--'} /
                                            {asset.StorageLocation?.box ? ` Box ${asset.StorageLocation.box}` : '--'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Exact Position</p>
                                    <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
                                        {asset.StorageLocation?.position || '--'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Characteristics */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-slate-400" /> Characteristics / Notes
                            </h4>
                            <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 leading-relaxed border border-slate-200 shadow-sm">
                                {asset.characteristics || "No additional notes found for this asset."}
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <Dna className="w-4 h-4" /> Source
                                </h4>
                                <p className="text-sm font-medium text-slate-800">{asset.source || "Unknown Source"}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date Added
                                </h4>
                                <p className="text-sm font-medium text-slate-800">{new Date(asset.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Quality Status
                                </h4>
                                <p className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">Verified Stock</p>
                            </div>
                        </div>

                        {/* Sequence Analysis Workbench */}
                        {(asset.type === 'Primer' || asset.type === 'Plasmid') && asset.sequence_data && (
                            <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2">
                                    <Dna className="w-4 h-4" /> Sequence Workbench
                                </h4>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase mb-1">Melting Temperature (Tm)</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-white">
                                                {(() => {
                                                    const seq = asset.sequence_data.toUpperCase();
                                                    const A = (seq.match(/A/g) || []).length;
                                                    const T = (seq.match(/T/g) || []).length;
                                                    const G = (seq.match(/G/g) || []).length;
                                                    const C = (seq.match(/C/g) || []).length;
                                                    const tm = 2 * (A + T) + 4 * (G + C);
                                                    return `${tm}°C`;
                                                })()}
                                            </span>
                                            <span className="text-xs text-slate-400">Estimated</span>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-500 uppercase mb-1">GC Content</p>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-purple-500 h-full rounded-full"
                                                style={{
                                                    width: (() => {
                                                        const seq = asset.sequence_data.toUpperCase();
                                                        const len = seq.length;
                                                        if (!len) return '0%';
                                                        const gc = (seq.match(/[GC]/g) || []).length;
                                                        return `${(gc / len * 100).toFixed(1)}%`;
                                                    })()
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                                        <p className="font-mono text-xs text-slate-300 break-all">{asset.sequence_data}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                        <button className="flex-1 bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                            Print Label <FileText className="w-4 h-4 opacity-70" />
                        </button>
                        <button className="px-6 py-3 border border-slate-200 hover:bg-white text-slate-700 rounded-xl font-bold transition-all">
                            Edit Data
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AssetDetailDrawer;
