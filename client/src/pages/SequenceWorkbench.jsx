import React, { useState } from 'react';
import { Dna, Search, AlertTriangle, CheckCircle, Database } from 'lucide-react';

const SequenceWorkbench = () => {
    const [sequence, setSequence] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnalyze = () => {
        if (!sequence) return;
        setAnalyzing(true);
        setResult(null);

        // Mock Analysis Simulation
        setTimeout(() => {
            const mockSimilarity = Math.random() > 0.5 ? 92 : 45; // Randomly generate high/low match
            const mockMatch = mockSimilarity > 90
                ? { name: 'Fwd_T4_MajorCapsid', id: 142, similarity: mockSimilarity }
                : null;

            setResult({
                gcContent: 45.2,
                length: sequence.length,
                match: mockMatch
            });
            setAnalyzing(false);
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Genomic Workbench</h1>
                    <p className="text-slate-500 mt-1">In-Silico PCR & Sequence Validation Tool</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Dna className="w-6 h-6 text-blue-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Input FASTA / DNA Sequence</label>
                        <textarea
                            className="w-full h-64 font-mono text-sm bg-slate-50 border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder=">Seq1&#10;ATGCGT..."
                            value={sequence}
                            onChange={(e) => setSequence(e.target.value.toUpperCase().replace(/[^ATGC\n>]/g, ''))}
                        ></textarea>
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-xs text-slate-400 font-mono">Length: {sequence.length} bp</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const rc = sequence.split('').reverse().map(b =>
                                            b === 'A' ? 'T' : b === 'T' ? 'A' : b === 'G' ? 'C' : b === 'C' ? 'G' : b
                                        ).join('');
                                        setSequence(rc);
                                    }}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 text-xs"
                                >
                                    Rev. Comp
                                </button>
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!sequence || analyzing}
                                    className={`px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2 transition-all ${analyzing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'}`}
                                >
                                    {analyzing ? 'Processing...' : <><Search className="w-4 h-4" /> Analyze Sequence</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {result && (
                        <div className={`p-6 rounded-2xl border flex items-start gap-4 animate-fade-in-up ${result.match ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                            {result.match ? (
                                <div className="p-3 bg-red-100 rounded-full text-red-600"><AlertTriangle className="w-6 h-6" /></div>
                            ) : (
                                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><CheckCircle className="w-6 h-6" /></div>
                            )}
                            <div>
                                <h3 className={`font-bold text-lg ${result.match ? 'text-red-800' : 'text-emerald-800'}`}>
                                    {result.match ? 'High Similarity Detected' : 'Sequence Unique'}
                                </h3>
                                <p className={`text-sm mt-1 ${result.match ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {result.match
                                        ? `Warning: This sequence is ${result.match.similarity}% similar to existing primer "${result.match.name}" (ID: ${result.match.id}).`
                                        : "No significant matches found in the internal database (>90% similarity)."}
                                </p>
                                <div className="flex gap-4 mt-4">
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        GC Content: <span className="text-slate-800">{((sequence.split('').filter(b => b === 'G' || b === 'C').length / sequence.length) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Melting Temp (Tm): <span className="text-slate-800">54°C</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-400">
                            <Database className="w-4 h-4" /> Database Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-400 text-sm">Indexed Primers</span>
                                <span className="font-mono font-bold">142</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-slate-400 text-sm">Plasmids</span>
                                <span className="font-mono font-bold">89</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-slate-400 text-sm">Last Synced</span>
                                <span className="font-mono text-xs text-emerald-500">Just Now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SequenceWorkbench;
