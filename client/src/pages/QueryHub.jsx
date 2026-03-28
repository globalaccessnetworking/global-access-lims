import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Plus, Play, FileText, Database, X, FileDown, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QueryBuilder from '../components/QueryBuilder';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const QueryHub = () => {
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'builder', 'results'
    const [currentResult, setCurrentResult] = useState(null);
    const [activeQuery, setActiveQuery] = useState(null);

    useEffect(() => { fetchQueries(); }, []);

    const fetchQueries = async () => {
        try {
            const res = await api.get('/queries');
            setQueries(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleRunQuery = async (query) => {
        try {
            setLoading(true);
            const res = await api.get(`/queries/${query.id}/execute`);
            setCurrentResult(res.data);
            setActiveQuery(query);
            setViewMode('results');
        } catch (err) {
            alert("Failed to run query");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuery = async (queryData) => {
        try {
            await api.post('/queries', queryData);
            setViewMode('list');
            fetchQueries();
        } catch (err) {
            alert("Failed to save query");
        }
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                        <Database className="text-[var(--accent-primary)]" /> Query Intelligence Hub
                    </h2>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {viewMode === 'list' && "Manage and execute standard laboratory reports"}
                        {viewMode === 'builder' && "Design new custom data queries"}
                        {viewMode === 'results' && `Results: ${activeQuery?.name}`}
                    </p>
                </div>
                {viewMode === 'list' && (
                    <button
                        onClick={() => setViewMode('builder')}
                        className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all"
                    >
                        <Plus size={20} /> New Query
                    </button>
                )}
                {viewMode !== 'list' && (
                    <button
                        onClick={() => { setViewMode('list'); setCurrentResult(null); }}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2"
                    >
                        <X size={20} /> Close
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden glass-panel rounded-2xl relative">

                {/* LIST MODE */}
                {viewMode === 'list' && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto h-full">
                        {queries.map(q => (
                            <div key={q.id} className="p-6 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)] transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleRunQuery(q)} className="bg-[var(--accent-primary)] text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                                        <Play size={20} fill="currentColor" />
                                    </button>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${q.type === 'static' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-[var(--text-primary)]">{q.name}</h3>
                                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{q.description}</p>
                                        <div className="mt-4 flex gap-2">
                                            <span className="text-xs px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] uppercase tracking-wider">
                                                {q.type}
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                                                {new Date(q.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* BUILDER MODE */}
                {viewMode === 'builder' && (
                    <div className="p-8 h-full overflow-y-auto">
                        <QueryBuilder onSave={handleSaveQuery} onCancel={() => setViewMode('list')} />
                    </div>
                )}

                {/* RESULTS MODE */}
                {viewMode === 'results' && currentResult && (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]/30">
                            <span className="text-sm font-bold text-[var(--text-secondary)]">{currentResult.length} Records Found</span>
                            <div className="flex gap-2">
                                <button onClick={() => exportToPDF(currentResult, [], activeQuery.name)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)]" title="Export PDF"><FileDown size={20} /></button>
                                <button onClick={() => exportToExcel(currentResult, activeQuery.name)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)]" title="Export Excel"><Activity size={20} /></button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[var(--bg-secondary)]/50 sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        {currentResult.length > 0 && Object.keys(currentResult[0]).map(key => (
                                            <th key={key} className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                                                {key.replace(/_/g, ' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {currentResult.map((row, i) => (
                                        <tr key={i} className="hover:bg-[var(--bg-secondary)]/50">
                                            {Object.values(row).map((val, idx) => (
                                                <td key={idx} className="px-6 py-4 text-sm text-[var(--text-primary)] whitespace-nowrap">
                                                    {typeof val === 'object' ? JSON.stringify(val) : val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueryHub;
