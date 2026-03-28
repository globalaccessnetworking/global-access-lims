import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Package, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const InventoryEntry = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        item_name: '',
        manufacturer: '',
        pack_size: '',
        category: '',
        catalog_number: '',
        available_quantity: 0,
        location_area: '',
        location_details: ''
    });

    const [manufacturers, setManufacturers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/inventory/stocks');
                const stocks = res.data;
                setManufacturers([...new Set(stocks.map(s => s.manufacturer).filter(Boolean))].sort());
                setCategories([...new Set(stocks.map(s => s.category).filter(Boolean))].sort());
                setLocations([...new Set(stocks.map(s => s.location_area).filter(Boolean))].sort());
            } catch (err) {
                console.error("Failed to fetch inventory data:", err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'available_quantity' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/stocks', formData);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                navigate('/inventory-hub');
            }, 1000); // Redirect after success
        } catch (err) {
            console.error("Failed to save item:", err);
            const msg = err.response?.data?.message || err.message || "Unknown error";
            alert(`Failed to save item: ${msg}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <button onClick={() => navigate('/inventory-hub')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Hub
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
            >
                {/* ... existing success overlay ... */}
                <AnimatePresence>
                    {showSuccess && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-emerald-500/90 backdrop-blur-md flex flex-col items-center justify-center text-white"
                        >
                            <motion.div
                                initial={{ scale: 0.5 }}
                                animate={{ scale: 1.2 }}
                                className="bg-white text-emerald-500 rounded-full p-4 mb-4 shadow-xl"
                            >
                                <CheckCircle className="w-16 h-16" strokeWidth={3} />
                            </motion.div>
                            <h2 className="text-3xl font-bold">Item Added!</h2>
                            <p className="opacity-90 mt-2">Redirecting to Inventory Hub...</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Package className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Add New Stock</h1>
                        <p className="text-slate-400">Register new reagents or consumables into the LIMS</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-emerald-400 uppercase mb-2">Item Name</label>
                            <input
                                required
                                type="text"
                                name="item_name"
                                value={formData.item_name}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="e.g. Trypsone Soya Broth"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Catalog Number</label>
                            <input
                                type="text"
                                name="catalog_number"
                                value={formData.catalog_number}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                                placeholder="e.g. CAT-12345"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Manufacturer</label>
                            <input
                                type="text"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleChange}
                                list="manufacturer-list"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                                placeholder="Search or Type..."
                            />
                            <datalist id="manufacturer-list">
                                {manufacturers.map((m, i) => <option key={i} value={m} />)}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                list="category-list"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                                placeholder="Search or Type..."
                            />
                            <datalist id="category-list">
                                {categories.map((c, i) => <option key={i} value={c} />)}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pack Size</label>
                            <input
                                type="text"
                                name="pack_size"
                                value={formData.pack_size}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                                placeholder="e.g. 500g, 100ml"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Initial Quantity</label>
                            <input
                                type="number"
                                name="available_quantity"
                                value={formData.available_quantity}
                                onChange={handleChange}
                                min="0"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Storage Location (Area)</label>
                            <input
                                type="text"
                                name="location_area"
                                value={formData.location_area}
                                onChange={handleChange}
                                list="location-list"
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all"
                                placeholder="e.g. Chemical Store, Shelf A"
                            />
                            <datalist id="location-list">
                                {locations.map((l, i) => <option key={i} value={l} />)}
                            </datalist>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Specific Details / Shelf</label>
                            <textarea
                                name="location_details"
                                value={formData.location_details}
                                onChange={handleChange}
                                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition-all h-24"
                                placeholder="e.g. Middle Shelf, Bin 4 (Optional)"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" /> Save to Inventory
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default InventoryEntry;
