import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { generatePDF } from '../utils/reportGenerator';
import { Users, Trash2, ShieldAlert, Activity, FileText, UserPlus, CheckCircle, Lock, Database, RefreshCw, ArrowRight, Edit2, X, LayoutGrid, Palette, Save, Upload } from 'lucide-react';
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

    useEffect(() => {
        fetchData();
    }, [activeTab]);

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
                permissions: editingUser.permissions
            });
            setEditingUser(null);
            fetchData();
            alert("User updated successfully");
        } catch (err) {
            console.error("Update Error:", err);
            alert(err.response?.data?.msg || "Failed to update user");
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
                    <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-800 shadow-2xl animate-fade-in">
                        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
                            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                                <Database className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Custom Report Builder</h3>
                                <p className="text-slate-400 text-sm">Generate joined datasets from LIMS tables.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Primary Table</label>
                                <select className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors">
                                    <option>BiologicalAssets</option>
                                    <option>Inventory</option>
                                    <option>Experiments</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Include Relations</label>
                                <select className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors">
                                    <option>None</option>
                                    <option>+ StorageLocations</option>
                                    <option>+ PhageHostInteractions</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Format</label>
                                <select className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 transition-colors">
                                    <option>CSV</option>
                                    <option>JSON</option>
                                    <option>PDF Report</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 mb-6 overflow-x-auto">
                            SELECT * FROM BiologicalAssets LEFT JOIN StorageLocations ON ...
                        </div>

                        <div className="flex justify-end">
                            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Run Query & Download
                            </button>
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
