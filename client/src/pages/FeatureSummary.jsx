import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import api from '../api/axios';

const FeatureSummary = () => {
    const [stats, setStats] = useState({
        totalExperiments: 0,
        successRate: 0,
        totalImports: 0,
        totalAttachments: 0,
        totalBookings: 0,
        totalTemplates: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch experiments with outcomes
            const expRes = await api.get('/experiments');
            const experiments = expRes.data || [];

            const completed = experiments.filter(e => e.outcome && e.outcome !== 'pending');
            const successful = completed.filter(e => e.outcome === 'success');
            const successRate = completed.length > 0 ? (successful.length / completed.length * 100).toFixed(1) : 0;

            // Fetch other stats
            const importRes = await api.get('/import/history').catch(() => ({ data: [] }));
            const attachRes = await api.get('/attachments').catch(() => ({ data: { attachments: [] } }));
            const bookingRes = await api.get('/bookings').catch(() => ({ data: { bookings: [] } }));
            const templateRes = await api.get('/templates').catch(() => ({ data: { templates: [] } }));

            setStats({
                totalExperiments: experiments.length,
                successRate,
                totalImports: importRes.data.length || 0,
                totalAttachments: attachRes.data.attachments?.length || 0,
                totalBookings: bookingRes.data.bookings?.length || 0,
                totalTemplates: templateRes.data.templates?.length || 0
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const features = [
        {
            title: 'Bulk CSV Import',
            description: 'Batch import data with validation',
            icon: TrendingUp,
            color: 'bg-blue-500',
            stat: `${stats.totalImports} imports`,
            status: 'active'
        },
        {
            title: 'Photo Attachments',
            description: 'Visual documentation for experiments',
            icon: CheckCircle2,
            color: 'bg-emerald-500',
            stat: `${stats.totalAttachments} files`,
            status: 'active'
        },
        {
            title: 'Project Access Control',
            description: 'Role-based team collaboration',
            icon: CheckCircle2,
            color: 'bg-indigo-500',
            stat: 'Owner/Member/Viewer',
            status: 'active'
        },
        {
            title: 'Equipment Booking',
            description: 'Prevent scheduling conflicts',
            icon: Clock,
            color: 'bg-purple-500',
            stat: `${stats.totalBookings} bookings`,
            status: 'active'
        },
        {
            title: 'Success Rate Tracking',
            description: 'Monitor experiment outcomes',
            icon: BarChart3,
            color: 'bg-amber-500',
            stat: `${stats.successRate}% success`,
            status: 'active'
        },
        {
            title: 'Experiment Templates',
            description: 'Reusable workflows',
            icon: CheckCircle2,
            color: 'bg-cyan-500',
            stat: `${stats.totalTemplates} templates`,
            status: 'active'
        },
        {
            title: 'Enhanced Audit Trail',
            description: 'Regulatory compliance logging',
            icon: CheckCircle2,
            color: 'bg-slate-500',
            stat: 'Full tracking',
            status: 'active'
        },
        {
            title: 'Temperature Monitoring',
            description: 'IoT sensor integration',
            icon: AlertCircle,
            color: 'bg-red-500',
            stat: 'Ready for sensors',
            status: 'ready'
        },
        {
            title: 'Email Notifications',
            description: 'Automated alerts',
            icon: Clock,
            color: 'bg-orange-500',
            stat: 'Infrastructure ready',
            status: 'ready'
        },
        {
            title: '@Mentions',
            description: 'Team notifications',
            icon: CheckCircle2,
            color: 'bg-pink-500',
            stat: 'Database ready',
            status: 'ready'
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">New Features Overview</h1>
                <p className="text-slate-500 mt-1">10 high-impact features to enhance your laboratory workflow</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Total Experiments</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalExperiments}</p>
                        </div>
                        <BarChart3 className="w-12 h-12 text-emerald-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Success Rate</p>
                            <p className="text-3xl font-bold mt-1">{stats.successRate}%</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-blue-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">CSV Imports</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalImports}</p>
                        </div>
                        <CheckCircle2 className="w-12 h-12 text-purple-200" />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-amber-100 text-sm font-medium">Attachments</p>
                            <p className="text-3xl font-bold mt-1">{stats.totalAttachments}</p>
                        </div>
                        <CheckCircle2 className="w-12 h-12 text-amber-200" />
                    </div>
                </div>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${feature.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${feature.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                {feature.status === 'active' ? 'Active' : 'Ready'}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
                        <p className="text-sm text-slate-600 mb-3">{feature.description}</p>
                        <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase">{feature.stat}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Implementation Status */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl text-white">
                <h2 className="text-2xl font-bold mb-4">Implementation Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-slate-400 text-sm mb-2">Fully Implemented</p>
                        <p className="text-4xl font-bold text-emerald-400">3/10</p>
                        <p className="text-slate-300 text-sm mt-1">Complete frontend + backend</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm mb-2">Database Ready</p>
                        <p className="text-4xl font-bold text-blue-400">10/10</p>
                        <p className="text-slate-300 text-sm mt-1">All schemas migrated</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm mb-2">Backend APIs</p>
                        <p className="text-4xl font-bold text-purple-400">5/10</p>
                        <p className="text-slate-300 text-sm mt-1">Controllers & routes ready</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeatureSummary;
