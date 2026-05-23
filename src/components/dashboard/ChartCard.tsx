import { ReactNode } from 'react';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function ChartCard({ title, subtitle, children, action, className = '' }: ChartCardProps) {
    return (
        <div className={`bg-surface rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow duration-300 ${className}`}>
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-base font-bold text-foreground">{title}</h3>
                    {subtitle && (
                        <p className="text-sm text-muted mt-0.5">{subtitle}</p>
                    )}
                </div>
                {action}
            </div>
            <div>{children}</div>
        </div>
    );
}
