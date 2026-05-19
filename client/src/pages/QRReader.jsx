import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import {
    Scan, AlertTriangle, CheckCircle2, Search, RefreshCw, X,
    FlaskConical, Dna, Microscope, Pill, Package, Plus, Minus,
    Link, ArrowLeft, Zap, Info, MapPin, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ───────────────────────────────────────────────────────────────
const ASSET_COLORS = {
    PHAGE:     { bg: 'bg-purple-500/20', text: 'text-purple-400',  border: 'border-purple-500/30',  icon: <Dna size={28} /> },
    BACTERIA:  { bg: 'bg-emerald-500/20',text: 'text-emerald-400', border: 'border-emerald-500/30', icon: <Microscope size={28} /> },
    PLASMID:   { bg: 'bg-blue-500/20',   text: 'text-blue-400',    border: 'border-blue-500/30',    icon: <FlaskConical size={28} /> },
    PRIMER:    { bg: 'bg-cyan-500/20',   text: 'text-cyan-400',    border: 'border-cyan-500/30',    icon: <Dna size={28} /> },
    INVENTORY: { bg: 'bg-amber-500/20',  text: 'text-amber-400',   border: 'border-amber-500/30',   icon: <Package size={28} /> },
};

const ASSET_LABELS = { PHAGE:'Bacteriophage', BACTERIA:'Bacterial Strain', PLASMID:'Plasmid', PRIMER:'Primer', INVENTORY:'Lab Inventory' };

// ─── LinkBarcodePanel ───────────────────────────────────────────────────────
const LinkBarcodePanel = ({ scannedCode, onLinked, onCancel }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [linking, setLinking] = useState(false);

    const search = async () => {
        if (!searchTerm.trim()) return;
        try {
            const res = await api.get('/scan/resolve/' + encodeURIComponent(searchTerm.trim()));
            if (res.data.success && res.data.asset_type === 'INVENTORY') setResults([res.data.details]);
            else {
                // fallback: try the QR assets list
                const allRes = await api.get('/qr/assets');
                const matches = (allRes.data.assets || []).filter(a =>
                    a.assetType === 'Inventory' && a.name.toLowerCase().includes(searchTerm.toLowerCase())
                ).slice(0, 10);
                setResults(matches.map(m => ({ id: m.id, name: m.name })));
            }
        } catch { setResults([]); }
    };

    const link = async (itemId) => {
        setLinking(true);
        try {
            await api.post('/scan/link-barcode', { item_id: itemId, barcode: scannedCode });
            onLinked();
        } catch { alert('Link failed'); }
        setLinking(false);
    };

    return (
        <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <p className="text-amber-400 font-bold text-sm">Scanned Code: <span className="font-mono">{scannedCode}</span></p>
                <p className="text-slate-400 text-xs mt-1">This barcode is not yet in the system. Search for an existing inventory item to link it to.</p>
            </div>
            <div className="flex gap-2">
                <input
                    type="text" placeholder="Search item name..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50"
                />
                <button onClick={search} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm"><Search size={16}/></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.map(r => (
                    <div key={r.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/5">
                        <span className="text-white text-sm font-medium truncate">{r.name}</span>
                        <button onClick={() => link(r.id)} disabled={linking}
                            className="ml-3 flex-shrink-0 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1">
                            <Link size={12}/> Link
                        </button>
                    </div>
                ))}
                {results.length === 0 && searchTerm && <p className="text-slate-500 text-sm text-center py-4">No results. Try a different name.</p>}
            </div>
            <button onClick={onCancel} className="w-full py-2.5 bg-slate-800 text-slate-400 rounded-xl text-sm font-bold border border-white/5">Cancel</button>
        </div>
    );
};

// ─── InventoryModal ─────────────────────────────────────────────────────────
const InventoryModal = ({ details, uid, onClose, onNextScan }) => {
    const [qty, setQty] = useState(parseFloat(details.current_quantity) || 0);
    const [delta, setDelta] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const isLow = qty <= 10;

    const adjust = async (finalDelta) => {
        if (!finalDelta || isNaN(finalDelta)) return;
        setSaving(true);
        try {
            const res = await api.post('/scan/adjust-quantity', {
                item_id: details.id,
                delta: parseFloat(finalDelta),
                action_type: parseFloat(finalDelta) > 0 ? 'RESTOCK' : 'CONSUME'
            });
            if (res.data.success) {
                setQty(res.data.new_quantity);
                setSaved(true);
                setDelta('');
                setTimeout(() => setSaved(false), 2500);
            }
        } catch { alert('Failed to update quantity.'); }
        setSaving(false);
    };

    return (
        <div className="space-y-5">
            {isLow && (
                <div className="bg-rose-600/20 border border-rose-500/50 rounded-2xl p-3 flex items-center gap-3">
                    <AlertTriangle className="text-rose-400 flex-shrink-0" size={18}/>
                    <p className="text-rose-300 text-xs font-bold uppercase tracking-wide">LOW STOCK ALERT — Only {qty} remaining</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 col-span-2">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Current Quantity</p>
                    <p className={`text-4xl font-black ${isLow ? 'text-rose-400' : 'text-white'}`}>{qty} <span className="text-sm text-slate-400 font-normal">{details.pack_size}</span></p>
                </div>
                {[['Location', details.location_area], ['Shelf', details.location_shelf], ['Category', details.category], ['Manufacturer', details.manufacturer]].map(([label, val]) => val ? (
                    <div key={label} className="bg-white/5 rounded-2xl p-3 border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">{label}</p>
                        <p className="text-white text-sm font-medium truncate">{val}</p>
                    </div>
                ) : null)}
            </div>

            {saved && <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-emerald-400 text-sm font-bold text-center">✓ Quantity updated successfully</div>}

            <div className="bg-slate-800/80 rounded-2xl p-4 border border-white/5 space-y-3">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Adjust Quantity</p>
                <div className="flex gap-2 items-center">
                    <button onClick={() => adjust(-1)} className="w-10 h-10 bg-rose-600/20 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-600/40 transition-all font-bold text-lg"><Minus size={18}/></button>
                    <input
                        type="number" step="0.1"
                        placeholder="Amount (+ add  / − subtract)"
                        value={delta} onChange={e => setDelta(e.target.value)}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-center font-mono outline-none focus:border-emerald-500/50"
                    />
                    <button onClick={() => adjust(1)} className="w-10 h-10 bg-emerald-600/20 text-emerald-400 rounded-xl flex items-center justify-center hover:bg-emerald-600/40 transition-all font-bold text-lg"><Plus size={18}/></button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => adjust(-Math.abs(parseFloat(delta) || 0))} disabled={!delta || saving}
                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-rose-500 transition-all">
                        {saving ? 'Saving...' : '— Consume'}
                    </button>
                    <button onClick={() => adjust(Math.abs(parseFloat(delta) || 0))} disabled={!delta || saving}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-emerald-500 transition-all">
                        {saving ? 'Saving...' : '+ Restock'}
                    </button>
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={onNextScan} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm border border-white/5 hover:bg-slate-600 transition-all flex items-center justify-center gap-2">
                    <Scan size={16}/> Next Scan
                </button>
                <button onClick={onClose} className="w-12 h-12 bg-slate-800 text-slate-400 rounded-xl border border-white/5 flex items-center justify-center hover:text-white transition-all">
                    <X size={18}/>
                </button>
            </div>
        </div>
    );
};

// ─── BioModal ───────────────────────────────────────────────────────────────
const BioModal = ({ assetType, details, uid, onNextScan, onClose }) => {
    const color = ASSET_COLORS[assetType] || ASSET_COLORS.PHAGE;
    const fields = {
        PHAGE:    [['Host Bacteria', details.host], ['Morphology', details.morphology], ['Genome Size', details.genome_size], ['WT/Recomb', details.wt_recomb], ['Freezer', details.freezer], ['Box', details.box], ['Position', details.position], ['Tube Label', details.tube_label]],
        BACTERIA: [['Species', details.species], ['WT/Recomb', details.wt_recomb], ['Sensitivity', details.sensitivity], ['Resistance', details.resistance], ['Freezer', details.freezer], ['Box', details.box], ['Position', details.position], ['Tube Label', details.tube_label]],
        PLASMID:  [['Backbone', details.backbone], ['Gene Source', details.gene_source], ['Marker', details.marker], ['Freezer', details.freezer], ['Box', details.box], ['Position', details.position], ['Tube Label', details.tube_label]],
        PRIMER:   [['Sequence', details.sequence], ['Purpose', details.purpose], ['Freezer', details.freezer], ['Box', details.box], ['Position', details.position]],
    };
    const rows = fields[assetType] || [];

    return (
        <div className="space-y-5">
            <div className={`${color.bg} border ${color.border} rounded-2xl p-4 flex items-center gap-4`}>
                <div className={`${color.text}`}>{color.icon}</div>
                <div>
                    <p className={`${color.text} text-[10px] font-bold uppercase tracking-widest`}>{ASSET_LABELS[assetType]}</p>
                    <p className="text-white font-black text-xl leading-tight">{details.name}</p>
                    <p className="text-slate-500 font-mono text-xs mt-0.5">{uid}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {rows.filter(([_, v]) => v).map(([label, val]) => (
                    <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">{label}</p>
                        <p className="text-white text-sm font-medium break-words">{val}</p>
                    </div>
                ))}
            </div>

            <div className={`flex items-center gap-2 ${color.bg} border ${color.border} rounded-xl p-3`}>
                <MapPin size={14} className={color.text}/>
                <p className={`${color.text} text-xs font-bold`}>
                    {details.freezer || '—'} → {details.box || '—'} → Slot {details.position || '—'}
                </p>
            </div>

            <div className="flex gap-3">
                <button onClick={onNextScan} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm border border-white/5 hover:bg-slate-600 transition-all flex items-center justify-center gap-2">
                    <Scan size={16}/> Next Scan
                </button>
                <button onClick={onClose} className="w-12 h-12 bg-slate-800 text-slate-400 rounded-xl border border-white/5 flex items-center justify-center hover:text-white transition-all">
                    <X size={18}/>
                </button>
            </div>
        </div>
    );
};

// ─── Main QRReader ──────────────────────────────────────────────────────────
const QRReader = () => {
    const [scanBuffer, setScanBuffer]   = useState('');
    const [manualId, setManualId]       = useState('');
    const [result, setResult]           = useState(null);   // { success, asset_type, uid, details, message, scanned_code }
    const [loading, setLoading]         = useState(false);
    const [showLink, setShowLink]       = useState(false);
    const inputRef  = useRef(null);
    const bufferRef = useRef('');
    const timerRef  = useRef(null);

    // Keep hidden input focused for USB scanner
    useEffect(() => {
        const keep = setInterval(() => {
            if (inputRef.current && !result && !showLink && document.activeElement?.tagName !== 'INPUT') {
                inputRef.current.focus();
            }
        }, 600);
        return () => clearInterval(keep);
    }, [result, showLink]);

    const resolve = useCallback(async (code) => {
        if (!code.trim()) return;
        setLoading(true);
        setResult(null);
        setShowLink(false);
        try {
            const res = await api.get(`/scan/resolve/${encodeURIComponent(code.trim())}`);
            setResult(res.data);
        } catch (err) {
            setResult({ success: false, message: 'Network error — server may be offline', scanned_code: code });
        } finally {
            setLoading(false);
        }
    }, []);

    // Hardware scanner keystroke aggregator
    const handleKeyDown = useCallback((e) => {
        if (result || showLink) return;
        if (e.key === 'Enter') {
            const buf = bufferRef.current.trim();
            bufferRef.current = '';
            setScanBuffer('');
            clearTimeout(timerRef.current);
            if (buf) resolve(buf);
        } else if (e.key.length === 1) {
            bufferRef.current += e.key;
            setScanBuffer(bufferRef.current);
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => { bufferRef.current = ''; setScanBuffer(''); }, 150);
        }
    }, [result, showLink, resolve]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const reset = () => { setResult(null); setShowLink(false); setScanBuffer(''); bufferRef.current = ''; };

    const color = result?.asset_type ? (ASSET_COLORS[result.asset_type] || ASSET_COLORS.INVENTORY) : ASSET_COLORS.INVENTORY;

    return (
        <div className="min-h-screen bg-[#020617] p-6 text-slate-300 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.05)_0%,_transparent_70%)] pointer-events-none"/>

            {/* Hidden hardware-scanner input (captures Enter key from HID device) */}
            <input ref={inputRef} readOnly tabIndex={-1} value={scanBuffer} autoFocus
                className="opacity-0 absolute top-0 left-0 w-0 h-0 pointer-events-none"
                onChange={() => {}}
            />

            <div className="w-full max-w-lg z-10">
                <AnimatePresence mode="wait">

                    {/* ── IDLE STATE ── */}
                    {!result && !loading && (
                        <motion.div key="idle" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }} className="space-y-6 text-center">
                            <div className="relative inline-flex items-center justify-center">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse"/>
                                <div className="relative p-12 bg-slate-900 border border-emerald-500/20 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                    <Scan className="w-20 h-20 text-emerald-500 animate-pulse"/>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-full shadow-lg shadow-emerald-500/40">
                                    <Zap className="w-5 h-5 text-slate-900"/>
                                </div>
                            </div>

                            <div>
                                <h1 className="text-3xl font-black text-white tracking-widest uppercase">Scan Station</h1>
                                <p className="text-emerald-500/70 font-mono text-xs tracking-widest mt-1 animate-pulse">READY — USB SCANNER ACTIVE</p>
                            </div>

                            {scanBuffer && (
                                <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-4 font-mono text-emerald-400 text-sm tracking-widest animate-pulse">
                                    Reading: {scanBuffer}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-3 text-xs">
                                {[['Phages', 'LIMS-PHG-52','purple'],['Strains','LIMS-STR-10','emerald'],['Inventory','Barcode/Name','amber']].map(([t,e,c]) => (
                                    <div key={t} className={`bg-${c}-500/10 border border-${c}-500/20 rounded-xl p-3`}>
                                        <p className={`text-${c}-400 font-bold`}>{t}</p>
                                        <p className="text-slate-500 font-mono mt-1">{e}</p>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={e => { e.preventDefault(); if (manualId.trim()) { resolve(manualId.trim()); setManualId(''); }}} className="relative">
                                <Search className="absolute left-4 top-3.5 text-slate-500 w-4 h-4"/>
                                <input type="text" placeholder="Manual entry — type code and press Enter"
                                    value={manualId} onChange={e => setManualId(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white text-center focus:border-emerald-500/50 outline-none placeholder:text-slate-600"
                                />
                            </form>
                        </motion.div>
                    )}

                    {/* ── LOADING ── */}
                    {loading && (
                        <motion.div key="loading" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="flex flex-col items-center gap-6 py-20">
                            <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"/>
                            <p className="text-emerald-500 font-mono text-sm tracking-widest animate-pulse">SEARCHING BIO-VAULT...</p>
                        </motion.div>
                    )}

                    {/* ── RESULT ── */}
                    {result && !loading && (
                        <motion.div key="result" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                                <button onClick={reset} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-all">
                                    <ArrowLeft size={14}/> New Scan
                                </button>
                                {result.uid && <span className="text-slate-500 font-mono text-[10px]">{result.uid}</span>}
                                <button onClick={reset}><X size={18} className="text-slate-500 hover:text-white transition-colors"/></button>
                            </div>

                            <div className="p-6">
                                {/* NOT FOUND */}
                                {!result.success && !showLink && (
                                    <div className="space-y-5 text-center">
                                        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto"/>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Asset Not Found</h3>
                                            <p className="text-slate-400 text-sm mt-1">{result.message}</p>
                                            <p className="text-slate-600 font-mono text-xs mt-2">{result.scanned_code}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowLink(true)}
                                                className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-500 transition-all">
                                                <Link size={16}/> Link to Inventory Item
                                            </button>
                                            <button onClick={reset} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm border border-white/5 hover:bg-slate-700 transition-all">
                                                Scan Again
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* LINK BARCODE PANEL */}
                                {!result.success && showLink && (
                                    <LinkBarcodePanel scannedCode={result.scanned_code} onLinked={reset} onCancel={() => setShowLink(false)}/>
                                )}

                                {/* BIOLOGICAL ASSET */}
                                {result.success && result.asset_type !== 'INVENTORY' && (
                                    <BioModal assetType={result.asset_type} details={result.details} uid={result.uid} onNextScan={reset} onClose={reset}/>
                                )}

                                {/* INVENTORY ITEM */}
                                {result.success && result.asset_type === 'INVENTORY' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                                            <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400"><Package size={24}/></div>
                                            <div>
                                                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">Lab Inventory</p>
                                                <h3 className="text-xl font-black text-white leading-tight">{result.details.name}</h3>
                                            </div>
                                        </div>
                                        <InventoryModal details={result.details} uid={result.uid} onNextScan={reset} onClose={reset}/>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QRReader;
