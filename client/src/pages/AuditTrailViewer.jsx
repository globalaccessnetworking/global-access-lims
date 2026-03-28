import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter } from 'lucide-react';
import api from '../api/axios';

const AuditTrailViewer = () => {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({
        table_name: '',
        action: '',
        user_id: ''
    });
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchLogs();
        fetchUsers();
    }, []);

    const fetchLogs = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.table_name) params.append('table_name', filters.table_name);
            if (filters.action) params.append('action', filters.action);
            if (filters.user_id) params.append('user_id', filters.user_id);
            params.append('limit', '50');

            const res = await api.get(`/audit?${params.toString()}`);
            setLogs(res.data.logs || []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'INSERT': return 'bg-emerald-100 text-emerald-700';
            case 'UPDATE': return 'bg-blue-100 text-blue-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Audit Trail</h1>
                <p className="text-slate-500 mt-1">Comprehensive activity log for regulatory compliance</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-800">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Table</label>
                        <select
                            value={filters.table_name}
                            onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
                            className="w-full rounded-lg border-slate-200 text-sm"
                        >
                            <option value="">All Tables</option>
                            <option value="Experiments">Experiments</option>
                            <option value="Users">Users</option>
                            <option value="ext_lab_projects">Projects</option>
                            <option value="ext_bacterial_strains">Bacterial Strains</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Action</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className="w-full rounded-lg border-slate-200 text-sm"
                        >
                            <option value="">All Actions</option>
                            <option value="INSERT">Insert</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">User</label>
                        <select
                            value={filters.user_id}
                            onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
                            className="w-full rounded-lg border-slate-200 text-sm"
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={fetchLogs}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2"
                        >
                            <Search className="w-4 h-4" /> Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Table</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Record ID</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                        {log.username || 'System'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{log.table_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{log.record_id || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-400">{log.ip_address || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {logs.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        <Shield className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No audit logs found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditTrailViewer;
