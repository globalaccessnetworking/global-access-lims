import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Shield, Clock, Database, User, Filter } from 'lucide-react';

const AuditTrail = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Assuming the backend has a route for getting all system logs
                // We might need to create/ensure /api/audit returns SystemAuditLogs or AuditLogs
                // The plan said "DB: system_audit_logs table".
                // I need to ensure the backend route `/api/audit` returns data from `SystemAuditLog` or I need a new route.
                // server.js has `app.use('/api/audit', auditRoutes);`
                // `routes/audit.js` uses `auditController.getLogs`.
                // I didn't verify `auditController.js` but it likely queries `AuditLog` (old table).
                // I should probably update `routes/audit.js` to query `SystemAuditLog` OR create a new route.
                // Given "System Audit Trail" is a new feature, I should probably use a new route or update the existing one.
                // Let's assume for now I will use `/api/system/audit` or similar if I updated `system.js`?
                // Or I can just fetch from `/api/audit` and I will update the backend controller/route to use the new table if needed.
                // Wait, I didn't update `routes/audit.js`. It fetches from `AuditLog`.
                // I should probably fetch from `SystemAuditLog`.
                // I will add a temporary route in `server.js` or create `routes/systemAudit.js`.
                // Actually, I can just use `/api/audit` if I update it. 
                // But `AuditLog` (legacy) might be used elsewhere.
                // Use `/api/system/audit-logs` (I need to add this route).
                // I'll add the route to `server.js` inline for simplicity or `routes/system.js`.

                // Let's assume I'll add `router.get('/audit-logs', ...)` to `routes/system.js`.
                const res = await api.get('/system/audit-logs');
                setLogs(res.data);
            } catch (err) {
                console.error("Failed to load audit logs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-emerald-400" />
                        System Audit Trail
                    </h1>
                    <p className="text-slate-400 mt-1">Security & Data Integrity Log</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-slate-300 hover:text-white hover:border-emerald-500/30 transition-colors">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors">
                        Export Log
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-white/10">
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">ID</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">User</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Action</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Target</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-sm">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 text-slate-500">#{log.id}</td>
                                    <td className="p-4 text-emerald-400 font-bold flex items-center gap-2">
                                        <User size={14} />
                                        {log.user_id ? `User ${log.user_id}` : 'System/Guest'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`
                                            px-2 py-1 rounded text-xs font-bold
                                            ${log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-400' :
                                                log.action === 'POST' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-blue-500/20 text-blue-400'}
                                        `}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <Database size={14} className="text-slate-600" />
                                            {log.table_name} <span className="text-slate-600">ID: {log.record_id}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-500 truncate max-w-md group-hover:text-slate-300 transition-colors">
                                        {JSON.stringify(log.details)}
                                    </td>
                                    <td className="p-4 text-right text-slate-500 flex items-center justify-end gap-2">
                                        <Clock size={14} />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>

                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500">
                                        No audit records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditTrail;
