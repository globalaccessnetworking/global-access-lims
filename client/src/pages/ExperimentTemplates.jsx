import React, { useState, useEffect } from 'react';
import { FileText, Plus, X, Copy, Trash2 } from 'lucide-react';
import api from '../api/axios';

const ExperimentTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        protocol: 'Enrichment',
        description: '',
        is_public: false,
        checklist: ['']
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/templates');
            setTemplates(res.data.templates || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/templates', {
                ...formData,
                checklist: formData.checklist.filter(item => item.trim() !== '')
            });
            setShowForm(false);
            setFormData({ name: '', protocol: 'Enrichment', description: '', is_public: false, checklist: [''] });
            fetchTemplates();
        } catch (error) {
            alert('Failed to create template');
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!confirm('Delete this template?')) return;
        try {
            await api.delete(`/templates/${id}`);
            fetchTemplates();
        } catch (error) {
            alert('Failed to delete template');
        }
    };

    const handleUseTemplate = async (template) => {
        // Navigate to experiment creation with template data
        alert(`Template "${template.name}" ready to use! This would pre-fill the experiment form.`);
    };

    const addChecklistItem = () => {
        setFormData({ ...formData, checklist: [...formData.checklist, ''] });
    };

    const updateChecklistItem = (index, value) => {
        const newChecklist = [...formData.checklist];
        newChecklist[index] = value;
        setFormData({ ...formData, checklist: newChecklist });
    };

    const removeChecklistItem = (index) => {
        setFormData({ ...formData, checklist: formData.checklist.filter((_, i) => i !== index) });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Experiment Templates</h1>
                    <p className="text-slate-500 mt-1">Reusable workflows for consistent experiments</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> New Template
                </button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="bg-indigo-100 p-2 rounded-xl">
                                <FileText className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleUseTemplate(template)}
                                    className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg"
                                    title="Use Template"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">{template.name}</h3>
                        <p className="text-xs text-slate-500 mb-2">{template.protocol}</p>
                        <p className="text-sm text-slate-600 mb-3">{template.description}</p>
                        {template.checklist && template.checklist.length > 0 && (
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Checklist</p>
                                <ul className="space-y-1">
                                    {template.checklist.slice(0, 3).map((item, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                            {item}
                                        </li>
                                    ))}
                                    {template.checklist.length > 3 && (
                                        <li className="text-xs text-slate-400">+{template.checklist.length - 3} more</li>
                                    )}
                                </ul>
                            </div>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${template.is_public
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                {template.is_public ? 'Public' : 'Private'}
                            </span>
                            <span className="text-xs text-slate-400">by {template.created_by_name}</span>
                        </div>
                    </div>
                ))}
            </div>

            {templates.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-slate-500 font-bold">No templates yet</h3>
                    <p className="text-slate-400 text-sm">Create your first reusable experiment template</p>
                </div>
            )}

            {/* Template Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">New Template</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTemplate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border-slate-200"
                                    placeholder="e.g., Standard Enrichment Protocol"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Protocol Type</label>
                                <select
                                    value={formData.protocol}
                                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                    className="w-full rounded-lg border-slate-200"
                                >
                                    <option>Enrichment</option>
                                    <option>DLA</option>
                                    <option>Spot Test</option>
                                    <option>One-Step Growth</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-lg border-slate-200 h-24"
                                    placeholder="Describe when to use this template..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Checklist Items</label>
                                <div className="space-y-2">
                                    {formData.checklist.map((item, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => updateChecklistItem(index, e.target.value)}
                                                className="flex-1 rounded-lg border-slate-200 text-sm"
                                                placeholder="Checklist step..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeChecklistItem(index)}
                                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addChecklistItem}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-bold"
                                    >
                                        + Add Step
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    checked={formData.is_public}
                                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                    className="rounded border-slate-300"
                                />
                                <label htmlFor="is_public" className="text-sm text-slate-600">
                                    Make this template public (visible to all team members)
                                </label>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 text-slate-500 font-bold hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                                >
                                    Create Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExperimentTemplates;
