import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Edit3, Database, FlaskConical, Bug, Dna, FileCode, CheckCircle, AlertCircle, Loader2, Thermometer, MapPin, Microscope, Package, FlaskRound, Image as ImageIcon } from 'lucide-react';
import api from '../api/axios';
import RelationalSelect from './RelationalSelect';

// =============================================================================
// HUMAN-READABLE FIELD LABEL MAPS PER ASSET TYPE
// =============================================================================
const FIELD_LABELS = {
    // Bacterial Strains
    Strain_No:                  'Strain Number',
    Specie:                     'Species / Organism',
    Wild_type_Recom:            'Wild Type / Recombinant',
    Antibiotic_sensitivity:     'Antibiotic Sensitivity',
    Antibiotic_resistance:      'Antibiotic Resistance',
    Detail_of_Bacterial_Strain: 'Strain Description / Notes',
    Glycerol_Stock_tube_label:  'Glycerol Stock Tube Label',
    GS_Freezer_Number:          'Glycerol Stock Freezer No.',
    GS_Rack_Number:             'Glycerol Stock Rack No.',
    GS_Box_details:             'Glycerol Stock Box',
    Location_in_Box_GS:         'Position in Glycerol Stock Box',
    Genomic_DNA_tube_Label:     'Genomic DNA Tube Label',
    GD_Freezer_Number:          'Genomic DNA Freezer No.',
    GD_Rack_Number:             'Genomic DNA Rack No.',
    GD_Box_detail:              'Genomic DNA Box',
    Loction_in_Box_PD:          'Position in Genomic DNA Box',

    // Bacteriophages
    Bacteriophage_Name:         'Bacteriophage Name',
    Against_Species:            'Active Against Species',
    Host_Bacteria:              'Host Bacterium',
    Genome_Size:                'Genome Size (kb)',
    Host_Range:                 'Host Range',
    WT_RECOMB:                  'Wild Type / Recombinant',
    Plaque_Morphology:          'Plaque Morphology',
    Characterization_details:   'Characterization Notes',
    plaque_assay_result:        'Plaque Assay Result',
    Antibiotic_resistance:      'Antibiotic Resistance',
    Glycerol_Stock_tube_Label:  'Glycerol Stock Tube Label',
    GS_Freezer_Name:            'Glycerol Stock Freezer',
    GS_Racks:                   'Glycerol Stock Rack',
    GS_position_in_Box:         'Position in Glycerol Stock Box',
    _4C_Stock_detail:           '4°C Stock Detail',
    _4C_Fridge_Number:          '4°C Fridge Number',
    _4C_Rack_Number:            '4°C Rack Number',
    _4C_Position_in_box:        '4°C Position in Box',
    DNA_Storage_Label:          'DNA Storage Tube Label',
    DNA_storage_Box_detail:     'DNA Storage Box',

    // Plasmids
    Plasmid_Name:               'Plasmid Name',
    Plasmid_Backbone:           'Plasmid Backbone',
    Gene_Source:                'Gene Source',
    Cloning_Method:             'Cloning Method',
    Antibiotic_Marker:          'Antibiotic Selection Marker',
    Cloned_Gene_Sequence:       'Cloned Gene Sequence',
    Cloned_Protein_Sequence:    'Cloned Protein Sequence',
    Activity_Shown_Against:     'Activity Shown Against',
    Protein_Purification_status:'Protein Purification Status',
    Glycerol_Stock_Tube_Label:  'Glycerol Stock Tube Label',
    GLycerol_Stock_Freezer:     'Glycerol Stock Freezer',
    Glycerol_Stock_Rack:        'Glycerol Stock Rack',
    Glycerol_Stock_Box:         'Glycerol Stock Box',
    Location_in_Box_GS:         'Position in Glycerol Stock Box',
    PLasmid_DNA_Label:          'Plasmid DNA Tube Label',
    DNA_Store_Freezer:          'DNA Storage Freezer',
    DNA_Store_Rack:             'DNA Storage Rack',
    DNA_Store_Box_Detail:       'DNA Storage Box',

    // Primers
    Primer_Name:                'Primer Name',
    DNA_sequence:               'DNA Sequence (5\' → 3\')',
    Purpose:                    'Purpose / Application',
    Binds_with_Phage_Bacteria_Plasmid: 'Binds With',
    Phage:                      'Target Phage',
    Bacteria:                   'Target Bacterium',
    Plasmid:                    'Target Plasmid',
    Freezer:                    'Storage Freezer',
    Freezer_Shelve:             'Freezer Shelf',
    Box_detail:                 'Storage Box',
    Location_in_Box:            'Position in Box',
};

// Fields grouped by section per asset type
const FIELD_SECTIONS = {
    STRAIN: [
        { title: 'Basic Information', icon: '🧫', fields: ['Strain_No', 'Specie', 'Wild_type_Recom', 'Detail_of_Bacterial_Strain'] },
        { title: 'Glycerol Stock Storage', icon: '🧊', fields: ['Glycerol_Stock_tube_label', 'GS_Freezer_Number', 'GS_Rack_Number', 'GS_Box_details', 'Location_in_Box_GS'] },
        { title: 'Genomic DNA Storage', icon: '🧬', fields: ['Genomic_DNA_tube_Label', 'GD_Freezer_Number', 'GD_Rack_Number', 'GD_Box_detail', 'Loction_in_Box_PD'] },
        { title: 'Antibiotic Profile', icon: '💊', fields: ['Antibiotic_sensitivity', 'Antibiotic_resistance'] },
    ],
    PHAGE: [
        { title: 'Basic Information', icon: '🦠', fields: ['Bacteriophage_Name', 'Host_Bacteria', 'Against_Species', 'Genome_Size', 'Host_Range', 'WT_RECOMB'] },
        { title: 'Characterization', icon: '🔬', fields: ['Plaque_Morphology', 'plaque_assay_result', 'Characterization_details', 'Antibiotic_resistance'] },
        { title: 'Glycerol Stock Storage (-80°C)', icon: '🧊', fields: ['Glycerol_Stock_tube_Label', 'GS_Freezer_Name', 'GS_Racks', 'GS_Box_details', 'GS_position_in_Box'] },
        { title: '4°C Stock Storage', icon: '🌡️', fields: ['_4C_Stock_detail', '_4C_Fridge_Number', '_4C_Rack_Number', '_4C_Position_in_box'] },
        { title: 'DNA Storage', icon: '🧬', fields: ['DNA_Storage_Label', 'DNA_storage_Box_detail'] },
    ],
    PLASMID: [
        { title: 'Basic Information', icon: '⚗️', fields: ['Plasmid_Name', 'Plasmid_Backbone', 'Gene_Source', 'Cloning_Method', 'Antibiotic_Marker', 'Host_Bacteria', 'Activity_Shown_Against'] },
        { title: 'Sequences', icon: '🧬', fields: ['Cloned_Gene_Sequence', 'Cloned_Protein_Sequence'] },
        { title: 'Glycerol Stock Storage', icon: '🧊', fields: ['Glycerol_Stock_Tube_Label', 'GLycerol_Stock_Freezer', 'Glycerol_Stock_Rack', 'Glycerol_Stock_Box', 'Location_in_Box_GS'] },
        { title: 'DNA Storage', icon: '📦', fields: ['PLasmid_DNA_Label', 'DNA_Store_Freezer', 'DNA_Store_Rack', 'DNA_Store_Box_Detail'] },
        { title: 'Expression & Purification', icon: '🔬', fields: ['Protein_Purification_status'] },
    ],
    PRIMER: [
        { title: 'Basic Information', icon: '🔬', fields: ['Primer_Name', 'DNA_sequence', 'Purpose'] },
        { title: 'Binding Targets', icon: '🎯', fields: ['Binds_with_Phage_Bacteria_Plasmid', 'Phage', 'Bacteria', 'Plasmid'] },
        { title: 'Storage Location', icon: '📦', fields: ['Freezer', 'Freezer_Shelve', 'Box_detail', 'Location_in_Box'] },
    ],
};

// Relational dropdown fields
const FIELD_LOOKUPS = {
    Host_Bacteria: '/lookup/host-bacteria',
    Against_Species: '/lookup/species',
    WT_RECOMB: '/lookup/wild-type-recomb',
    GS_Freezer_Name: '/lookup/freezers',
    _4C_Fridge_Number: '/lookup/freezers',
    GS_Racks: '/lookup/racks',
    _4C_Rack_Number: '/lookup/racks',
    GS_Box_details: '/lookup/boxes',
    DNA_storage_Box_detail: '/lookup/freezers',
};

// Fields to completely hide - image/binary data or confusing internal-only columns
// Covers all known variants across ext_bacteriophages, ext_bacterial_strains, ext_plasmids, ext_primers_details
const HIDDEN_FIELDS = [
    // System / PK
    'id', 'ID', 'createdAt', 'updatedAt',
    // Image fields (all case variants seen in DB)
    'Expression_Picture', 'Purified_Protein_Picture',
    'Primer_Image', 'primer_image', 'Image', 'image', '2nd_image', '2ND_IMAGE',
    // File attachment fields
    'Attachment_File', 'attachment_file', 'File_Upload', 'file_upload', 'FILE_UPLOAD',
    // Any other blob/binary columns
    'Photo', 'photo', 'Picture', 'picture', 'Attachment', 'attachment',
];

const EXCLUDED_FROM_PATCH = [
    'id', 'ID', 'createdAt', 'updatedAt',
    'Expression_Picture', 'Purified_Protein_Picture',
    'Primer_Image', 'primer_image', 'Image', 'image', '2nd_image', '2ND_IMAGE',
    'Attachment_File', 'attachment_file', 'File_Upload', 'file_upload', 'FILE_UPLOAD',
    'Photo', 'photo', 'Picture', 'picture', 'Attachment', 'attachment',
];

// Long text fields rendered as textarea
const TEXTAREA_FIELDS = ['Characterization_details', 'Detail_of_Bacterial_Strain', 'Cloned_Gene_Sequence', 'Cloned_Protein_Sequence', 'DNA_sequence', 'Plaque_Morphology'];

// =============================================================================
const QuickEditModal = ({ asset, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mode, setMode] = useState('view');
    const [details, setDetails] = useState(null);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});
    const [displayValues, setDisplayValues] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => { if (asset) fetchDetails(); }, [asset]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/bio/detail/${asset.type.toUpperCase()}/${asset.id}`);
            if (res.data.success) {
                setDetails(res.data.data);
                setFormData(res.data.data);
                setDisplayValues(res.data.displayValues || {});
            }
        } catch (err) {
            setError('Failed to load record.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = Object.fromEntries(
                Object.entries(formData).filter(([key]) => !EXCLUDED_FROM_PATCH.includes(key))
            );
            await api.patch(`/bio/detail/${asset.type.toUpperCase()}/${asset.id}`, payload);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            setMode('view');
            await fetchDetails();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert('Save Failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type?.toUpperCase()) {
            case 'PHAGE':   return <Bug size={24} className="text-blue-400" />;
            case 'STRAIN':  return <Dna size={24} className="text-emerald-400" />;
            case 'PRIMER':  return <FileCode size={24} className="text-purple-400" />;
            case 'PLASMID': return <FlaskConical size={24} className="text-amber-400" />;
            default:        return <Database size={24} className="text-slate-400" />;
        }
    };

    const typeColor = {
        PHAGE:   { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', ring: 'focus:border-blue-500 focus:ring-blue-500/30' },
        STRAIN:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', ring: 'focus:border-emerald-500 focus:ring-emerald-500/30' },
        PRIMER:  { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', ring: 'focus:border-purple-500 focus:ring-purple-500/30' },
        PLASMID: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', ring: 'focus:border-amber-500 focus:ring-amber-500/30' },
    }[asset?.type?.toUpperCase()] || { bg: 'bg-slate-800', border: 'border-white/10', text: 'text-slate-400', ring: 'focus:border-slate-500' };

    const sections = FIELD_SECTIONS[asset?.type?.toUpperCase()] || [];

    // Build a flat list of fields that don't belong to any section (extra/custom fields)
    const sectionedFields = sections.flatMap(s => s.fields);
    const extraFields = Object.keys(details || {}).filter(k =>
        !sectionedFields.includes(k) && !HIDDEN_FIELDS.includes(k)
    );

    const renderField = (fieldKey) => {
        const value = formData[fieldKey] ?? '';
        const label = FIELD_LABELS[fieldKey] || fieldKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const isTextarea = TEXTAREA_FIELDS.includes(fieldKey);
        const hasLookup = FIELD_LOOKUPS[fieldKey];

        return (
            <div key={fieldKey} className="space-y-1.5 group">
                <label className={`text-[10px] font-black uppercase tracking-widest block pl-1 transition-colors ${mode === 'edit' ? `group-focus-within:${typeColor.text} text-slate-500` : 'text-slate-500'}`}>
                    {label}
                </label>
                {mode === 'view' ? (
                    <div className="px-4 py-3 bg-slate-900/50 border border-white/5 rounded-xl text-slate-200 text-sm min-h-[44px] flex items-start">
                        {isTextarea ? (
                            <span className="whitespace-pre-wrap">{displayValues[fieldKey] || value || <span className="text-slate-700 italic text-xs">Not recorded</span>}</span>
                        ) : (
                            displayValues[fieldKey] || value || <span className="text-slate-700 italic text-xs">Not recorded</span>
                        )}
                    </div>
                ) : hasLookup ? (
                    <RelationalSelect
                        label={label}
                        endpoint={hasLookup}
                        value={value}
                        onChange={(val) => setFormData({ ...formData, [fieldKey]: val })}
                    />
                ) : isTextarea ? (
                    <textarea
                        rows={3}
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                        className={`w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm outline-none ${typeColor.ring} transition-all shadow-inner resize-none`}
                        placeholder={`Enter ${label}...`}
                    />
                ) : (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
                        className={`w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-sm outline-none ${typeColor.ring} transition-all shadow-inner`}
                        placeholder={`Enter ${label}...`}
                    />
                )}
            </div>
        );
    };

    // Asset display name
    const displayName = details?.Bacteriophage_Name || details?.Strain_No || details?.Primer_Name || details?.Plasmid_Name || asset?.name || `Record #${asset?.id}`;

    if (!asset) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 24 }}
                className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Success Banner */}
                {saveSuccess && (
                    <div className="px-8 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-3">
                        <CheckCircle size={14} className="text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">Record updated successfully!</span>
                    </div>
                )}

                {/* Header */}
                <div className={`p-6 border-b border-white/5 flex items-center justify-between ${typeColor.bg} bg-opacity-30`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3.5 rounded-2xl ${typeColor.bg} border ${typeColor.border} shadow-inner`}>
                            {getTypeIcon(asset.type)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl font-black text-white tracking-tight">{displayName}</h2>
                                <span className={`px-2 py-0.5 ${typeColor.bg} border ${typeColor.border} rounded-lg text-[9px] font-black ${typeColor.text} uppercase tracking-widest`}>
                                    {asset.type?.toUpperCase()}
                                </span>
                                <span className="text-slate-600 text-[10px] font-mono">REG #{asset.id}</span>
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5">
                                {mode === 'edit' ? '✏️ Editing mode — make your changes and click Save' : 'View mode — click Edit Data to modify'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {mode === 'view' ? (
                            <button onClick={() => setMode('edit')}
                                className={`flex items-center gap-2 px-5 py-2 ${typeColor.bg} hover:opacity-80 ${typeColor.text} rounded-xl border ${typeColor.border} transition-all text-sm font-bold active:scale-95`}>
                                <Edit3 size={14} /> Edit Data
                            </button>
                        ) : (
                            <>
                                <button onClick={() => { setMode('view'); setFormData(details); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition-all text-sm font-bold active:scale-95">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all ml-1">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                <Loader2 className="text-emerald-400 opacity-40" size={40} />
                            </motion.div>
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading record data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
                            <AlertCircle className="text-rose-500/50" size={40} />
                            <p className="text-slate-300 font-bold">{error}</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Sectioned Fields */}
                            {sections.map((section) => {
                                // Only show fields that actually exist in this record
                                const visibleFields = section.fields.filter(f => f in (details || {}));
                                if (visibleFields.length === 0) return null;
                                return (
                                    <div key={section.title} className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
                                        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                                            <span className="text-base">{section.icon}</span>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{section.title}</h3>
                                        </div>
                                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {visibleFields.map(renderField)}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Extra / Custom Fields */}
                            {extraFields.length > 0 && (
                                <div className="bg-slate-900/60 border border-white/5 rounded-2xl overflow-hidden">
                                    <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                                        <span className="text-base">📋</span>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Additional Fields</h3>
                                    </div>
                                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {extraFields.map(renderField)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && (
                    <div className="px-6 py-3 bg-slate-950 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            <CheckCircle size={10} className="text-emerald-600" />
                            Live Database Record
                        </div>
                        {mode === 'edit' && (
                            <div className={`text-[10px] ${typeColor.text} font-black uppercase tracking-widest opacity-60 animate-pulse`}>
                                Unsaved changes
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default QuickEditModal;
