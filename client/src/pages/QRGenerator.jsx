import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { QRCodeCanvas } from 'qrcode.react';
import {
    Search,
    QrCode,
    Download,
    Filter,
    Beaker,
    Archive,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QRGenerator = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isPrintView, setIsPrintView] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const [chemRes, invRes, bioRes] = await Promise.all([
                api.get('/inventory/chemicals'),
                api.get('/inventory/stocks'),
                api.get('/bio') // This returns { assets: [...] }
            ]);

            const combined = [
                ...chemRes.data.map(c => ({ ...c, assetType: 'Chemical', prefix: 'INV' })),
                ...invRes.data.map(i => ({ ...i, assetType: 'Inventory', name: i.item_name, prefix: 'INV' })),
                ...(bioRes.data.assets?.map(b => ({
                    ...b,
                    id: b.asset_id, // Map for consistency
                    assetType: b.type.charAt(0).toUpperCase() + b.type.slice(1),
                    prefix: 'BIO'
                })) || [])
            ];

            setAssets(combined);
        } catch (err) {
            console.error("Failed to fetch data for QR generation", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id, type) => {
        const key = `${type}-${id}`;
        const newSelected = new Set(selectedIds);
        if (newSelected.has(key)) newSelected.delete(key);
        else newSelected.add(key);
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredAssets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAssets.map(a => `${a.assetType}-${a.id}`)));
        }
    };

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.asset_id && a.asset_id.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'All' ||
            (filterType === 'Bio' && a.prefix === 'BIO') ||
            (filterType === 'Inventory' && a.prefix === 'INV') ||
            a.assetType === filterType;
        return matchesSearch && matchesType;
    });

    const getIdentityString = (asset) => {
        return `${asset.prefix}-${asset.name.replace(/\s+/g, '')}-${asset.id}`;
    };

    const downloadQR = (asset) => {
        const qrCanvas = document.getElementById(`qr-${asset.id}-${asset.assetType}`);
        if (!qrCanvas) return;

        const finalCanvas = document.createElement("canvas");
        const ctx = finalCanvas.getContext("2d");

        const padding = 20;
        const textHeight = 70;
        finalCanvas.width = qrCanvas.width + (padding * 2);
        finalCanvas.height = qrCanvas.height + textHeight + (padding * 2);

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        ctx.drawImage(qrCanvas, padding, padding);

        ctx.fillStyle = "black";
        ctx.textAlign = "center";

        ctx.font = "bold 18px Arial, sans-serif";
        ctx.fillText(asset.name, finalCanvas.width / 2, qrCanvas.height + padding + 30);

        ctx.font = "bold 14px monospace";
        ctx.fillText(getIdentityString(asset), finalCanvas.width / 2, qrCanvas.height + padding + 55);

        const pngUrl = finalCanvas.toDataURL("image/png");
        let downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `${getIdentityString(asset)}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    if (loading) return <div className="p-8 text-emerald-500 font-bold animate-pulse">Scanning Bio-Vault...</div>;

    if (isPrintView) {
        return (
            <div className="bg-white min-h-screen p-8 print:p-0">
                <div className="mb-8 print:hidden flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-white/10">
                    <h2 className="text-white font-bold">Print Preview (Standard A4 Sheet)</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.print()}
                            className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold shadow-lg"
                        >
                            Print Sheet
                        </button>
                        <button
                            onClick={() => setIsPrintView(false)}
                            className="bg-slate-700 text-white px-6 py-2 rounded-xl font-bold"
                        >
                            Back to Generator
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 print:gap-2 max-w-[210mm] mx-auto bg-white p-4 print:p-0">
                    {assets.filter(a => selectedIds.has(`${a.assetType}-${a.id}`)).map(asset => (
                        <div key={`${asset.assetType}-${asset.id}`} className="border-2 border-black p-4 flex flex-col items-center justify-center bg-white space-y-2 rounded-lg">
                            <QRCodeCanvas
                                value={getIdentityString(asset)}
                                size={120}
                                level="H"
                            />
                            <div className="text-center">
                                <p className="text-black font-bold text-sm truncate w-full px-1">{asset.name}</p>
                                <p className="text-black font-bold text-[10px] font-mono">{getIdentityString(asset)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 font-bold text-emerald-400">
                            <QrCode size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">QR Protocol Hub</h1>
                            <p className="text-slate-400 mt-1 uppercase text-[10px] font-bold tracking-widest">A4 Bulk Printing & Asset Standardizer</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-4 top-3.5 text-slate-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search all assets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-all font-mono text-sm"
                            />
                        </div>
                        <div className="flex bg-slate-800 rounded-xl p-1 border border-white/5">
                            {['All', 'Inventory', 'Bio'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === t ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/30 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={selectAll}
                        className="text-xs font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest pl-2"
                    >
                        {selectedIds.size === filteredAssets.length ? 'Deselect All' : 'Select Visible'}
                    </button>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{selectedIds.size} Assets Selected</span>
                </div>
                {selectedIds.size > 0 && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setIsPrintView(true)}
                        className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-xs shadow-xl shadow-emerald-500/10 active:scale-95 transition-all"
                    >
                        Generate Print Sheet ({selectedIds.size})
                    </motion.button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {filteredAssets.map(asset => {
                        const isSelected = selectedIds.has(`${asset.assetType}-${asset.id}`);
                        return (
                            <motion.div
                                key={`${asset.assetType}-${asset.id}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`bg-slate-900 border transition-all duration-300 rounded-3xl p-6 group relative overflow-hidden ${isSelected ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'border-white/10 hover:border-white/20'}`}
                            >
                                <div className="absolute top-4 right-4 z-20">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelect(asset.id, asset.assetType)}
                                        className="w-5 h-5 rounded-lg border-white/10 bg-slate-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                                    />
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-3 rounded-2xl ${asset.prefix === 'INV' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {asset.prefix === 'INV' ? <Beaker size={20} /> : <Archive size={20} />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-white font-bold leading-tight truncate">{asset.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-mono font-bold uppercase mt-1 tracking-widest">{getIdentityString(asset)}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl mb-6 shadow-inner cursor-pointer" onClick={() => toggleSelect(asset.id, asset.assetType)}>
                                    <QRCodeCanvas
                                        id={`qr-${asset.id}-${asset.assetType}`}
                                        value={getIdentityString(asset)}
                                        size={140}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                <button
                                    onClick={() => downloadQR(asset)}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-500 text-slate-400 hover:text-white py-3 rounded-2xl font-bold transition-all border border-white/5 hover:border-emerald-400/50 text-xs uppercase tracking-widest"
                                >
                                    <Download size={14} /> Download Label
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {filteredAssets.length === 0 && (
                <div className="text-center py-20 text-slate-600 font-bold uppercase tracking-widest text-sm">
                    No matching assets found in laboratory vault
                </div>
            )}
        </div>
    );
};

export default QRGenerator;
