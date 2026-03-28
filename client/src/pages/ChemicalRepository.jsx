import React from 'react';
import GenericModule from '../components/GenericModule';
import GHSPictogram from '../components/GHSPictogram';
import { Beaker, FileText, AlertTriangle } from 'lucide-react';

const ChemicalRepository = () => {
    return (
        <GenericModule
            title="Chemical Inventory"
            type="Chemical"
            endpoint="/inventory"
            icon={Beaker}
            columns={[
                { label: 'Barcode', key: 'barcode' },
                { label: 'Name', key: 'name' },
                {
                    label: 'Safety (GHS)',
                    key: 'ghs_hazards',
                    render: (val) => <GHSPictogram codes={val} size={18} />
                },
                {
                    label: 'Signal',
                    key: 'signal_word',
                    render: (val) => (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${val === 'Danger' ? 'bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                val === 'Warning' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                                    'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}>
                            {val}
                        </span>
                    )
                },
                {
                    label: 'Volume',
                    key: 'current_volume',
                    render: (val, item) => (
                        <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold ${val <= item.threshold_limit ? 'text-red-500' : 'text-emerald-400'}`}>
                                {val} {item.unit}
                            </span>
                            {val <= item.threshold_limit && (
                                <AlertTriangle size={12} className="text-red-500 animate-pulse" />
                            )}
                        </div>
                    )
                },
                {
                    label: 'SDS',
                    key: 'sds_url',
                    render: (val) => val ? (
                        <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors flex items-center justify-center w-fit"
                            title="View Safety Data Sheet"
                        >
                            <FileText size={16} />
                        </a>
                    ) : (
                        <span className="text-slate-600 text-xs italic">N/A</span>
                    )
                }
            ]}
        />
    );
};

export default ChemicalRepository;
