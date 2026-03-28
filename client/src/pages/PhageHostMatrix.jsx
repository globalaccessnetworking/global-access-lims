import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { TestTube, Plus, Save } from 'lucide-react';

const PhageHostMatrix = () => {
    const [matrixData, setMatrixData] = useState([]);
    const [phages, setPhages] = useState([]);
    const [strains, setStrains] = useState([]);
    const [loading, setLoading] = useState(true);

    // This would be a specialized grid view. 
    // For MVP, we list interactions.
    // In a full implementation, we'd render a 2D table.

    useEffect(() => {
        const fetchMatrix = async () => {
            try {
                const res = await api.get('/phage-matrix');
                setMatrixData(res.data);

                // Also fetch phages and strains for dropdowns if we add new
                // For now, let's assume we view existing matrix
            } catch (err) {
                console.error("Failed to load matrix", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMatrix();
    }, []);

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Phage-Host Matrix</h1>
                    <p className="text-slate-400 mt-1">Cross-reference Lysis Scores</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold rounded-lg transition-colors">
                    <Plus size={18} />
                    New Test
                </button>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Phage</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Host Strain</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lysis Score</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {matrixData.length > 0 ? (
                                matrixData.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-emerald-300 font-mono">{item.phage_id}</td>
                                        <td className="p-4 text-blue-300 font-mono">{item.strain_id}</td>
                                        <td className="p-4">
                                            <span className={`
                                                px-2 py-1 rounded text-xs font-bold
                                                ${item.lysis_score?.includes('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}
                                            `}>
                                                {item.lysis_score}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        No interactions recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PhageHostMatrix;
