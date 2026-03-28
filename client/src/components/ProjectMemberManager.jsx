import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Shield, Eye, Edit, Crown } from 'lucide-react';
import api from '../api/axios';

const ProjectMemberManager = ({ projectId, onClose }) => {
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');

    useEffect(() => {
        if (projectId) {
            fetchMembers();
            fetchAllUsers();
        }
    }, [projectId]);

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/projects/${projectId}/members`);
            setMembers(response.data.members || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setAllUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUser) return;

        try {
            await api.post(`/projects/${projectId}/members`, {
                userId: parseInt(selectedUser),
                role: selectedRole
            });
            setShowAddForm(false);
            setSelectedUser('');
            setSelectedRole('member');
            fetchMembers();
        } catch (error) {
            alert('Failed to add member: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            await api.delete(`/projects/${projectId}/members/${userId}`);
            fetchMembers();
        } catch (error) {
            alert('Failed to remove member: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await api.put(`/projects/${projectId}/members/${userId}/role`, { role: newRole });
            fetchMembers();
        } catch (error) {
            alert('Failed to update role: ' + (error.response?.data?.error || error.message));
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return <Crown className="w-4 h-4 text-amber-500" />;
            case 'member': return <Edit className="w-4 h-4 text-blue-500" />;
            case 'viewer': return <Eye className="w-4 h-4 text-slate-400" />;
            default: return <Shield className="w-4 h-4 text-slate-400" />;
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'owner': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'member': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'viewer': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    // Filter out users who are already members
    const availableUsers = allUsers.filter(
        user => !members.some(member => member.user_id === user.id)
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-xl">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Project Members</h2>
                            <p className="text-sm text-slate-500">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Add Member Button */}
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border-2 border-dashed border-indigo-200"
                        >
                            <Plus className="w-5 h-5" />
                            Add Member
                        </button>
                    )}

                    {/* Add Member Form */}
                    {showAddForm && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <h3 className="font-bold text-slate-700 text-sm">Add New Member</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <select
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    <option value="">Select User...</option>
                                    {availableUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.username} ({user.email})
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="member">Member</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddMember}
                                    disabled={!selectedUser}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setSelectedUser('');
                                    }}
                                    className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Members List */}
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Loading members...</div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>No members yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-slate-600">
                                                {member.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{member.username}</p>
                                            <p className="text-xs text-slate-400">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeClass(member.role)}`}
                                        >
                                            <option value="viewer">Viewer</option>
                                            <option value="member">Member</option>
                                            <option value="owner">Owner</option>
                                        </select>
                                        <button
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Role Legend */}
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Role Permissions</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500" />
                            <span className="text-slate-600"><strong>Owner:</strong> Full control</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Edit className="w-3 h-3 text-blue-500" />
                            <span className="text-slate-600"><strong>Member:</strong> Edit access</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600"><strong>Viewer:</strong> Read only</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectMemberManager;
