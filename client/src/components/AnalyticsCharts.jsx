import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// Success Rate Trends Chart
export const SuccessRateTrends = ({ data }) => {
    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Experiment Success Rate Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="successRate"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Success Rate (%)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// Protocol Comparison Chart
export const ProtocolComparison = ({ data }) => {
    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Protocol Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="protocol" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (hrs)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="successCount" fill="#10b981" name="Successes" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// Storage Utilization Pie Chart
export const StorageUtilization = ({ data }) => {
    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Storage Utilization</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// Activity Timeline Chart
export const ActivityTimeline = ({ data }) => {
    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Activity Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="experiments" stackId="a" fill="#10b981" name="Experiments" />
                    <Bar dataKey="samples" stackId="a" fill="#3b82f6" name="Samples" />
                    <Bar dataKey="tasks" stackId="a" fill="#8b5cf6" name="Tasks" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// All-in-one Analytics Dashboard
export const AnalyticsDashboard = ({ successData, protocolData, storageData, activityData }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SuccessRateTrends data={successData} />
            <ProtocolComparison data={protocolData} />
            <StorageUtilization data={storageData} />
            <ActivityTimeline data={activityData} />
        </div>
    );
};

export default AnalyticsDashboard;
