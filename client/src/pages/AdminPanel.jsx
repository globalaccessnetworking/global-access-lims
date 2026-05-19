import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { generatePDF } from '../utils/reportGenerator';
import { Users, Trash2, ShieldAlert, Activity, FileText, UserPlus, CheckCircle, Lock, Database, RefreshCw, ArrowRight, Edit2, X, LayoutGrid, Palette, Save, Upload, Plus, ChevronDown, Filter, Zap, Settings2 } from 'lucide-react';
import FormBuilder from './Admin/FormBuilder';
import Permissions from './Admin/Permissions';
import { motion } from 'framer-motion';

const ADMIN_USER = { role: 'Admin', username: 'Administrator' };

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'Student',
        permissions: {
            library: 'none',
            storage: 'none',
            inventory: 'none',
            entry: 'none',
            qr_gen: 'none',
            qr_read: 'none',
            audit: 'none',
            admin: 'none'
        }
    });
    const [editingUser, setEditingUser] = useState(null);
    const [error, setError] = useState('');
    const [duplicates, setDuplicates] = useState([]);
    const [primerDuplicates, setPrimerDuplicates] = useState([]);
    const [branding, setBranding] = useState(() => {
        const saved = localStorage.getItem('lims_branding');
        return saved ? JSON.parse(saved) : {
            orgName: 'BACTERIOPHAGE LIMS',
            accentColor: '#10b981', // emerald-500
            logoType: 'icon', // 'icon' or 'image'
            logoUrl: ''
        };
    });

    // Scientific Reporting Engine State (Phase 172 Expansion)
    const [queryConfig, setQueryConfig] = useState({
        primaryTable: '',
        joins: [],
        filters: { logic: 'AND', conditions: [] }, // Supports nested logic
        format: 'CSV',
        limit: 1000
    });
    const [bindableTables, setBindableTables] = useState([]);
    const [tableColumns, setTableColumns] = useState({}); // Cache for columns per table
    const [executingReport, setExecutingReport] = useState(false);

    useEffect(() => {
        fetchData();
        if (activeTab === 'query') fetchQueryMetadata();
    }, [activeTab]);

    const fetchQueryMetadata = async () => {
        try {
            const res = await api.get('/forms/meta/tables');
            setBindableTables(res.data || []);
        } catch (e) { console.error("Metadata fetch failed", e); }
    };

    const fetchColumnsForTable = async (tableName) => {
        if (tableColumns[tableName]) return;
        try {
            const res = await api.get(`/forms/meta/columns/${tableName}`);
            setTableColumns(prev => ({ ...prev, [tableName]: res.data }));
        } catch (e) { console.error(`Columns failed for ${tableName}`, e); }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, logsRes, assetsRes] = await Promise.all([
                api.get('/auth/users'),
                api.get('/audit'),
                api.get('/assets') // Fetch assets for name lookup
            ]);

            // Create a Map for quick ID lookup
            const assetMap = new Map();
            if (assetsRes.data) {
                assetsRes.data.forEach(a => {
                    assetMap.set(a.id, a.name || `${a.species} ${a.strain_number}`);
                });
            }

            const activeLogs = logsRes.data.map(log => ({
                ...log,
                // Resolve Entity Name if possible
                resolvedName: assetMap.get(parseInt(log.entity_id)) || null
            }));

            setUsers(usersRes.data);
            setAuditLogs(activeLogs);

            if (activeTab === 'hygiene') {
                try {
                    const primersRes = await api.get('/assets/duplicates/primers');
                    setPrimerDuplicates(primersRes.data);
                } catch (e) { console.warn("Hygiene check failed", e); }
            }

        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            // Role matches exactly with backend Enum ('Admin', 'Manager', 'User')
            const rolePayload = newUser.role;
            await api.post('/auth/register', { ...newUser, role: rolePayload });
            setNewUser({
                username: '',
                email: '',
                password: '',
                role: 'Student',
                permissions: {
                    library: 'none',
                    storage: 'none',
                    inventory: 'none',
                    entry: 'none',
                    qr_gen: 'none',
                    qr_read: 'none',
                    audit: 'none',
                    admin: 'none'
                }
            });
            fetchData();
            alert("User created successfully");
        } catch (err) {
            console.error("Creation Error:", err);
            const errorMsg = err.response?.data?.errors
                ? err.response.data.errors.map(e => e.msg).join(', ')
                : err.response?.data?.msg || 'Failed to create user';
            setError(errorMsg);
        }
    };

    const handleUpdateUser = async (e) => {
        if (e) e.preventDefault();
        try {
            await api.put(`/auth/users/${editingUser.id}`, {
                role: editingUser.role,
                permissions: editingUser.permissions,
                security_question_1: editingUser.security_question_1 || null,
                security_answer_1:   editingUser.security_answer_1   || null,
                security_question_2: editingUser.security_question_2 || null,
                security_answer_2:   editingUser.security_answer_2   || null,
            });
            setEditingUser(null);
            fetchData();
            alert("User updated successfully");
        } catch (err) {
            console.error("Update Error:", err);
            alert(err.response?.data?.msg || "Failed to update user");
        }
    };

    const handleRunComplexQuery = async () => {
        try {
            setExecutingReport(true);
            const res = await api.post('/queries/run-adhoc', queryConfig);
            
            if (queryConfig.format === 'CSV') {
                // Convert JSON to CSV
                const items = res.data;
                if (!items || items.length === 0) {
                    alert("Query returned no results.");
                    return;
                }
                const replacer = (key, value) => value === null ? '' : value;
                const header = Object.keys(items[0]);
                const csv = [
                    header.join(','), // header row
                    ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
                ].join('\r\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `report_${queryConfig.primaryTable}_${Date.now()}.csv`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                // JSON Download
                const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', `report_${queryConfig.primaryTable}_${Date.now()}.json`);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Report Generation Failed:", err);
            alert("Report Failed: " + (err.response?.data?.error || err.message));
        } finally {
            setExecutingReport(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        try {
            await api.delete(`/auth/users/${id}`);
            fetchData();
        } catch (err) {
            alert("Failed to delete user");
        }
    };

    const handleTogglePermission = async (userId, module, currentAccess) => {
        const nextAccess = currentAccess === 'write' ? 'none' : currentAccess === 'read' ? 'write' : 'read';
        const user = users.find(u => u.id === userId);
        const newPermissions = { ...user.permissions, [module]: nextAccess };
        if (nextAccess === 'none') delete newPermissions[module];

        try {
            await api.put(`/auth/users/${userId}`, { permissions: newPermissions });
            fetchData();
        } catch (err) {
            alert("Failed to update permissions");
        }
    };

    const handleExportReorder = async () => {
        try {
            const res = await api.get('/inventory');
            const lowStock = res.data.filter(c => c.current_volume <= c.threshold_limit);

            if (lowStock.length === 0) {
                alert("No items below threshold!");
                return;
            }

            const columns = ["Barcode", "Chemical Name", "Current Vol", "Threshold", "Unit"];
            const data = lowStock.map(c => [
                c.barcode,
                c.name,
                c.current_volume,
                c.threshold_limit,
                c.unit
            ]);

            generatePDF("Inventory Reorder List", columns, data, "reorder_list.pdf");
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    const handleScanDuplicates = async () => {
        try {
            const res = await api.get('/assets');
            const assets = res.data;

            const map = new Map();
            assets.forEach(a => {
                const key = `${a.species}-${a.strain_number}`;
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(a);
            });

            const dups = [];
            map.forEach((group, key) => {
                if (group.length > 1) {
                    dups.push({ key, count: group.length, items: group });
                }
            });

            setDuplicates(dups);
            if (dups.length === 0) alert("No duplicates found!");
        } catch (err) {
            console.error("Scan failed", err);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 bg-slate-900 text-slate-200">
            <div className="flex justify-between items-center p-6 pb-0">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-rose-500" /> Admin Command Center
                    </h2>
                    <p className="text-slate-400">Manage users, security, and system logs.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleScanDuplicates}
                        className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                    >
                        <ShieldAlert className="w-4 h-4" /> Scan Duplicates
                    </button>
                    <button
                        onClick={() => window.location.href = '/inventory'}
                        className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
                    >
                        <LayoutGrid className="w-4 h-4" /> Inventory Hub
                    </button>
                </div>
            </div>

            <div className="flex gap-2 px-6 border-b border-slate-800">
                {[
                    { id: 'users', label: 'User Management', icon: Users },
                    { id: 'forms', label: 'Form Architect', icon: FileText },
                    { id: 'history', label: 'Audit History', icon: Activity },
                    { id: 'query', label: 'Query Builder', icon: Database },
                    { id: 'permissions', label: 'Permissions', icon: Lock },
                    { id: 'branding', label: 'Branding', icon: Palette },
                    { id: 'hygiene', label: 'Data Hygiene', icon: RefreshCw },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-400' : 'text-slate-500'}`} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className={`flex-1 overflow-hidden flex flex-col ${activeTab === 'forms' ? '' : 'p-6'}`}>

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                        <div className="lg:col-span-2 overflow-auto">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-400" /> Registered Users
                            </h3>
                            <div className="bg-slate-800/50 rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 border-b border-slate-700/50">User</th>
                                            <th className="px-6 py-4 border-b border-slate-700/50">Role</th>
                                            <th className="px-6 py-4 border-b border-slate-700/50">Last Login</th>
                                            <th className="px-6 py-4 border-b border-slate-700/50">Email</th>
                                            <th className="px-6 py-4 border-b border-slate-700/50 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    {u.username}
                                                </td>
                                                <td className="px-6 py-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{u.role}</span></td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500">
                                                    {u.last_login ? new Date(u.last_login).toLocaleString() : <span className="text-slate-400 italic">Never</span>}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-500">{u.email}</td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingUser({
                                                            ...u,
                                                            permissions: {
                                                                library: 'none', storage: 'none', inventory: 'none',
                                                                entry: 'none', qr_gen: 'none', qr_read: 'none',
                                                                audit: 'none', admin: 'none',
                                                                ...(u.permissions || {})
                                                            }
                                                        })}
                                                        className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteUser(u.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-xl h-fit shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                            {/* Midnight Glass Background Effect */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900/90 to-black/80 pointer-events-none"></div>

                            <div className="relative z-10">
                                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg tracking-wide">
                                    <UserPlus className="w-5 h-5 text-emerald-400" /> Add New User
                                </h3>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded mb-4 flex items-center gap-2 animate-pulse">
                                        <ShieldAlert className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <form onSubmit={handleAddUser} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-white uppercase mb-1 tracking-wider">Username</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white text-sm focus:ring-0 focus:border-emerald-500 focus:border-2 px-4 py-3 placeholder-slate-500 transition-all shadow-inner"
                                            placeholder="jdoe"
                                            value={newUser.username}
                                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white uppercase mb-1 tracking-wider">Email</label>
                                        <input
                                            type="email" required
                                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white text-sm focus:ring-0 focus:border-emerald-500 focus:border-2 px-4 py-3 placeholder-slate-500 transition-all shadow-inner"
                                            placeholder="email@example.com"
                                            value={newUser.email}
                                            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white uppercase mb-1 tracking-wider">Password</label>
                                        <input
                                            type="password" required minLength="6"
                                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white text-sm focus:ring-0 focus:border-emerald-500 focus:border-2 px-4 py-3 placeholder-slate-500 transition-all shadow-inner"
                                            placeholder="••••••••"
                                            value={newUser.password}
                                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white uppercase mb-1 tracking-wider">Role</label>
                                        <select
                                            className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white text-sm focus:ring-0 focus:border-emerald-500 focus:border-2 px-4 py-3 cursor-pointer transition-all shadow-inner"
                                            value={newUser.role}
                                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                        >
                                            <option value="Student">Student (Restricted)</option>
                                            <option value="Researcher">Researcher (Standard)</option>
                                            <option value="Admin">Admin (Full Access)</option>
                                        </select>
                                    </div>

                                    {/* Permission Matrix Grid */}
                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-emerald-400 uppercase mb-3 tracking-widest border-b border-emerald-500/20 pb-1">Module Permission Matrix</label>
                                        <div className="bg-black/20 rounded-xl border border-slate-800 overflow-hidden">
                                            <table className="w-full text-left text-[10px]">
                                                <thead className="bg-slate-900/50 text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-3 py-2">Module Name</th>
                                                        <th className="px-2 py-2 text-center">R</th>
                                                        <th className="px-2 py-2 text-center">W</th>
                                                        <th className="px-2 py-2 text-center">N</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {[
                                                        { key: 'library', label: 'Bio Library' },
                                                        { key: 'storage', label: 'Storage Hub' },
                                                        { key: 'entry', label: 'Data Entry' },
                                                        { key: 'qr_gen', label: 'QR Generator' },
                                                        { key: 'qr_read', label: 'QR Reader' },
                                                        { key: 'audit', label: 'Audit Trail' },
                                                        { key: 'admin', label: 'Admin Panel' }
                                                    ].map((mod) => (
                                                        <tr key={mod.key} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-3 py-2 text-slate-300 font-medium">{mod.label}</td>
                                                            {['read', 'write', 'none'].map((level) => (
                                                                <td key={level} className="px-2 py-2 text-center">
                                                                    <input
                                                                        type="radio"
                                                                        name={`perm-${mod.key}`}
                                                                        checked={newUser.permissions[mod.key] === level}
                                                                        onChange={() => setNewUser({
                                                                            ...newUser,
                                                                            permissions: { ...newUser.permissions, [mod.key]: level }
                                                                        })}
                                                                        className="w-3 h-3 accent-emerald-500 cursor-pointer bg-slate-800 border-slate-700"
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-2 italic px-1">* R=Read, W=Write, N=None (Hidden)</p>
                                    </div>
                                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 text-sm uppercase tracking-widest border border-emerald-400/20 shadow-lg mt-2">
                                        Create User
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Edit User Modal Overlay */}
                        {editingUser && (
                            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative ring-1 ring-white/10"
                                >
                                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50">
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            <Edit2 className="w-5 h-5 text-emerald-400" />
                                            Edit: <span className="text-emerald-400">{editingUser.username}</span>
                                        </h3>
                                        <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">User Role</label>
                                            <select
                                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white text-sm px-4 py-3 outline-none focus:border-emerald-500 transition-all"
                                                value={editingUser.role}
                                                onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                            >
                                                <option value="SuperAdmin">Super Admin (System Owner)</option>
                                                <option value="Admin">Admin (Full Access)</option>
                                                <option value="Researcher">Researcher (Standard)</option>
                                                <option value="Student">Student (Restricted)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-emerald-400 uppercase mb-3 tracking-widest border-b border-emerald-500/20 pb-1">Permission Matrix</label>
                                            <div className="bg-black/20 rounded-xl border border-slate-800 overflow-hidden">
                                                <table className="w-full text-left text-[10px]">
                                                    <thead className="bg-slate-900/50 text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-3 py-2">Module Name</th>
                                                            <th className="px-2 py-2 text-center">R</th>
                                                            <th className="px-2 py-2 text-center">W</th>
                                                            <th className="px-2 py-2 text-center">N</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/50">
                                                        {[
                                                            { key: 'library', label: 'Bio Library' },
                                                            { key: 'storage', label: 'Storage Hub' },
                                                            { key: 'entry', label: 'Data Entry' },
                                                            { key: 'qr_gen', label: 'QR Generator' },
                                                            { key: 'qr_read', label: 'QR Reader' },
                                                            { key: 'audit', label: 'Audit Trail' },
                                                            { key: 'admin', label: 'Admin Panel' }
                                                        ].map((mod) => (
                                                            <tr key={mod.key} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-3 py-2 text-slate-300 font-medium">{mod.label}</td>
                                                                {['read', 'write', 'none'].map((level) => (
                                                                    <td key={level} className="px-2 py-2 text-center">
                                                                        <input
                                                                            type="radio"
                                                                            name={`edit-perm-${mod.key}`}
                                                                            checked={editingUser.permissions[mod.key] === level}
                                                                            onChange={() => setEditingUser({
                                                                                ...editingUser,
                                                                                permissions: { ...editingUser.permissions, [mod.key]: level }
                                                                            })}
                                                                            className="w-3 h-3 accent-emerald-500 cursor-pointer"
                                                                        />
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* ─── SECURITY QUESTIONS SECTION ─── */}
                                        <div className="pt-4 border-t border-slate-800">
                                            <label className="block text-xs font-bold text-amber-400 uppercase mb-3 tracking-widest border-b border-amber-500/20 pb-1 flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                                                Password Recovery Setup
                                            </label>
                                            <p className="text-slate-500 text-[10px] mb-4 italic">Set 2 security questions so this user can reset their own password without admin help.</p>

                                            {[1, 2].map((n) => (
                                                <div key={n} className="mb-4">
                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Question {n}</label>
                                                    <select
                                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-amber-500 transition-all mb-2"
                                                        value={editingUser[`security_question_${n}`] || ''}
                                                        onChange={e => setEditingUser({ ...editingUser, [`security_question_${n}`]: e.target.value })}
                                                    >
                                                        <option value="">— Select a security question —</option>
                                                        <option value="What was the name of your first laboratory or department?">What was the name of your first laboratory or department?</option>
                                                        <option value="What are the last 4 digits of your official employee/student ID?">What are the last 4 digits of your official employee/student ID?</option>
                                                        <option value="In what city did you attend your primary university?">In what city did you attend your primary university?</option>
                                                        <option value="What is the last name of your first scientific supervisor or mentor?">What is the last name of your first scientific supervisor or mentor?</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder={`Answer ${n} (stored securely, not case-sensitive)`}
                                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-amber-500 placeholder-slate-600 transition-all"
                                                        value={editingUser[`security_answer_${n}`] || ''}
                                                        onChange={e => setEditingUser({ ...editingUser, [`security_answer_${n}`]: e.target.value })}
                                                    />
                                                </div>
                                            ))}

                                            {(editingUser.security_question_1 && editingUser.security_answer_1 && editingUser.security_question_2 && editingUser.security_answer_2) && (
                                                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                                                    <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                                    <p className="text-emerald-400 text-[10px] font-bold">Recovery enabled — this user can reset their password independently.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-slate-800">
                                            <button
                                                onClick={() => setEditingUser(null)}
                                                className="flex-1 px-4 py-3 bg-slate-800 text-slate-400 rounded-lg font-bold text-xs uppercase hover:bg-slate-700 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateUser}
                                                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}

                {/* FORM BUILDER TAB */}
                {activeTab === 'forms' && (
                    <div className="h-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                        <FormBuilder />
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex justify-between items-center relative overflow-hidden">
                            {/* Header Background Gradient */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>

                            <div>
                                <h3 className="font-bold text-white text-xl flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-400" /> Scientific Audit Trail
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">Immutable record of all system modifications.</p>
                            </div>
                            <button className="text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-all flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Export Audit Log
                            </button>
                        </div>

                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0B1120] text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Action</th>
                                        <th className="px-6 py-4">Entity Affected</th>
                                        <th className="px-6 py-4">Changes (Before &rarr; After)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-sm">
                                    {auditLogs.length > 0 ? auditLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                                                {new Date(log.timestamp || log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold border border-indigo-500/30">
                                                    {log.User ? log.User.username.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                {log.User ? log.User.username : 'System'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold border ${log.action?.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    log.action?.includes('UPDATE') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        log.action?.includes('DELETE') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 font-medium">
                                                {log.description || (log.resolvedName ? (
                                                    <span>
                                                        {log.resolvedName} <span className="text-slate-500 text-xs">({log.entity_type})</span>
                                                    </span>
                                                ) : (
                                                    <span>{log.entity_type || 'Entity'} <span className="text-slate-500 text-xs">#{log.entity_id || log.record_id || log.id}</span></span>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-mono text-slate-400 max-w-xs truncate group-hover:whitespace-normal group-hover:break-words transition-all">
                                                    {log.before_value || log.after_value ? (
                                                        <span>
                                                            {JSON.stringify(log.before_value || {})} &rarr; {JSON.stringify(log.after_value || {})}
                                                        </span>
                                                    ) : (
                                                        JSON.stringify(log.changes || log.details || {})
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">
                                                No audit records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'query' && (
                    <div className="space-y-6 animate-fade-in custom-scrollbar overflow-y-auto pr-2">
                        {/* HEADER */}
                        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-inner">
                                        <Database className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white text-2xl tracking-tight">Scientific Report Designer</h3>
                                        <p className="text-slate-400 text-sm mt-1">Hidelity relational extraction engine.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <select 
                                        className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-400 outline-none"
                                        value={queryConfig.format}
                                        onChange={(e) => setQueryConfig({...queryConfig, format: e.target.value})}
                                    >
                                        <option value="CSV">Format: CSV (Excel)</option>
                                        <option value="JSON">Format: Raw JSON</option>
                                    </select>
                                    <button 
                                        onClick={handleRunComplexQuery}
                                        disabled={!queryConfig.primaryTable || executingReport}
                                        className={`bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-3 ${executingReport ? 'opacity-50' : ''}`}
                                    >
                                        {executingReport ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        Run & Export
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* LEFT PANEL: PRIMARY & JOINS */}
                            <div className="space-y-6">
                                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/20 font-black text-[10px]">01</div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Table Selection</span>
                                        </div>
                                    </div>
                                    
                                    <select 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-emerald-500 transition-all shadow-inner font-bold"
                                        value={queryConfig.primaryTable}
                                        onChange={(e) => {
                                            setQueryConfig({...queryConfig, primaryTable: e.target.value});
                                            fetchColumnsForTable(e.target.value);
                                        }}
                                    >
                                        <option value="">Select Root Analytics Table...</option>
                                        {bindableTables.map(t => (
                                            <option key={t.id} value={t.id}>{t.label}</option>
                                        ))}
                                    </select>

                                    {/* JOINS SECTION */}
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <RefreshCw className="w-3 h-3 text-indigo-400" /> Multi-Join Architect
                                            </div>
                                            <button 
                                                onClick={() => setQueryConfig({...queryConfig, joins: [...queryConfig.joins, { table: '', on: '', ref: 'id' }]})}
                                                className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add Jointure
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {queryConfig.joins.map((join, idx) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                                    key={idx} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 relative group"
                                                >
                                                    <button onClick={() => setQueryConfig({...queryConfig, joins: queryConfig.joins.filter((_, i) => i !== idx)})} className="absolute top-4 right-4 text-slate-600 hover:text-rose-500 transition-colors">
                                                        <X size={14} />
                                                    </button>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[9px] text-slate-500 uppercase font-black mb-2 block">Target Table</label>
                                                            <select 
                                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
                                                                value={join.table}
                                                                onChange={(e) => {
                                                                    const updated = [...queryConfig.joins];
                                                                    updated[idx].table = e.target.value;
                                                                    setQueryConfig({...queryConfig, joins: updated});
                                                                    fetchColumnsForTable(e.target.value);
                                                                }}
                                                            >
                                                                <option value="">None</option>
                                                                {bindableTables.map(t => (
                                                                    <option key={t.id} value={t.id}>{t.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] text-slate-500 uppercase font-black mb-2 block">Link Column (From Root)</label>
                                                            <select 
                                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-indigo-500"
                                                                value={join.on}
                                                                onChange={(e) => {
                                                                    const updated = [...queryConfig.joins];
                                                                    updated[idx].on = e.target.value;
                                                                    setQueryConfig({...queryConfig, joins: updated});
                                                                }}
                                                            >
                                                                <option value="">Pick Key...</option>
                                                                {(tableColumns[queryConfig.primaryTable] || []).map(col => (
                                                                    <option key={col.id} value={col.id}>{col.label}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        {queryConfig.joins.length === 0 && (
                                            <div className="py-8 border border-dashed border-slate-800 rounded-2xl text-center text-[10px] text-slate-600 uppercase font-black tracking-widest">
                                                No joins configured (Flat Export)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: FILTERS & PREVIEW */}
                            <div className="space-y-6">
                                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-400 border border-rose-500/20 font-black text-[10px]">02</div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dynamic Filter Architect</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                                                <button 
                                                    onClick={() => setQueryConfig({...queryConfig, filters: {...queryConfig.filters, logic: 'AND'}})}
                                                    className={`px-3 py-1 text-[9px] font-black uppercase rounded ${queryConfig.filters.logic === 'AND' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-600'}`}
                                                >
                                                    AND
                                                </button>
                                                <button 
                                                    onClick={() => setQueryConfig({...queryConfig, filters: {...queryConfig.filters, logic: 'OR'}})}
                                                    className={`px-3 py-1 text-[9px] font-black uppercase rounded ${queryConfig.filters.logic === 'OR' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-600'}`}
                                                >
                                                    OR
                                                </button>
                                            </div>
                                            <button 
                                                onClick={() => setQueryConfig({...queryConfig, filters: {...queryConfig.filters, conditions: [...queryConfig.filters.conditions, { column: '', operator: '=', value: '' }]}})}
                                                className="text-[10px] font-black text-rose-400 hover:text-white transition-colors flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add Filter
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        {queryConfig.filters.conditions.map((cond, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <select 
                                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px] outline-none"
                                                    value={cond.column}
                                                    onChange={(e) => {
                                                        const updated = [...queryConfig.filters.conditions];
                                                        updated[idx].column = e.target.value;
                                                        setQueryConfig({...queryConfig, filters: {...queryConfig.filters, conditions: updated}});
                                                    }}
                                                >
                                                    <option value="">Column...</option>
                                                    {(tableColumns[queryConfig.primaryTable] || []).map(col => (
                                                        <option key={col.id} value={col.id}>{col.label}</option>
                                                    ))}
                                                </select>
                                                <select 
                                                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-white text-[10px] outline-none"
                                                    value={cond.operator}
                                                    onChange={(e) => {
                                                        const updated = [...queryConfig.filters.conditions];
                                                        updated[idx].operator = e.target.value;
                                                        setQueryConfig({...queryConfig, filters: {...queryConfig.filters, conditions: updated}});
                                                    }}
                                                >
                                                    <option value="=">=</option>
                                                    <option value="!=">!=</option>
                                                    <option value=">">&gt;</option>
                                                    <option value="<">&lt;</option>
                                                    <option value="LIKE">Contains</option>
                                                </select>
                                                <input 
                                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-[10px] outline-none placeholder:text-slate-700"
                                                    placeholder="Value..."
                                                    value={cond.value}
                                                    onChange={(e) => {
                                                        const updated = [...queryConfig.filters.conditions];
                                                        updated[idx].value = e.target.value;
                                                        setQueryConfig({...queryConfig, filters: {...queryConfig.filters, conditions: updated}});
                                                    }}
                                                />
                                                <button onClick={() => {
                                                    const updated = queryConfig.filters.conditions.filter((_, i) => i !== idx);
                                                    setQueryConfig({...queryConfig, filters: {...queryConfig.filters, conditions: updated}});
                                                }} className="text-slate-600 hover:text-rose-500 p-1">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {queryConfig.filters.conditions.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-32 border border-dashed border-slate-800 rounded-2xl text-slate-600">
                                                <Filter className="w-8 h-8 mb-2 opacity-20" />
                                                <p className="text-[10px] uppercase font-black tracking-widest">No Active Filters</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* SQL PREVIEW BLOCK */}
                                    <div className="mt-8">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Settings2 size={12} className="text-slate-500" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Compiler Preview (Live SQL)</span>
                                        </div>
                                        <div className="bg-black/40 p-5 rounded-2xl border border-slate-800 font-mono text-[10px] leading-relaxed text-indigo-400 break-all border-l-2 border-l-indigo-500">
                                            SELECT * FROM "{queryConfig.primaryTable || 'primary'}"
                                            {queryConfig.joins.map(j => `\nLEFT JOIN "${j.table || 'secondary'}" ON "${queryConfig.primaryTable}"."${j.on || 'fk'}" = "${j.table}"."id"`)}
                                            {queryConfig.filters.conditions.length > 0 && `\nWHERE ${queryConfig.filters.conditions.map((c, i) => `"${c.column || 'col'}" ${c.operator} '${c.value}'`).join(` ${queryConfig.filters.logic} `)}`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'hygiene' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl flex items-start gap-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Advanced Data Hygiene</h3>
                                <p className="text-slate-400 text-sm mb-4">Identify inconsistencies and duplicate entries across the system.</p>
                                <button onClick={handleScanDuplicates} className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-amber-900/20">
                                    Scan Database Records
                                </button>
                            </div>
                        </div>

                        {duplicates.length > 0 && (
                            <div className="space-y-4">
                                {duplicates.map((group, idx) => (
                                    <div key={idx} className="border border-rose-500/30 rounded-xl overflow-hidden shadow-xl">
                                        <div className="bg-rose-500/10 p-4 font-bold text-rose-400 flex justify-between items-center border-b border-rose-500/20">
                                            <span>Match Key: {group.key}</span>
                                            <span className="bg-rose-500/20 px-3 rounded-full text-xs py-1 border border-rose-500/30">Count: {group.count}</span>
                                        </div>
                                        <table className="min-w-full divide-y divide-slate-800">
                                            <thead className="bg-slate-900/50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Location</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-slate-800/30 divide-y divide-slate-800">
                                                {group.items.map(item => (
                                                    <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">#{item.id}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-white">{item.species}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-400 italic">{item.StorageLocation?.freezer_name || '--'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )}
                        {duplicates.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800 text-slate-500">
                                <CheckCircle className="w-16 h-16 mb-4 text-emerald-500/30" />
                                <p className="text-lg font-medium">No duplicate Strains/Assets found based on ID.</p>
                                <button onClick={handleScanDuplicates} className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors mt-2">Run ID Scan</button>
                            </div>
                        )}

                        <div className="mt-8 pt-8 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-amber-500" /> Duplicate Primers Report
                                    </h3>
                                    <p className="text-sm text-slate-400">Based on SQL Logic: Groups by Name/Species</p>
                                </div>
                                <span className="bg-amber-500/20 text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold border border-amber-500/30">
                                    {primerDuplicates.length} Conflicts Detected
                                </span>
                            </div>

                            {primerDuplicates.length > 0 ? (
                                <div className="bg-slate-800/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex justify-between items-center">
                                        <span className="font-bold text-[10px] uppercase text-slate-500 tracking-widest">University of the Punjab - LIMS Report</span>
                                        <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <table className="min-w-full divide-y divide-slate-800">
                                        <thead className="bg-slate-900/30">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Primer ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Sequence Data</th>
                                                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Conflict Count</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {primerDuplicates.map((p, idx) => (
                                                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-4 py-4 text-sm font-bold text-white">{p.species}</td>
                                                    <td className="px-4 py-4 text-xs font-mono text-slate-500 truncate max-w-[200px]">{p.sequence_data || 'No Sequence'}</td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded text-xs font-bold border border-rose-500/20 font-mono">
                                                            {p.duplicate_count}x
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-12 bg-slate-800/30 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500">
                                    No duplicate primers detected.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'permissions' && (
                    <div className="flex-1 w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
                        <Permissions currentUser={ADMIN_USER} />
                    </div>
                )}

                {activeTab === 'branding' && (
                    <div className="max-w-2xl animate-fade-in">
                        <div className="bg-slate-800/50 rounded-2xl border border-slate-800 p-8 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Palette className="w-6 h-6 text-emerald-400" /> System Personalization
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-2xl">
                                        {branding.logoType === 'image' && branding.logoUrl ? (
                                            <img src={branding.logoUrl} alt="Preview" className="w-full h-full object-contain rounded-2xl" />
                                        ) : (
                                            <Palette className="w-10 h-10 opacity-50" />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">Live Preview</h4>
                                        <p className="text-xs text-slate-500">This is how your logo will appear in the sidebar.</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Organization Name</label>
                                    <input
                                        type="text"
                                        value={branding.orgName}
                                        onChange={(e) => setBranding({ ...branding, orgName: e.target.value.toUpperCase() })}
                                        className="w-full px-5 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-all font-bold tracking-tight"
                                        placeholder="e.g. BACTERIOPHAGE LIMS"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Accent Color</label>
                                        <div className="flex gap-3 items-center bg-slate-900 p-2 rounded-xl border border-slate-700">
                                            <input
                                                type="color"
                                                value={branding.accentColor}
                                                onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                                                className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                                            />
                                            <span className="text-sm font-mono text-slate-300 uppercase">{branding.accentColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Logo Display</label>
                                        <select
                                            value={branding.logoType}
                                            onChange={(e) => setBranding({ ...branding, logoType: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none"
                                        >
                                            <option value="icon">Standard Stylized Icon</option>
                                            <option value="image">Custom Uploaded Logo</option>
                                        </select>
                                    </div>
                                </div>

                                {branding.logoType === 'image' && (
                                    <div className="p-6 border-2 border-dashed border-slate-700 rounded-2xl text-center">
                                        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                                        <p className="text-sm text-slate-400 mb-4">Click to upload or drag logo file here</p>
                                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors">
                                            Select File (PNG/SVG)
                                        </button>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-slate-700 mt-8">
                                    <button
                                        onClick={() => {
                                            localStorage.setItem('lims_branding', JSON.stringify(branding));
                                            alert("Branding updated successfully! Refreshing UI...");
                                            window.location.reload();
                                        }}
                                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <Save className="w-5 h-5" />
                                        Apply System Branding
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminPanel;
