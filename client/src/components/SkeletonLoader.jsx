import React from 'react';

const SkeletonLoader = ({ rows = 5 }) => {
    return (
        <div className="w-full animate-pulse space-y-4">
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex gap-4">
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonLoader;
