import React, { useState } from 'react';
import { Target, Activity, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const TreatmentDesigner = () => {
    const [targetHost, setTargetHost] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleDesign = () => {
        if (!targetHost) return;
        setLoading(true);
        setSearched(true);

        // Mock Predictive Logic
        // In a real app, this would query the PhageHostInteraction table for high-titer matches
        setTimeout(() => {
            const mockPhages = [
                { id: 101, name: 'T4-Like_Pun01', species: 'Myoviridae', titer: '10^9', score: 98, mechanism: 'Lytic' },
                { id: 104, name: 'K1-Depolymerase', species: 'Podoviridae', titer: '10^8', score: 92, mechanism: 'Enzymatic' },
                { id: 108, name: 'Broad-Spec_Phi', species: 'Siphoviridae', titer: '10^8', score: 85, mechanism: 'Lytic' },
            ];
            setSuggestions(mockPhages);
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Treatment Designer</h1>
                    <p className="text-slate-500 mt-1">AI-Driven Phage Cocktail Design & Success Prediction</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Target className="w-6 h-6 text-indigo-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Panel */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Target Pathogen / Host</label>
                    <div className="relative mb-6">
                        <input
                            type="text"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="e.g. E. coli K12"
                            value={targetHost}
                            onChange={(e) => setTargetHost(e.target.value)}
                        />
                        <Activity className="absolute left-4 top-5 text-slate-400 w-5 h-5" />
                    </div>

                    <button
                        onClick={handleDesign}
                        disabled={loading || !targetHost}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Analyzing Host Range...' : 'Predict Cocktail Success'}
                    </button>

                    <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-800 text-xs leading-relaxed">
                        <p className="font-bold flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4" /> AI Method</p>
                        This engine cross-references the <span className="font-bold">Host Range Matrix</span> data with current <span className="font-bold">Titer</span> levels to suggest the most potent lytic phages.
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    {searched && !loading && (
                        <div className="space-y-4">
                            <h2 className="font-bold text-slate-800 text-lg mb-4">Recommended Cocktail Candidates</h2>
                            {suggestions.map((phage, index) => (
                                <div key={phage.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${index === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30' : 'bg-slate-700'}`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{phage.name}</h3>
                                            <p className="text-sm text-slate-500 font-mono">{phage.species} • {phage.mechanism}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Current Titer</p>
                                            <p className="font-mono font-bold text-slate-700">{phage.titer}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Success Score</p>
                                            <p className={`font-bold text-xl ${phage.score > 90 ? 'text-emerald-500' : 'text-indigo-500'}`}>{phage.score}%</p>
                                        </div>
                                        <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-xl transition-colors">
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-8 flex justify-end">
                                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all">
                                    <ShieldCheck className="w-5 h-5" /> Finalize Protocol
                                </button>
                            </div>
                        </div>
                    )}

                    {!searched && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-2xl">
                            <Target className="w-16 h-16 mb-4 text-slate-200" />
                            <p className="font-medium">Enter a Target Host to begin prediction.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TreatmentDesigner;
