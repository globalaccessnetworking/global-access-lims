import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ChevronRight, Package, Beaker, LayoutGrid } from 'lucide-react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AlertCenter = () => {
    const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await api.get('/alerts');
                setAlerts(res.data);
            } catch (err) {
                console.error('Failed to fetch alerts:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);

    if (loading) return <div className="p-8 text-emerald-500">Scanning for alerts...</div>;

    return (
        <div className="p-6 space-y-8 animate-fade-in max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Alert Center</h1>
                <p className="text-slate-400 mt-1">Inventory maintenance and quality control notifications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Low Stock Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="text-xl font-semibold text-white">Low Stock Items</h2>
                    </div>
                    <div className="space-y-3">
                        {alerts.lowStock.length > 0 ? (
                            alerts.lowStock.map((item, idx) => (
                                <div key={`low-${idx}`} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-rose-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                                            {item.type === 'Chemical' ? <Beaker className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{item.name}</div>
                                            <div className="text-xs text-slate-500">{item.type} • {item.quantity} / {item.threshold} {item.unit}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/inventory-hub')}
                                        className="text-slate-500 group-hover:text-white transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-500 py-8 text-center bg-slate-800/20 border border-dashed border-slate-700 rounded-xl">
                                No low stock alerts.
                            </div>
                        )}
                    </div>
                </div>

                {/* Expiry Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-400">
                        <Clock className="w-5 h-5" />
                        <h2 className="text-xl font-semibold text-white">Soon to Expire</h2>
                    </div>
                    <div className="space-y-3">
                        {alerts.expiring.length > 0 ? (
                            alerts.expiring.map((item, idx) => (
                                <div key={`exp-${idx}`} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.type === 'Task Overdue' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {item.type === 'Chemical' ? <Beaker className="w-5 h-5" /> :
                                                item.type === 'Task Overdue' ? <Clock className="w-5 h-5" /> :
                                                    item.type === 'Project Deadline' ? <LayoutGrid className="w-5 h-5" /> :
                                                        <Package className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{item.name}</div>
                                            <div className="text-xs text-slate-500">
                                                {item.type} • {item.type.includes('Task') ? 'Overdue since' : 'Expires'}: {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (item.type === 'Task Overdue') navigate('/dynamic/ext_lab_tasks');
                                            else if (item.type === 'Project Deadline') navigate('/dynamic/ext_lab_projects');
                                            else navigate('/inventory-hub');
                                        }}
                                        className="text-slate-500 group-hover:text-white transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-slate-500 py-8 text-center bg-slate-800/20 border border-dashed border-slate-700 rounded-xl">
                                No expiry alerts.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertCenter;
