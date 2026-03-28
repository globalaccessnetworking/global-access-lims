import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle2, XCircle, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import api from '../api/axios';

const SuccessRateAnalytics = () => {
    const [experiments, setExperiments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        success: 0,
        failed: 0,
        partial: 0,
        pending: 0,
        successRate: 0
    });

    useEffect(() => {
        fetchExperiments();
    }, []);

    const fetchExperiments = async () => {
        try {
            const res = await api.get('/experiments');
            const exps = res.data || [];
            setExperiments(exps);

            const total = exps.length;
            const success = exps.filter(e => e.outcome === 'success').length;
            const failed = exps.filter(e => e.outcome === 'failed').length;
            const partial = exps.filter(e => e.outcome === 'partial').length;
            const pending = exps.filter(e => !e.outcome || e.outcome === 'pending').length;
            const completed = total - pending;
            const successRate = completed > 0 ? ((success / completed) * 100).toFixed(1) : 0;

            setStats({ total, success, failed, partial, pending, successRate });
        } catch (error) {
            console.error('Failed to fetch experiments:', error);
        }
    };

    const getOutcomeIcon = (outcome) => {
        switch (outcome) {
            case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'partial': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            default: return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    const getOutcomeBadge = (outcome) => {
        const classes = {
            success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            failed: 'bg-red-100 text-red-700 border-red-200',
            partial: 'bg-amber-100 text-amber-700 border-amber-200',
            pending: 'bg-slate-100 text-slate-600 border-slate-200'
        };
        return classes[outcome] || classes.pending;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Success Rate Analytics</h1>
                <p className="text-slate-500 mt-1">Track experiment outcomes and performance metrics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <BarChart3 className="w-8 h-8 text-blue-200" />
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <p className="text-blue-100 text-sm font-medium">Total Experiments</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                        <p className="text-3xl font-bold">{stats.success}</p>
                    </div>
                    <p className="text-emerald-100 text-sm font-medium">Successful</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <XCircle className="w-8 h-8 text-red-200" />
                        <p className="text-3xl font-bold">{stats.failed}</p>
                    </div>
                    <p className="text-red-100 text-sm font-medium">Failed</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-8 h-8 text-amber-200" />
                        <p className="text-3xl font-bold">{stats.partial}</p>
                    </div>
                    <p className="text-amber-100 text-sm font-medium">Partial Success</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-indigo-200" />
                        <p className="text-3xl font-bold">{stats.successRate}%</p>
                    </div>
                    <p className="text-indigo-100 text-sm font-medium">Success Rate</p>
                </div>
            </div>

            {/* Recent Experiments */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Recent Experiments</h3>
                <div className="space-y-3">
                    {experiments.slice(0, 10).map(exp => (
                        <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                                {getOutcomeIcon(exp.outcome)}
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{exp.title}</p>
                                    <p className="text-xs text-slate-500">{exp.protocol} • {exp.date}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getOutcomeBadge(exp.outcome || 'pending')}`}>
                                {exp.outcome || 'pending'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Protocol Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Success by Protocol</h3>
                <div className="space-y-3">
                    {['Enrichment', 'DLA', 'Spot Test', 'One-Step Growth'].map(protocol => {
                        const protocolExps = experiments.filter(e => e.protocol === protocol);
                        const protocolSuccess = protocolExps.filter(e => e.outcome === 'success').length;
                        const protocolCompleted = protocolExps.filter(e => e.outcome && e.outcome !== 'pending').length;
                        const protocolRate = protocolCompleted > 0 ? ((protocolSuccess / protocolCompleted) * 100).toFixed(0) : 0;

                        return (
                            <div key={protocol} className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-600 w-32">{protocol}</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full flex items-center justify-end px-3 transition-all"
                                        style={{ width: `${protocolRate}%` }}
                                    >
                                        {protocolRate > 0 && (
                                            <span className="text-xs font-bold text-white">{protocolRate}%</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-sm text-slate-500 w-20 text-right">{protocolSuccess}/{protocolCompleted}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SuccessRateAnalytics;
