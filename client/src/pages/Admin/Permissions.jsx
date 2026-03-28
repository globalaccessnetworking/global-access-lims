import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Lock, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

const Permissions = ({ currentUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Load
    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                // Ensure only Admin can view (Frontend Check)
                // Backend should also protect the route
                if (currentUser?.role !== 'Admin') {
                    setError("Access Denied: Admin Privileges Required");
                    setLoading(false);
                    return;
                }

                // Bearer Token is handled by api interceptor
                const res = await api.get('/auth/users');
                setUsers(res.data);
            } catch (err) {
                console.error("Permissions Fetch Failed", err);
                setError("Failed to load user permissions. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchPermissions();
        }
    }, [currentUser]);

    const handleTogglePermission = async (userId, module, currentAccess) => {
        // Optimistic UI Update
        const nextAccess = currentAccess === 'write' ? 'none' : currentAccess === 'read' ? 'write' : 'read';

        setUsers(prev => prev.map(u =>
            u.id === userId
                ? { ...u, permissions: { ...u.permissions, [module]: nextAccess } }
                : u
        ));

        // Sync with Backend
        try {
            const user = users.find(u => u.id === userId);
            const newPermissions = { ...user.permissions, [module]: nextAccess };
            if (nextAccess === 'none') delete newPermissions[module];

            await api.put(`/auth/users/${userId}`, { permissions: newPermissions });
        } catch (err) {
            console.error("Permission Update Failed", err);
            // Revert on failure (could add toast here)
            alert("Failed to update permission");
            // Reload to sync
            const res = await api.get('/auth/users');
            setUsers(res.data);
        }
    };

    // Render Logic
    if (loading) {
        return (
            <div className="space-y-4 p-6 bg-slate-900 rounded-xl border border-slate-800 animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-1/3 mb-6"></div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-slate-800/50 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6" />
                <span className="font-bold">{error}</span>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#0F172A] p-6 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Lock className="w-6 h-6 text-emerald-400" /> Access Control Matrix
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Manage Role-Based Access Control (RBAC) for system modules.</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Level 5 Security Active
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0B1120] text-white text-[10px] uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-4">User Identity</th>
                            <th className="px-6 py-4 text-center">Biological Library</th>
                            <th className="px-6 py-4 text-center">Inventory Hub</th>
                            <th className="px-6 py-4 text-center">Form Architect</th>
                            <th className="px-6 py-4 text-center">Audit Logs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm bg-slate-900">
                        {users && users.length > 0 ? (
                            users.map((user) => {
                                const isAdmin = user.role === 'Admin';
                                return (
                                    <tr key={user.id} className={`transition-colors ${isAdmin ? 'bg-slate-900/50 opacity-70' : 'hover:bg-slate-800'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isAdmin ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{user.username}</p>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isAdmin ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-700 text-slate-400'}`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* MODULE TOGGLES */}
                                        {['library', 'inventory', 'architect', 'audit'].map(module => {
                                            // Mapping 'architect' to 'entry' or creating new perm key if needed. 
                                            // Assuming 'entry' was the previous name for Data Entry/Architect access or strict mapping.
                                            // Based on previous code: 'library', 'inventory', 'storage', 'entry'.
                                            // User requested: Library, Architect, Audit.
                                            // I will map: Library->library, Inventory->inventory, Architect->entry (or specific key), Audit->audit (new key?)
                                            // Let's stick to existing keys for safety, but maybe 'architect' needs a new key or maps to 'entry'.
                                            // User request: "Module Access (Library, Architect, Audit)"

                                            // Let's use specific keys requested by user and map them to backend keys if needed.
                                            // Backend keys from previous AdminPanel: library, inventory, storage, entry.
                                            // Missing 'audit'. I will assume 'audit' is a new key or handled by role. 
                                            // For now, I will use: library, inventory, entry (as Architect), and audit (new).

                                            const dbKey = module === 'architect' ? 'entry' : module;
                                            const access = user.permissions?.[dbKey] || 'none';

                                            return (
                                                <td key={module} className="px-6 py-4 text-center">
                                                    {isAdmin ? (
                                                        <span className="text-slate-500 text-[10px] italic">Global Access</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleTogglePermission(user.id, dbKey, access)}
                                                            className={`
                                                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 border border-transparent
                                                                ${access !== 'none' ? 'bg-emerald-500' : 'bg-slate-700'}
                                                            `}
                                                        >
                                                            <span
                                                                className={`
                                                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md
                                                                    ${access !== 'none' ? 'translate-x-6' : 'translate-x-1'}
                                                                `}
                                                            />
                                                        </button>
                                                    )}
                                                    {!isAdmin && (
                                                        <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            {access === 'write' ? 'Write' : access === 'read' ? 'Read' : 'Off'}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Permissions;
