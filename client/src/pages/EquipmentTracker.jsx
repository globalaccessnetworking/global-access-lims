import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar, AlertCircle, CheckCircle, PenTool, Plus, X, Save, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EquipmentTracker = () => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentItem, setCurrentItem] = useState({
        equipment_name: '',
        serial_number: '',
        last_calibration_date: '',
        next_due_date: '',
        status: 'Operational',
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/equipment');
            setEquipment(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to load equipment", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === 'add') {
                await api.post('/equipment', currentItem);
            } else {
                await api.put(`/equipment/${currentItem.id}`, currentItem);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            console.error("Failed to save equipment", err);
            alert("Failed to save changes.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this equipment from tracking?")) return;
        try {
            await api.delete(`/equipment/${id}`);
            fetchData();
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete record.");
        }
    };

    const openModal = (mode, item = null) => {
        setModalMode(mode);
        if (item) {
            setCurrentItem(item);
        } else {
            setCurrentItem({
                equipment_name: '',
                serial_number: '',
                last_calibration_date: '',
                next_due_date: '',
                status: 'Operational',
                notes: ''
            });
        }
        setIsModalOpen(true);
    };

    const getStatusParams = (status) => {
        switch (status) {
            case 'Operational':
                return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle };
            case 'Maintenance Due':
                return { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertCircle };
            case 'Out of Order':
                return { color: 'text-rose-400', bg: 'bg-rose-500/10', icon: AlertCircle };
            default:
                return { color: 'text-slate-400', bg: 'bg-slate-500/10', icon: PenTool };
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <PenTool className="text-emerald-500 w-8 h-8" />
                        Equipment Maintenance
                    </h1>
                    <p className="text-slate-400 mt-1">Calibration & Status Tracking</p>
                </div>
                <button
                    onClick={() => openModal('add')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                    <Plus size={20} />
                    Add Equipment
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.map((item) => {
                    const status = getStatusParams(item.status);
                    const StatusIcon = status.icon;

                    return (
                        <div key={item.id} className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{item.equipment_name}</h3>
                                    <p className="text-sm text-slate-500 font-mono tracking-tighter">{item.serial_number || 'S/N: N/A'}</p>
                                </div>
                                <div className={`p-3 rounded-2xl ${status.bg} ${status.color} shadow-inner`}>
                                    <StatusIcon size={24} />
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 flex items-center gap-2 uppercase font-bold tracking-widest">
                                            <Calendar size={12} className="text-emerald-500/50" /> Last Calibrated
                                        </span>
                                        <span className="text-slate-300 font-mono">{item.last_calibration_date || 'Pending'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 flex items-center gap-2 uppercase font-bold tracking-widest">
                                            <Calendar size={12} className="text-rose-500/50" /> Next Due
                                        </span>
                                        <span className={`font-bold font-mono ${new Date(item.next_due_date) < new Date() ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                                            {item.next_due_date || 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {item.notes && (
                                    <p className="text-xs text-slate-500 italic px-2 line-clamp-2">
                                        "{item.notes}"
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
                                <button
                                    onClick={() => openModal('edit', item)}
                                    className="flex-1 py-2.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} /> Update status
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {equipment.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                    <div className="p-8 bg-slate-900/50 rounded-full border border-white/5">
                        <PenTool className="w-16 h-16 text-slate-700" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Inventory Clear</p>
                        <p className="text-slate-500 text-xs">No equipment logs found in the archives.</p>
                    </div>
                    <button
                        onClick={() => openModal('add')}
                        className="text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase tracking-wider underline-offset-4 hover:underline"
                    >
                        Register New Hardware
                    </button>
                </div>
            )}

            {/* Equipment Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-bold text-white">
                                    {modalMode === 'add' ? 'Register Equipment' : 'Update Log'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hardware Identity</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. ABI 7500 Real-Time PCR"
                                                value={currentItem.equipment_name || ''}
                                                onChange={e => setCurrentItem({ ...currentItem, equipment_name: e.target.value })}
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Serial Number</label>
                                            <input
                                                type="text"
                                                placeholder="S/N"
                                                value={currentItem.serial_number || ''}
                                                onChange={e => setCurrentItem({ ...currentItem, serial_number: e.target.value })}
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Current Status</label>
                                            <select
                                                value={currentItem.status}
                                                onChange={e => setCurrentItem({ ...currentItem, status: e.target.value })}
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                                            >
                                                <option value="Operational">Operational</option>
                                                <option value="Maintenance Due">Maintenance Due</option>
                                                <option value="Out of Order">Out of Order</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Calibration</label>
                                            <input
                                                type="date"
                                                value={currentItem.last_calibration_date || ''}
                                                onChange={e => setCurrentItem({ ...currentItem, last_calibration_date: e.target.value })}
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Next Due Date</label>
                                            <input
                                                type="date"
                                                value={currentItem.next_due_date || ''}
                                                onChange={e => setCurrentItem({ ...currentItem, next_due_date: e.target.value })}
                                                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Maintenance Notes</label>
                                        <textarea
                                            placeholder="Standard calibration using kit..."
                                            value={currentItem.notes || ''}
                                            onChange={e => setCurrentItem({ ...currentItem, notes: e.target.value })}
                                            rows={2}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-700 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3.5 rounded-2xl text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-slate-900 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} /> Save Record
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EquipmentTracker;
