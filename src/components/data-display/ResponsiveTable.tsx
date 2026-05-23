import React from 'react';

export interface ResponsiveTableProps<T> {
    data: T[];
    columns: {
        header: string;
        accessor: (row: T) => React.ReactNode;
        className?: string; // Optional width/alignment overrides
        skeleton?: React.ReactNode;
    }[];
    keyExtractor: (row: T) => string;
    renderMobileCard: (row: T) => React.ReactNode;
    renderMobileSkeleton?: () => React.ReactNode;
    emptyState?: React.ReactNode;
    loading?: boolean;
}

export function ResponsiveTable<T>({
    data,
    columns,
    keyExtractor,
    renderMobileCard,
    renderMobileSkeleton,
    emptyState = (
        <div className="px-8 py-16 text-center">
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No data available</p>
        </div>
    ),
    loading = false
}: ResponsiveTableProps<T>) {

    if (loading) {
        return (
            <div className="w-full">
                {/* Desktop skeleton */}
                <div className="hidden md:block bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50">
                                    {columns.map((col, i) => (
                                        <th key={i} className={`px-8 py-5 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] ${col.className || ''}`}>
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                                {Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        {columns.map((col, j) => (
                                            <td key={j} className={`px-8 py-5 ${col.className || ''}`}>
                                                {col.skeleton || <div className="animate-pulse h-4 bg-slate-100 dark:bg-slate-800/60 rounded-full w-3/4" />}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile skeleton */}
                <div className="md:hidden flex flex-col gap-4">
                    {renderMobileSkeleton ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i}>{renderMobileSkeleton()}</div>
                        ))
                    ) : (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl dark:shadow-black/30 overflow-hidden p-6 animate-pulse space-y-3">
                                <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded-full w-1/2" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-full w-3/4" />
                                <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-full w-1/3" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden">
                {emptyState}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50">
                                {columns.map((col, i) => (
                                    <th key={i} className={`px-8 py-5 text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em] ${col.className || ''}`}>
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 dark:divide-slate-700/50">
                            {data.map((row) => (
                                <tr key={keyExtractor(row)} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    {columns.map((col, i) => (
                                        <td key={i} className={`px-8 py-5 ${col.className || ''}`}>
                                            {col.accessor(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4">
                {data.map((row) => (
                    <div key={keyExtractor(row)} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/30 overflow-hidden">
                        {renderMobileCard(row)}
                    </div>
                ))}
            </div>
        </div>
    );
}
