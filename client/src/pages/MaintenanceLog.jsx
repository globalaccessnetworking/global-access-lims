import React, { useState } from 'react';
import { Thermometer, Save, CheckCircle, Clock } from 'lucide-react';

const MaintenanceLog = () => {
    const [logs, setLogs] = useState([
        { id: 1, date: '2023-10-26', freezer: 'Deep Freezer A', temp: '-80°C', checkedBy: 'Admin' },
        { id: 2, date: '2023-10-25', freezer: 'Deep Freezer A', temp: '-79°C', checkedBy: 'Manager' }
    ]);
    const [form, setForm] = useState({ freezer: 'Deep Freezer A', temp: '' });

    const handleLog = (e) => {
        e.preventDefault();
        const newLog = {
            id: logs.length + 1,
            date: new Date().toISOString().split('T')[0],
            freezer: form.freezer,
            temp: form.temp + '°C',
            checkedBy: 'Current User'
        };
        setLogs([newLog, ...logs]);
        setForm({ ...form, temp: '' });
        alert("Temperature Checked Logged!");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Maintenance Log</h1>
                    <p className="text-slate-500 mt-1">Daily equipment checks and calibration records (GS-13 Compliance).</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Thermometer className="w-6 h-6 text-blue-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Entry Form */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-500" /> New Entry
                    </h3>
                    <form onSubmit={handleLog} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Equipment Name</label>
                            <select
                                className="w-full rounded-lg border-slate-200 text-sm font-medium"
                                value={form.freezer}
                                onChange={e => setForm({ ...form, freezer: e.target.value })}
                            >
                                <option>Deep Freezer A (-80°C)</option>
                                <option>Deep Freezer B (-20°C)</option>
                                <option>Incubator 1 (37°C)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Temperature Reading</label>
                            <div className="relative">
                                <input
                                    type="text" required
                                    className="w-full rounded-lg border-slate-200 text-sm pl-4 pr-8"
                                    placeholder="-80"
                                    value={form.temp}
                                    onChange={e => setForm({ ...form, temp: e.target.value })}
                                />
                                <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">°C</span>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Record Check
                        </button>
                    </form>
                </div>

                {/* Log History */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Equipment</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Reading</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Checked By</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{log.date}</td>
                                    <td className="px-6 py-4 text-sm text-slate-800 font-bold">{log.freezer}</td>
                                    <td className="px-6 py-4 text-sm text-blue-600 font-bold">{log.temp}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{log.checkedBy}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                                            <CheckCircle className="w-3 h-3" /> OK
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceLog;
