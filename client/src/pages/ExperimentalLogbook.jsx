import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BookOpen, Plus, Calendar, FlaskConical, User, MessageSquare, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AttachmentGallery from '../components/AttachmentGallery';

const ExperimentalLogbook = ({ initialShowForm = false }) => {
    const [experiments, setExperiments] = useState([]);
    const [showForm, setShowForm] = useState(initialShowForm);
    const [assets, setAssets] = useState([]);
    const { user } = useAuth();

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        protocol: 'Enrichment',
        asset_id: '',
        notes: ''
    });

    useEffect(() => {
        fetchExperiments();
        fetchAssets();
    }, []);

    const fetchExperiments = async () => {
        try {
            const res = await api.get('/experiments');
            setExperiments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAssets = async () => {
        try {
            const res = await api.get('/assets');
            setAssets(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/experiments', formData);
            setShowForm(false);
            fetchExperiments();
            setFormData({ ...formData, title: '', notes: '' });
        } catch (err) {
            alert('Failed to log experiment');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Experimental Logbook</h1>
                    <p className="text-slate-500 mt-1">Electronic Lab Notebook (ELN) for tracking research protocols.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" /> New Entry
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-8 animate-fade-in-up">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">New Experiment Entry</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Experiment Title</label>
                                <input
                                    type="text" required
                                    className="w-full rounded-lg border-slate-200"
                                    placeholder="e.g. Phage T4 Enrichment V2"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Protocol Type</label>
                                <select
                                    className="w-full rounded-lg border-slate-200"
                                    value={formData.protocol}
                                    onChange={e => setFormData({ ...formData, protocol: e.target.value })}
                                >
                                    <option>Enrichment</option>
                                    <option>DLA</option>
                                    <option>Spot Test</option>
                                    <option>One-Step Growth</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Linked Asset (Optional)</label>
                                <select
                                    className="w-full rounded-lg border-slate-200"
                                    value={formData.asset_id}
                                    onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                                >
                                    <option value="">-- Select Asset --</option>
                                    {assets.map(a => (
                                        <option key={a.id} value={a.id}>{a.strain_number} - {a.type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                <input
                                    type="date" required
                                    className="w-full rounded-lg border-slate-200"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes & Observations</label>
                            <textarea
                                className="w-full rounded-lg border-slate-200 h-32"
                                placeholder="Record OD values, incubation times, and results..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            ></textarea>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors">Save Entry</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6">
                {experiments.map(exp => (
                    <div key={exp.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group lg:grid lg:grid-cols-3 lg:gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                    ${exp.protocol === 'Enrichment' ? 'bg-blue-100 text-blue-700' :
                                        exp.protocol === 'DLA' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}
                                `}>
                                    {exp.protocol}
                                </span>
                                <span className="text-slate-400 text-xs flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {exp.date}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{exp.title}</h3>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{exp.notes}</p>

                            {/* Photo Attachments */}
                            <div className="pt-4">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Photo Attachments</h4>
                                <AttachmentGallery entityType="experiment" entityId={exp.id} />
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                                <div className="flex items-center gap-4">
                                    {exp.BiologicalAsset && (
                                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                            <FlaskConical className="w-3 h-3" /> {exp.BiologicalAsset.strain_number}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                                        <User className="w-3 h-3" /> {exp.User?.username || 'Unknown'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Comment Thread */}
                        <div className="mt-6 lg:mt-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 flex flex-col h-full">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <MessageSquare size={14} /> Collaborative Discussion
                            </h4>

                            <div className="flex-1 space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                {exp.ExperimentComments?.map(comment => (
                                    <div key={comment.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-900">{comment.User?.username}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-slate-600">{comment.content}</p>
                                    </div>
                                ))}
                                {(!exp.ExperimentComments || exp.ExperimentComments.length === 0) && (
                                    <p className="text-[10px] text-slate-400 italic text-center py-4">No comments yet. Start a discussion.</p>
                                )}
                            </div>

                            <form className="mt-4 flex gap-2" onSubmit={async (e) => {
                                e.preventDefault();
                                const content = e.target.comment.value;
                                if (!content) return;
                                try {
                                    await api.post('/experiments/comments', { experiment_id: exp.id, content });
                                    e.target.reset();
                                    fetchExperiments();
                                } catch (err) { alert("Failed to post comment"); }
                            }}>
                                <input name="comment" required placeholder="Add a comment..." className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                                <button type="submit" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all"><Plus size={16} /></button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
            {experiments.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-500 font-bold">No experiments logged yet</h3>
                    <p className="text-slate-400 text-sm">Start a new entry to track your research.</p>
                </div>
            )}
        </div>
    );
};

export default ExperimentalLogbook;
