import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Download, AlertTriangle, Loader } from 'lucide-react';
import api from '../api/axios';

const BulkImport = () => {
    const [selectedTable, setSelectedTable] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);

    const TABLES = [
        { value: 'ext_bacterial_strains', label: 'Bacterial Strains' },
        { value: 'ext_bacteriophages', label: 'Bacteriophages' },
        { value: 'ext_plasmids', label: 'Plasmids' },
        { value: 'ext_primers_details', label: 'Primers' },
        { value: 'ext_antibiotics', label: 'Antibiotics' },
        { value: 'ext_lab_stock', label: 'Lab Stock (Chemicals)' }
    ];

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(null);
            setResult(null);
        }
    };

    const handlePreview = async () => {
        if (!file || !selectedTable) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('tableName', selectedTable);

        try {
            const response = await api.post('/import/preview', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPreview(response.data);
        } catch (error) {
            alert('Preview failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleImport = async () => {
        if (!file || !selectedTable) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tableName', selectedTable);

        try {
            const response = await api.post('/import/execute', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(response.data);
            setFile(null);
            setPreview(null);
        } catch (error) {
            alert('Import failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = async () => {
        if (!selectedTable) return;

        try {
            const response = await api.get(`/import/template/${selectedTable}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedTable}_template.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Download failed: ' + error.message);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Bulk CSV Import</h1>
                    <p className="text-slate-500 mt-1">Import multiple records at once from CSV files</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Upload className="w-6 h-6 text-indigo-500" />
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Configuration */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Select Table
                        </label>
                        <select
                            value={selectedTable}
                            onChange={(e) => setSelectedTable(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Choose a table...</option>
                            {TABLES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Upload CSV File
                        </label>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 font-medium">
                                    {file ? file.name : 'Click to upload CSV'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Max 5MB</p>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={downloadTemplate}
                        disabled={!selectedTable}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Download Template
                    </button>

                    <button
                        onClick={handlePreview}
                        disabled={!file || !selectedTable}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Preview Import
                    </button>
                </div>

                {/* Right Panel - Preview/Results */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Preview */}
                    {preview && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Import Preview</h2>
                                <span className="text-sm text-slate-500">
                                    {preview.totalRows} rows detected
                                </span>
                            </div>

                            {preview.hasErrors ? (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                                        <AlertTriangle className="w-5 h-5" />
                                        Validation Errors Found
                                    </div>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {preview.errors.slice(0, 10).map((err, i) => (
                                            <p key={i} className="text-sm text-red-600">
                                                Line {err.line}: {err.error}
                                            </p>
                                        ))}
                                        {preview.errors.length > 10 && (
                                            <p className="text-sm text-red-500 italic">
                                                ...and {preview.errors.length - 10} more errors
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                                        <CheckCircle className="w-5 h-5" />
                                        All rows validated successfully
                                    </div>
                                </div>
                            )}

                            {/* Preview Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                                        <tr>
                                            {preview.preview[0] && Object.keys(preview.preview[0]).map(key => (
                                                <th key={key} className="px-4 py-2 text-left">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {preview.preview.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className="px-4 py-2 text-slate-700">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={preview.hasErrors || importing}
                                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {importing ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Execute Import
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Import Complete</h2>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-blue-600">{result.totalRows}</p>
                                    <p className="text-xs text-blue-700 uppercase font-bold">Total Rows</p>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{result.successfulRows}</p>
                                    <p className="text-xs text-emerald-700 uppercase font-bold">Successful</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl text-center">
                                    <p className="text-2xl font-bold text-red-600">{result.failedRows}</p>
                                    <p className="text-xs text-red-700 uppercase font-bold">Failed</p>
                                </div>
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="font-bold text-red-700 mb-2">Errors:</p>
                                    <div className="space-y-1 max-h-60 overflow-y-auto">
                                        {result.errors.map((err, i) => (
                                            <p key={i} className="text-sm text-red-600">
                                                Line {err.line}: {err.error}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Instructions */}
                    {!preview && !result && (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                            <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="font-bold text-slate-700 mb-2">How to Import</h3>
                            <ol className="text-sm text-slate-600 text-left max-w-md mx-auto space-y-2">
                                <li>1. Select the table you want to import to</li>
                                <li>2. Download the CSV template for that table</li>
                                <li>3. Fill in your data following the template format</li>
                                <li>4. Upload your CSV file and preview</li>
                                <li>5. Fix any validation errors if needed</li>
                                <li>6. Execute the import</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkImport;
