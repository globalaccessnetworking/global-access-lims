import React, { useState } from 'react';
import { Snowflake, Thermometer, CheckSquare, Save, AlertTriangle, Activity, Calendar } from 'lucide-react';
import api from '../api/axios';

const Maintenance = () => {
    const [log, setLog] = useState({
        freezerId: 'GS-13',
        temperature: -80,
        frostCheck: false,
        sealCheck: false,
        alarmTest: false,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Mock API call - In real app, POST /api/maintenance
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">

            {/* Header */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-cyan-900/30 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <Snowflake className="w-10 h-10 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Maintenance Portal</h1>
                            <p className="text-slate-400 mt-1 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Daily Freezer Checks & Calibration
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Status Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-slate-500 text-xs uppercase mb-2">Target Unit</h3>
                        <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            Freezer GS-13
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">Active</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Last Check</span>
                            <span className="font-mono font-bold text-slate-700">Today, 09:00 AM</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-600" /> Daily Log Entry
                        </h3>
                        <span className="text-xs font-mono text-slate-400">{new Date().toLocaleDateString()}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">

                        {/* Temperature Input */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Current Temperature (°C)</label>
                            <div className="relative max-w-xs">
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={log.temperature}
                                    onChange={e => setLog({ ...log, temperature: e.target.value })}
                                    className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-xl text-3xl font-mono font-bold focus:ring-2 focus:ring-cyan-500 outline-none ${Number(log.temperature) > -75 ? 'text-rose-500 border-rose-300' : 'text-slate-700 border-slate-200'}`}
                                />
                                <Thermometer className={`absolute left-4 top-5 w-6 h-6 ${Number(log.temperature) > -75 ? 'text-rose-500' : 'text-cyan-500'}`} />
                            </div>
                            {Number(log.temperature) > -75 && (
                                <p className="text-rose-500 text-xs font-bold mt-2 flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" /> CRITICAL: TEMP ABOVE THRESHOLD (-75°C)
                                </p>
                            )}
                        </div>

                        {/* Checkboxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: 'frostCheck', label: 'Frost Buildup Check' },
                                { id: 'sealCheck', label: 'Door Seal Integrity' },
                                { id: 'alarmTest', label: 'Alarm System Test' },
                                { id: 'battery', label: 'Backup Battery OK' } // Mock field for UI
                            ].map((item) => (
                                <label key={item.id} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${log[item.id] ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white border-slate-300'}`}>
                                        {log[item.id] && <CheckSquare className="w-4 h-4" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={!!log[item.id]}
                                        onChange={e => setLog({ ...log, [item.id]: e.target.checked })}
                                    />
                                    <span className="font-bold text-slate-600 text-sm">{item.label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Technician Notes</label>
                            <textarea
                                rows="3"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-cyan-500 outline-none transition-all"
                                placeholder="Any irregularities observed..."
                                value={log.notes}
                                onChange={e => setLog({ ...log, notes: e.target.value })}
                            ></textarea>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            {success ? (
                                <div className="text-emerald-600 font-bold flex items-center gap-2 animate-fade-in">
                                    <CheckSquare className="w-5 h-5" /> Log Saved Successfully
                                </div>
                            ) : <div></div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
                            >
                                {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Entry</>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
