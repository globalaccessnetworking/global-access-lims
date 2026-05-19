import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import SmartLookup from '../components/SmartLookup';


const EquipmentBooking = () => {
    const [equipment, setEquipment] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [formData, setFormData] = useState({
        start_time: '',
        end_time: '',
        purpose: ''
    });

    useEffect(() => {
        fetchEquipment();
    }, []);

    useEffect(() => {
        if (selectedEquipment) {
            fetchBookings();
        }
    }, [selectedEquipment, selectedDate]);

    const fetchEquipment = async () => {
        try {
            const res = await api.get('/equipment');
            setEquipment(res.data || []);
            if (res.data.length > 0) {
                setSelectedEquipment(res.data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch equipment:', error);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await api.get(`/bookings?equipment_id=${selectedEquipment}&start_date=${selectedDate} 00:00:00&end_date=${selectedDate} 23:59:59`);
            setBookings(res.data.bookings || []);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        }
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        try {
            await api.post('/bookings', {
                equipment_id: selectedEquipment,
                start_time: `${selectedDate} ${formData.start_time}:00`,
                end_time: `${selectedDate} ${formData.end_time}:00`,
                purpose: formData.purpose
            });
            setShowBookingForm(false);
            setFormData({ start_time: '', end_time: '', purpose: '' });
            fetchBookings();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create booking');
        }
    };

    const handleCancelBooking = async (id) => {
        if (!confirm('Cancel this booking?')) return;
        try {
            await api.delete(`/bookings/${id}`);
            fetchBookings();
        } catch (error) {
            alert('Failed to cancel booking');
        }
    };

    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return `${hour}:00`;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Equipment Booking</h1>
                    <p className="text-slate-500 mt-1">Schedule equipment usage to prevent conflicts</p>
                </div>
                <button
                    onClick={() => setShowBookingForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> New Booking
                </button>
            </div>

            {/* Equipment Selector & Date Picker */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <SmartLookup 
                            label="Equipment" 
                            module="equipment" 
                            field="equipment_name" 
                            value={equipment.find(e => e.id === selectedEquipment)?.equipment_name || ''} 
                            onChange={val => {
                                const eq = equipment.find(e => e.equipment_name === val);
                                if (eq) setSelectedEquipment(eq.id);
                            }} 
                            placeholder="Select Equipment..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full rounded-lg border-slate-200"
                        />
                    </div>
                </div>
            </div>

            {/* Booking Timeline */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Daily Schedule
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {timeSlots.map(slot => {
                        const booking = bookings.find(b => {
                            const startHour = new Date(b.start_time).getHours();
                            const slotHour = parseInt(slot.split(':')[0]);
                            return startHour === slotHour;
                        });

                        return (
                            <div key={slot} className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-400 w-16">{slot}</span>
                                {booking ? (
                                    <div className="flex-1 bg-emerald-100 border border-emerald-300 rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-emerald-800">{booking.username}</p>
                                            <p className="text-xs text-emerald-600">{booking.purpose}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCancelBooking(booking.id)}
                                            className="p-1 hover:bg-red-100 text-red-500 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-xs text-slate-400">
                                        Available
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Booking Form Modal */}
            {showBookingForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-800">New Booking</h2>
                            <button onClick={() => setShowBookingForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBooking} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full rounded-lg border-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Time</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="w-full rounded-lg border-slate-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Purpose</label>
                                <textarea
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    className="w-full rounded-lg border-slate-200 h-24"
                                    placeholder="What will you use this equipment for?"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingForm(false)}
                                    className="flex-1 px-4 py-2 text-slate-500 font-bold hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
                                >
                                    Book Equipment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentBooking;
