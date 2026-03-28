import React from 'react';
import {
    Flame,
    Skull,
    AlertOctagon,
    Biohazard,
    Wind,
    Zap,
    Trees,
    Droplet,
    Dna
} from 'lucide-react';

const PICTOGRAM_MAP = {
    'GHS01': { name: 'Explosive', icon: AlertOctagon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    'GHS02': { name: 'Flammable', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    'GHS03': { name: 'Oxidizing', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    'GHS04': { name: 'Compressed Gas', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    'GHS05': { name: 'Corrosive', icon: Droplet, color: 'text-slate-400', bg: 'bg-slate-400/10' },
    'GHS06': { name: 'Toxic', icon: Skull, color: 'text-slate-900', bg: 'bg-slate-900/10' },
    'GHS07': { name: 'Irritant', icon: AlertOctagon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    'GHS08': { name: 'Health Hazard', icon: Dna, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    'GHS09': { name: 'Environmental', icon: Trees, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

const GHSPictogram = ({ codes = [], size = 24, showLabel = false }) => {
    if (!codes || codes.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {codes.map(code => {
                const config = PICTOGRAM_MAP[code];
                if (!config) return null;
                const Icon = config.icon;

                return (
                    <div
                        key={code}
                        className={`group relative flex items-center gap-2 p-1.5 rounded-lg border border-white/5 ${config.bg} transition-all hover:scale-105`}
                        title={config.name}
                    >
                        <Icon size={size} className={config.color} />
                        {showLabel && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                                {config.name}
                            </span>
                        )}

                        {/* Tooltip */}
                        {!showLabel && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
                                {config.name}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GHSPictogram;
