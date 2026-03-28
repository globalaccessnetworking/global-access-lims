import React, { useState, useEffect } from 'react';
import { Plus, Play, Clock, Beaker, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../components/ToastProvider';
import ProtocolWorkflow from '../components/ProtocolWorkflow';
import api from '../api/axios';

const ProtocolLibrary = () => {
    const [protocols, setProtocols] = useState([]);
    const [activeExecutions, setActiveExecutions] = useState([]);
    const [selectedProtocol, setSelectedProtocol] = useState(null);
    const [executionId, setExecutionId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const toast = useToast();

    useEffect(() => {
        loadProtocols();
        loadActiveExecutions();
    }, []);

    const loadProtocols = async () => {
        try {
            const response = await api.get('/protocols');
            setProtocols(response.data.protocols || []);
        } catch (error) {
            toast.error('Failed to load protocols');
        }
    };

    const loadActiveExecutions = async () => {
        try {
            const response = await api.get('/protocols/executions/active');
            setActiveExecutions(response.data.executions || []);
        } catch (error) {
            console.error('Failed to load active executions:', error);
        }
    };

    const startProtocol = async (protocol) => {
        try {
            const response = await api.post(`/protocols/${protocol.id}/execute`, {});
            setExecutionId(response.data.execution.id);
            setSelectedProtocol(protocol);
            toast.success(`Started: ${protocol.name}`);
        } catch (error) {
            toast.error('Failed to start protocol');
        }
    };

    const resumeExecution = (execution) => {
        const protocol = protocols.find(p => p.id === execution.protocol_id);
        if (protocol) {
            setSelectedProtocol(protocol);
            setExecutionId(execution.id);
        }
    };

    const handleComplete = () => {
        setSelectedProtocol(null);
        setExecutionId(null);
        loadActiveExecutions();
        toast.success('🎉 Protocol completed successfully!');
    };

    const categories = ['all', ...new Set(protocols.map(p => p.category))];

    const filteredProtocols = protocols.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (selectedProtocol) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
                <button
                    onClick={() => setSelectedProtocol(null)}
                    className="mb-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                    ← Back to Library
                </button>
                <ProtocolWorkflow
                    protocol={selectedProtocol}
                    executionId={executionId}
                    onComplete={handleComplete}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Protocol Library</h1>
                    <p className="text-slate-400">Interactive step-by-step laboratory protocols</p>
                </div>

                {/* Active Executions */}
                {activeExecutions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Continue Where You Left Off</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeExecutions.map(execution => (
                                <motion.div
                                    key={execution.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-pointer"
                                    onClick={() => resumeExecution(execution)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-white">{execution.protocol_name}</h3>
                                        <span className="text-xs text-blue-400">In Progress</span>
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        Step {execution.current_step + 1} of {execution.steps.length}
                                    </div>
                                    <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${((execution.current_step + 1) / execution.steps.length) * 100}%` }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search protocols..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${filterCategory === cat
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Protocol Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProtocols.map(protocol => (
                        <motion.div
                            key={protocol.id}
                            whileHover={{ y: -4 }}
                            className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer"
                            onClick={() => startProtocol(protocol)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl">
                                    <Beaker className="text-emerald-400" size={24} />
                                </div>
                                <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs">
                                    {protocol.category}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{protocol.name}</h3>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{protocol.description}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Clock size={16} />
                                    <span>{protocol.estimated_time} min</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <span>{protocol.steps.length} steps</span>
                                </div>
                            </div>

                            <button className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors">
                                <Play size={16} />
                                Start Protocol
                            </button>
                        </motion.div>
                    ))}
                </div>

                {filteredProtocols.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-400">No protocols found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProtocolLibrary;
