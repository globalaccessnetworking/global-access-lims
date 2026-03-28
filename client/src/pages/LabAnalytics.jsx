import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    BarChart as BarChartIcon,
    Activity,
    TrendingUp,
    Users,
    PieChart as PieIcon,
    Calendar,
    Target
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

const LabAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics');
                setData(res.data);
            } catch (e) {
                console.error("Failed to fetch analytics", e);
                setError("Failed to compute laboratory intelligence. Please ensure database connectivity.");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-emerald-500 font-bold">
            <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <span className="animate-pulse">Computing Laboratory Intelligence...</span>
        </div>
    );

    if (error || !data) return (
        <div className="p-12 text-center bg-rose-50/50 border border-rose-100 rounded-3xl m-8">
            <Activity className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-rose-900">Intelligence Offline</h2>
            <p className="text-rose-600 mt-2 max-w-md mx-auto">{error || "Data processing error occurred."}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
            >
                Retry Analysis
            </button>
        </div>
    );

    // Process Asset Growth Data for AreaChart
    const growthData = data.assetGrowth.reduce((acc, curr) => {
        const month = new Date(curr.month).toLocaleDateString([], { month: 'short' });
        let existing = acc.find(a => a.name === month);
        if (!existing) {
            existing = { name: month };
            acc.push(existing);
        }
        existing[curr.type] = parseInt(curr.count);
        return acc;
    }, []);

    return (
        <div className="space-y-8 animate-fade-in p-2">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <Activity className="w-10 h-10 text-emerald-600" /> Lab Intelligence Hub
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Cross-module performance metrics and trend analysis.</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-500 flex items-center gap-2">
                        <Calendar size={14} /> Last 6 Months
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Inventory', value: data.inventory.total, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Healthy Stocks', value: `${Math.round((data.inventory.healthy / (data.inventory.total || 1)) * 100)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending Tasks', value: data.tasks.status.find(t => t.status === 'Todo')?.count || 0, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Critical Tasks', value: data.tasks.priority.find(t => t.priority === 'Critical')?.count || 0, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-3xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Asset Growth Evolution */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-600" /> Biological Asset Evolution
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="Strain" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                <Area type="monotone" dataKey="Phage" stroke="#3b82f6" strokeWidth={3} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Protocol Distribution */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-blue-600" /> Research Protocol Distribution
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.protocols}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="protocol"
                                >
                                    {data.protocols.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. Task Status Overiew */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChartIcon className="w-5 h-5 text-purple-600" /> Project Pipeline Velocity
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.tasks.status}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabAnalytics;
