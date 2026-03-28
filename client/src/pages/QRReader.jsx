import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
    Scan,
    AlertTriangle,
    CheckCircle2,
    Search,
    RefreshCw,
    X,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QRReader = () => {
    const [scannedData, setScannedData] = useState('');
    const [manualId, setManualId] = useState('');
    const [assetData, setAssetData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [consumptionValue, setConsumptionValue] = useState('');
    const [successMessage, setSuccessMessage] = useState(null);
    const inputRef = useRef(null);

    // Maintain focus on the hidden input for USB scanner
    useEffect(() => {
        const interval = setInterval(() => {
            if (inputRef.current &&
                document.activeElement !== inputRef.current &&
                !assetData &&
                !error &&
                document.activeElement.tagName !== 'INPUT' // Don't steal focus from manual input
            ) {
                inputRef.current.focus();
            }
        }, 500);
        return () => clearInterval(interval);
    }, [assetData, error]);

    const performLookup = async (lookupParams) => {
        setLoading(true);
        setError(null);
        setAssetData(null);
        setSuccessMessage(null);

        try {
            // Standardized QR Lookup
            const res = await api.get('/qr/lookup', {
                params: { identity: lookupParams.identity }
            });

            if (res.data.success) {
                const { type, asset } = res.data;

                if (type === 'BIO') {
                    // Redirect for Bio Samples
                    window.location.href = `/library?search=${asset.name}`;
                    return;
                }

                if (type === 'INV') {
                    setAssetData(asset);
                    setConsumptionValue('');
                }
            } else {
                setError("Asset not found in Digital Bio-Vault");
            }
        } catch (err) {
            console.error("Lookup error", err);
            setError("Identification system offline or invalid code.");
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async (e) => {
        e.preventDefault();
        const value = scannedData.trim();
        if (!value) return;

        let parsed;
        try {
            parsed = JSON.parse(value);
        } catch (e) {
            parsed = { identity: value };
        }

        await performLookup({
            id: parsed.id,
            type: parsed.type,
            identity: parsed.identity || parsed.barcode
        });
        setScannedData('');
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualId.trim()) return;
        performLookup({ identity: manualId.trim() });
        setManualId('');
    };

    const handleConsume = async () => {
        if (!consumptionValue || isNaN(consumptionValue)) return;

        setLoading(true);
        try {
            const newVolume = Math.max(0, assetData.current_volume - parseFloat(consumptionValue));
            const res = await api.put(`/inventory/${assetData.id}/volume`, {
                current_volume: newVolume
            });

            if (res.data) {
                setAssetData({ ...assetData, current_volume: newVolume });
                setSuccessMessage(`Consumed ${consumptionValue}${assetData.unit_type || assetData.unit}. Balance: ${newVolume}`);
            }
        } catch (err) {
            console.error("Consumption failed", err);
            setError("Failed to record consumption.");
        } finally {
            setLoading(false);
            setConsumptionValue('');
        }
    };

    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleDownloadPDF = async () => {
        try {
            setSendingEmail(true);
            const response = await api.get(`/orders/purchase-request/${assetData.id}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Purchase_Request_${assetData.item_name || assetData.name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setEmailSent(true);
            setSuccessMessage("PDF Generated & Email Sent to Supplier");
            setTimeout(() => {
                setEmailSent(false);
                setSuccessMessage(null);
            }, 5000);
        } catch (err) {
            console.error("PDF/Email process failed", err);
            setError("Failed to generate PDF or send email.");
        } finally {
            setSendingEmail(false);
        }
    };

    const isLowStock = assetData && assetData.current_volume <= 40;

    return (
        <div className="min-h-screen bg-[#020617] p-8 text-slate-300 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>

            {/* Hidden Input for USB Scanner */}
            <form onSubmit={handleScan} className="opacity-0 absolute top-0 left-0">
                <input
                    ref={inputRef}
                    type="text"
                    value={scannedData}
                    onChange={(e) => setScannedData(e.target.value)}
                    autoFocus
                />
            </form>

            <div className="w-full max-w-xl z-10">
                <AnimatePresence mode="wait">
                    {!assetData && !error ? (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="text-center space-y-8"
                        >
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                <div className="relative p-12 bg-slate-900 border border-emerald-500/20 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                    <Scan className="w-24 h-24 text-emerald-500 animate-[pulse_2s_infinite]" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-full shadow-lg shadow-emerald-500/40">
                                    <RefreshCw className="w-6 h-6 text-slate-900 animate-spin-slow" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold text-white tracking-widest uppercase">Vault Interface Active</h2>
                                <p className="text-emerald-500/60 font-mono text-sm tracking-widest animate-pulse">READY TO SCAN • FOCUS LOCKED</p>
                            </div>

                            {/* Manual Entry Field */}
                            <div className="max-w-xs mx-auto">
                                <form onSubmit={handleManualSubmit} className="relative">
                                    <input
                                        type="text"
                                        placeholder="Or Manual Entry (e.g. AMIK-001)"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white text-center focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                                    />
                                    <button type="submit" className="hidden">Enter</button>
                                </form>
                                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-tighter">Press Enter to look up ID</p>
                            </div>

                            <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm">
                                <p className="text-slate-400 text-sm italic">
                                    "Point handheld scanner at asset QR or Barcode to retrieve bio-catalog identity."
                                </p>
                            </div>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-rose-500/10 border border-rose-500/30 p-12 rounded-3xl text-center space-y-6"
                        >
                            <AlertTriangle className="w-20 h-20 text-rose-500 mx-auto" />
                            <h3 className="text-2xl font-bold text-white">Security Alert: Unknown Subject</h3>
                            <p className="text-rose-300 font-mono text-sm uppercase">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="px-8 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-900/40"
                            >
                                Re-Scan Asset
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 border border-emerald-500/30 p-1 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {/* Low Stock Warning Banner */}
                            {isLowStock && (
                                <div className="bg-rose-600 text-white py-3 px-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b border-rose-500/30">
                                    <div className="flex items-center gap-2 animate-pulse">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>CRITICAL LOW STOCK: {assetData.current_volume}{assetData.unit_type || assetData.unit} REMAINING</span>
                                    </div>
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={sendingEmail || emailSent}
                                        className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-2 group ${emailSent
                                            ? 'bg-emerald-500 text-slate-900 border-emerald-400'
                                            : 'bg-white/10 hover:bg-white text-white hover:text-rose-600 border border-white/20'
                                            }`}
                                    >
                                        {sendingEmail ? (
                                            <>
                                                <RefreshCw size={14} className="animate-spin" />
                                                <span>Generating & Sending...</span>
                                            </>
                                        ) : emailSent ? (
                                            <>
                                                <CheckCircle2 size={14} />
                                                <span>Order Sent to Supplier!</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileText size={14} className="group-hover:scale-110 transition-transform" />
                                                Generate Reorder PDF
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Identification Successful</p>
                                            <h3 className="text-2xl font-bold text-white">{assetData.name || assetData.item_name}</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setAssetData(null); setSuccessMessage(null); }}
                                        className="text-slate-500 hover:text-white transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {successMessage && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-emerald-400 text-sm font-bold text-center animate-fade-in">
                                        {successMessage}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Catalog ID</p>
                                        <p className="text-white font-mono">{assetData.barcode || assetData.qr_identity_string || assetData.id}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Current Balance</p>
                                        <p className="text-white font-mono text-xl">{assetData.current_volume} <span className="text-xs text-slate-500 font-sans">{assetData.unit_type || assetData.unit}</span></p>
                                    </div>

                                    {/* Consumption Input */}
                                    <div className="col-span-2 space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider italic">Consumption Entry</label>
                                            <span className="text-[10px] text-slate-600 font-mono">STEP: 0.1{assetData.unit_type || assetData.unit}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            <input
                                                type="number"
                                                step="0.1"
                                                placeholder={`Amount to subtract (${assetData.unit_type || assetData.unit})`}
                                                value={consumptionValue}
                                                onChange={(e) => setConsumptionValue(e.target.value)}
                                                className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                                            />
                                            {(() => {
                                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                                const isSuperAdmin = user.username === 'admin' || user.role === 'SuperAdmin';
                                                const hasWriteAccess = isSuperAdmin || (user.permissions && user.permissions.qr_read === 'write');

                                                if (!hasWriteAccess) return null;

                                                return (
                                                    <button
                                                        onClick={handleConsume}
                                                        disabled={!consumptionValue || loading}
                                                        className="px-6 py-3 bg-white text-slate-950 rounded-xl font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs"
                                                    >
                                                        Subtract
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => window.location.href = `/inventory/${assetData.id}`}
                                        className="flex-1 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Search size={18} /> Physical Profile
                                    </button>
                                    <button
                                        onClick={() => { setAssetData(null); setSuccessMessage(null); }}
                                        className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition-all border border-white/5 uppercase text-xs tracking-widest"
                                    >
                                        Next Scan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6"
                    >
                        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-emerald-500 font-mono text-sm tracking-widest animate-pulse">CRYPTOGRAPHIC SEARCH IN PROGRESS...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QRReader;
