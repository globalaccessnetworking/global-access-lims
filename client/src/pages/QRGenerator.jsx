import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import {
    Search,
    QrCode,
    Download,
    Filter,
    Beaker,
    Archive,
    CheckCircle2,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QRGenerator = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isPrintView, setIsPrintView] = useState(false);
    const [labelFormat, setLabelFormat] = useState('2D'); // '2D' or '1D'

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/qr/assets');
            setAssets(res.data.assets);
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
        return asset.uid || `${asset.prefix}-${asset.name.replace(/\s+/g, '')}-${asset.id}`;
    };

    const downloadQR = (asset) => {
        if (labelFormat === '2D') {
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
        } else {
            const barcodeCanvas = document.getElementById(`barcode-${asset.id}-${asset.assetType}`);
            if (!barcodeCanvas) return;

            const finalCanvas = document.createElement("canvas");
            const ctx = finalCanvas.getContext("2d");

            const padding = 20;
            const textHeight = 50;
            finalCanvas.width = barcodeCanvas.width + (padding * 2);
            finalCanvas.height = barcodeCanvas.height + textHeight + (padding * 2);

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            ctx.drawImage(barcodeCanvas, padding, padding);

            ctx.fillStyle = "black";
            ctx.textAlign = "center";

            ctx.font = "bold 14px Arial, sans-serif";
            ctx.fillText(asset.name, finalCanvas.width / 2, barcodeCanvas.height + padding + 20);

            ctx.font = "bold 12px monospace";
            ctx.fillText(getIdentityString(asset), finalCanvas.width / 2, barcodeCanvas.height + padding + 38);

            const pngUrl = finalCanvas.toDataURL("image/png");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `${getIdentityString(asset)}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
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

                <div className="grid grid-cols-4 print:flex print:flex-col print:items-center print:justify-start gap-4 print:gap-0 max-w-[210mm] mx-auto bg-white p-4 print:p-0">
                    {assets.filter(a => selectedIds.has(`${a.assetType}-${a.id}`)).map(asset => (
                        <div key={`${asset.assetType}-${asset.id}`} className="print:w-[2in] print:h-[1in] print:page-break-after-always print:m-0 border-2 border-black p-2 flex items-center justify-between bg-white rounded-lg mb-4 print:mb-0">
                            {labelFormat === '2D' ? (
                                <>
                                    <div className="flex-shrink-0">
                                        <QRCodeCanvas
                                            value={getIdentityString(asset)}
                                            size={70}
                                            level="H"
                                        />
                                    </div>
                                    <div className="ml-2 flex flex-col justify-center flex-grow overflow-hidden text-right">
                                        <p className="text-black font-extrabold text-[12px] leading-tight truncate">{asset.name}</p>
                                        <p className="text-black font-bold text-[9px] font-mono mt-1">{getIdentityString(asset)}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-shrink-0 flex items-center justify-center bg-white p-1 max-w-[65%]">
                                        <Barcode
                                            value={getIdentityString(asset)}
                                            format="CODE128"
                                            width={0.9}
                                            height={35}
                                            fontSize={8}
                                            margin={2}
                                            background="#ffffff"
                                            lineColor="#000000"
                                            displayValue={false}
                                            renderer="canvas"
                                        />
                                    </div>
                                    <div className="ml-2 flex flex-col justify-center flex-grow overflow-hidden text-right">
                                        <p className="text-black font-extrabold text-[11px] leading-tight truncate">{asset.name}</p>
                                        <p className="text-black font-bold text-[8px] font-mono mt-1 truncate">{getIdentityString(asset)}</p>
                                    </div>
                                </>
                            )}
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

                        {/* ── LABEL FORMAT TOGGLE ── */}
                        <div className="flex items-center gap-2 bg-slate-800 border border-white/5 rounded-xl p-1 flex-shrink-0">
                            <button
                                onClick={() => setLabelFormat('2D')}
                                title="2D QR Code — large tubes, boxes, falcon tubes"
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    labelFormat === '2D'
                                        ? 'bg-emerald-500 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                <QrCode size={14} /> 2D QR
                            </button>
                            <button
                                onClick={() => setLabelFormat('1D')}
                                title="1D Barcode — tiny 1.5ml microcentrifuge tubes"
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                    labelFormat === '1D'
                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'text-slate-500 hover:text-white'
                                }`}
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                    <rect x="0" y="0" width="2" height="14"/>
                                    <rect x="3" y="0" width="1" height="14"/>
                                    <rect x="5" y="0" width="3" height="14"/>
                                    <rect x="9" y="0" width="1" height="14"/>
                                    <rect x="11" y="0" width="2" height="14"/>
                                </svg>
                                1D Barcode
                            </button>
                        </div>
                    </div>
                </div>

                {/* Format hint banner */}
                {labelFormat === '1D' && (
                    <div className="mt-4 flex items-center gap-3 bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-2.5">
                        <span className="text-purple-400 text-xs font-bold uppercase tracking-widest">⬡ 1D Barcode Mode</span>
                        <span className="text-slate-400 text-xs">Optimized for 1.5ml microcentrifuge tubes — wraps cleanly around curved surfaces. Same UID encoded as 2D QR.</span>
                    </div>
                )}
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

                                <div
                                    className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mb-6 shadow-inner cursor-pointer overflow-hidden"
                                    onClick={() => toggleSelect(asset.id, asset.assetType)}
                                >
                                    {labelFormat === '2D' ? (
                                        <QRCodeCanvas
                                            id={`qr-${asset.id}-${asset.assetType}`}
                                            value={getIdentityString(asset)}
                                            size={140}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    ) : (
                                        <Barcode
                                            id={`barcode-${asset.id}-${asset.assetType}`}
                                            value={getIdentityString(asset)}
                                            format="CODE128"
                                            width={1.4}
                                            height={60}
                                            fontSize={9}
                                            margin={4}
                                            background="#ffffff"
                                            lineColor="#000000"
                                            displayValue={false}
                                            renderer="canvas"
                                        />
                                    )}
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
