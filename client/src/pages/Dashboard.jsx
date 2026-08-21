import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    LayoutGrid, Dna, Archive, Bug, AlertTriangle, Activity, Clock, Star, Plus, TrendingUp,
    Zap, FileText, Beaker, Calendar, Users, Target
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtext, onClick }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 group hover:border-emerald-500/30 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-white/5 ${color} bg-opacity-10 text-white`}>
                    <Icon size={20} />
                </div>
                <h3 className="text-slate-400 font-medium text-sm tracking-wider uppercase">{title}</h3>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                    {value ? value.toLocaleString() : '0'}
                </div>
                {subtext && <div className="text-xs text-slate-500">{subtext}</div>}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalStrains: 0,
        totalPhages: 0,
        totalInventory: 0,
        lowStock: 0,
        activeProjects: 0
    });
    const [quickStats, setQuickStats] = useState({
        experimentsThisWeek: 0,
        samplesToday: 0,
        tasksCompletedWeek: 0
    });
    const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
    const [userTasks, setUserTasks] = useState([]);
    const [topSpecies, setTopSpecies] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, quickRes, alertsRes, tasksRes, activityRes, favRes] = await Promise.allSettled([
                    api.get('/dashboard/stats'),
                    api.get('/activity/stats'),
                    api.get('/alerts'),
                    api.get('/dashboard/user-tasks'),
                    api.get('/activity/recent?limit=10'),
                    api.get('/activity/favorites'),
                ]);

                // Stats — primary metrics cards
                if (statsRes.status === 'fulfilled' && statsRes.value?.data?.metrics) {
                    setStats(statsRes.value.data.metrics);
                    setTopSpecies(statsRes.value.data.topSpecies || []);
                } else {
                    // Fallback: fetch counts directly if stats endpoint fails
                    console.warn('Dashboard stats endpoint failed, attempting direct count fallback...');
                    try {
                        const [strainRes, phageRes, invRes, projRes] = await Promise.allSettled([
                            api.get('/system/ext_bacterial_strains'),
                            api.get('/system/ext_bacteriophages'),
                            api.get('/system/ext_lab_stock'),
                            api.get('/system/ext_lab_projects'),
                        ]);
                        setStats({
                            totalStrains: strainRes.status === 'fulfilled' ? (strainRes.value.data?.count || strainRes.value.data?.data?.length || 0) : 0,
                            totalPhages: phageRes.status === 'fulfilled' ? (phageRes.value.data?.count || phageRes.value.data?.data?.length || 0) : 0,
                            totalInventory: invRes.status === 'fulfilled' ? (invRes.value.data?.count || invRes.value.data?.data?.length || 0) : 0,
                            lowStock: 0,
                            activeProjects: projRes.status === 'fulfilled' ? (projRes.value.data?.count || projRes.value.data?.data?.length || 0) : 0,
                        });
                    } catch (fallbackErr) {
                        console.error('Dashboard fallback counts also failed:', fallbackErr.message);
                    }
                }

                // Quick stats (experiments, samples, tasks)
                if (quickRes.status === 'fulfilled') {
                    setQuickStats(quickRes.value.data || { experimentsThisWeek: 0, samplesToday: 0, tasksCompletedWeek: 0 });
                }

                // Alerts
                if (alertsRes.status === 'fulfilled') {
                    setAlerts(alertsRes.value.data || { lowStock: [], expiring: [] });
                }

                // User tasks
                if (tasksRes.status === 'fulfilled') {
                    setUserTasks(tasksRes.value.data || []);
                } else {
                    console.warn('User tasks fetch failed (may need auth):', tasksRes.reason?.message);
                    setUserTasks([]);
                }

                // Recent activity
                if (activityRes.status === 'fulfilled') {
                    setRecentActivity(activityRes.value.data?.activities || []);
                }

                // Favorites
                if (favRes.status === 'fulfilled') {
                    setFavorites(favRes.value.data?.favorites || []);
                }

            } catch (error) {
                console.error('Dashboard orchestration failed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

    const getActivityIcon = (type) => {
        switch (type) {
            case 'experiment': return <FileText className="w-4 h-4" />;
            case 'strain': return <Dna className="w-4 h-4" />;
            case 'phage': return <Bug className="w-4 h-4" />;
            case 'chemical': return <Beaker className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'created': return 'text-emerald-400';
            case 'updated': return 'text-blue-400';
            case 'deleted': return 'text-rose-400';
            default: return 'text-slate-400';
        }
    };

    if (loading) return <div className="p-8 text-emerald-500">Loading Command Center...</div>;

    return (
        <div className="p-6 space-y-6 max-w-[1800px] mx-auto animate-fade-in">
            {/* Header with Quick Actions */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
                    <p className="text-slate-400 mt-1">LIMS Overview & Real-time Metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/experiments/new')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        New Experiment
                    </button>
                    <button
                        onClick={() => navigate('/data-entry')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Dna size={18} />
                        Add Sample
                    </button>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-mono flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        SYSTEM OPERATIONAL
                    </div>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-300 text-sm font-medium">Experiments This Week</p>
                            <p className="text-3xl font-bold text-white mt-1">{quickStats.experimentsThisWeek}</p>
                        </div>
                        <TrendingUp className="text-blue-400" size={32} />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-300 text-sm font-medium">Samples Added Today</p>
                            <p className="text-3xl font-bold text-white mt-1">{quickStats.samplesToday}</p>
                        </div>
                        <Zap className="text-emerald-400" size={32} />
                    </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-300 text-sm font-medium">Tasks Completed</p>
                            <p className="text-3xl font-bold text-white mt-1">{quickStats.tasksCompletedWeek}</p>
                        </div>
                        <Target className="text-purple-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Bacterial Strains"
                    value={stats.totalStrains}
                    icon={Dna}
                    color="text-blue-400"
                    subtext="Active library"
                    onClick={() => navigate('/library')}
                />
                <StatCard
                    title="Phage Library"
                    value={stats.totalPhages}
                    icon={Bug}
                    color="text-emerald-400"
                    subtext="Purified assets"
                    onClick={() => navigate('/library')}
                />
                <StatCard
                    title="Active Projects"
                    value={stats.activeProjects}
                    icon={LayoutGrid}
                    color="text-blue-500"
                    subtext="Ongoing research"
                    onClick={() => navigate('/dynamic/ext_lab_projects')}
                />
                <StatCard
                    title="Inventory"
                    value={stats.totalInventory}
                    icon={Archive}
                    color="text-purple-400"
                    subtext="Tracked assets"
                    onClick={() => navigate('/inventory-hub')}
                />
                <StatCard
                    title="Alerts"
                    value={(alerts.lowStock?.length || 0) + (alerts.expiring?.length || 0)}
                    icon={AlertTriangle}
                    color="text-rose-400"
                    subtext="Needs attention"
                    onClick={() => navigate('/alerts')}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Species Distribution Chart */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <Activity size={18} className="text-emerald-400" />
                        Top 5 Bacterial Species
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSpecies} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                                <YAxis
                                    dataKey="species"
                                    type="category"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    width={120}
                                    tickFormatter={(val) => val && val.length > 15 ? val.substring(0, 15) + '...' : val}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                    itemStyle={{ color: '#10b981' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                    {topSpecies.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vertical Sidebar Panels */}
                <div className="space-y-6">
                    {/* My Tasks Widget */}
                    <div className="bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <LayoutGrid size={18} className="text-blue-400" />
                                {JSON.parse(localStorage.getItem('user') || '{}').role === 'Admin' || JSON.parse(localStorage.getItem('user') || '{}').role === 'SuperAdmin'
                                    ? 'Laboratory Task Overview'
                                    : 'My Assigned Tasks'}
                            </h3>
                            <button onClick={() => navigate('/dynamic/ext_lab_tasks')} className="text-[10px] text-slate-500 hover:text-emerald-400 uppercase tracking-widest font-bold">View All</button>
                        </div>

                        <div className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-1">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : userTasks.length > 0 ? (
                                userTasks.map((task, i) => (
                                    <div key={task.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => navigate('/dynamic/ext_lab_tasks')}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${task.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                                                task.priority === 'High' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {task.priority || 'Medium'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono italic">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}</span>
                                        </div>
                                        <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-1">{task.title}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                            {task.project_name || 'Individual Task'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-40 border border-dashed border-white/10 rounded-xl h-full">
                                    <LayoutGrid size={40} className="mb-4 text-slate-600" />
                                    <p className="text-xs text-slate-500 text-center px-4">You have no pending laboratory tasks at this moment.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick System Alerts */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                            System Alerts
                            <AlertTriangle size={14} className="text-rose-400" />
                        </h3>
                        <div className="space-y-3 max-h-[160px] overflow-y-auto scrollbar-hide">
                            {(alerts.lowStock?.length > 0 || alerts.expiring?.length > 0) ? (
                                <>
                                    {alerts.lowStock.slice(0, 2).map((item, i) => (
                                        <div key={`ls-${i}`} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-[11px] text-rose-300 flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <span className="bg-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">LOW STOCK</span>
                                        </div>
                                    ))}
                                    {alerts.expiring.slice(0, 2).map((item, i) => (
                                        <div key={`ex-${i}`} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-300 flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">EXPIRING</span>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="text-[11px] text-slate-600 text-center py-4">No active system alerts.</div>
                            )}
                        </div>
                        <button onClick={() => navigate('/alerts')} className="w-full mt-4 py-2 border border-white/5 hover:bg-white/5 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-widest transition-all">Open Alert Center</button>
                    </div>
                </div>
            </div>

            {/* Recent Activity & Favorites Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Feed */}
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="text-blue-400" size={18} />
                        Recent Activity
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                                    <div className="text-emerald-400">
                                        {getActivityIcon(activity.entity_type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white">
                                            <span className="font-medium">{activity.username || 'System'}</span>
                                            <span className={`mx-1 ${getActionColor(activity.action_type)}`}>{activity.action_type}</span>
                                            <span className="text-slate-400">{activity.entity_type}</span>
                                        </p>
                                        <p className="text-xs text-slate-500">{activity.entity_name}</p>
                                    </div>
                                    <span className="text-xs text-slate-600">
                                        {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">No recent activity</div>
                        )}
                    </div>
                </div>

                {/* Favorites */}
                <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Star className="text-amber-400" size={18} />
                        Favorites
                    </h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {favorites.length > 0 ? (
                            favorites.map((fav, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
                                    <div className="text-amber-400">
                                        {getActivityIcon(fav.entity_type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">{fav.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{fav.entity_type}</p>
                                    </div>
                                    <Star className="text-amber-400 fill-amber-400" size={14} />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                <Star className="mx-auto mb-2 text-slate-600" size={32} />
                                No favorites yet. Star items to quick access them here.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
