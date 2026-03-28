import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Globe, Shield, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PublicCatalog = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            // Note: In a real deployment, this would come from the unauthenticated /api/public/catalog endpoint
            // For now, we reuse the existing axios instance which might have auth headers, 
            // but the backend endpoint is public.
            const response = await api.get('/public/catalog');
            setAssets(response.data);
        } catch (error) {
            console.error('Error fetching catalog:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.characteristics?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Public Header */}
            <div className="bg-slate-900 text-white p-6 shadow-xl">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Global Access Laboratory</h1>
                            <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase">Public Strain Catalog</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-700"
                    >
                        Researcher Login
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto p-8">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Browse Our Collection</h2>
                            <p className="text-slate-500">Search through verified strains and phages available for collaboration.</p>
                        </div>
                        <div className="relative w-full md:w-96">
                            <input
                                type="text"
                                placeholder="Search Species, Type, or Traits..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                            />
                            <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Species / Name</th>
                                    <th className="px-6 py-4">Strain Number</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4">Characteristics</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading Catalog...</td></tr>
                                ) : filteredAssets.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">No assets found matching your criteria.</td></tr>
                                ) : (
                                    filteredAssets.map((asset) => (
                                        <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${asset.type === 'Phage' ? 'bg-blue-100 text-blue-700' :
                                                        asset.type === 'Strain' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {asset.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold">{asset.species}</td>
                                            <td className="px-6 py-4 font-mono text-slate-500">{asset.strain_number}</td>
                                            <td className="px-6 py-4 text-slate-600">{asset.source || 'N/A'}</td>
                                            <td className="px-6 py-4 text-slate-500 truncate max-w-xs" title={asset.characteristics}>
                                                {asset.characteristics}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Public Footer */}
                    <div className="bg-slate-50 p-6 border-t border-slate-200 text-center text-slate-400 text-xs">
                        <p>© {new Date().getFullYear()} Global Access Laboratory | University of the Punjab</p>
                        <p className="mt-1">For research collaboration inquiries, please contact admin@lims.pu.edu.pk</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicCatalog;
