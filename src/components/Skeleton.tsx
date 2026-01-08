import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = ''
}) => {
    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={`skeleton skeleton-${variant} ${className}`}
            style={style}
        />
    );
};

// Campaign Card Skeleton
export const CampaignCardSkeleton: React.FC = () => (
    <div className="campaign-card-skeleton">
        <div className="skeleton-banner skeleton" />
        <div className="skeleton-body">
            <div className="skeleton-header">
                <Skeleton variant="text" width="70%" height={24} />
                <Skeleton variant="circular" width={20} height={20} />
            </div>
            <Skeleton variant="text" width="50%" height={16} className="mt-2" />
            <Skeleton variant="text" width="60%" height={14} className="mt-1" />
            <div className="skeleton-story">
                <Skeleton variant="text" width="100%" height={14} />
                <Skeleton variant="text" width="85%" height={14} />
            </div>
            <div className="skeleton-progress">
                <div className="skeleton-amounts">
                    <Skeleton variant="text" width={80} height={18} />
                    <Skeleton variant="text" width={100} height={14} />
                </div>
                <Skeleton variant="rounded" width="100%" height={8} />
            </div>
            <div className="skeleton-stats">
                <Skeleton variant="text" width={60} height={16} />
                <Skeleton variant="text" width={40} height={16} />
            </div>
        </div>
    </div>
);

// Stats Grid Skeleton
export const StatsGridSkeleton: React.FC = () => (
    <div className="stats-grid-skeleton">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card-skeleton">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="stat-text-skeleton">
                    <Skeleton variant="text" width={80} height={28} />
                    <Skeleton variant="text" width={100} height={14} />
                </div>
            </div>
        ))}
    </div>
);

// Campaign Detail Skeleton
export const CampaignDetailSkeleton: React.FC = () => (
    <div className="campaign-detail-skeleton">
        <div className="detail-left">
            <Skeleton variant="rounded" width="100%" height={400} className="detail-image-skeleton" />
            <div className="detail-tabs-skeleton">
                <Skeleton variant="rounded" width={100} height={40} />
                <Skeleton variant="rounded" width={100} height={40} />
                <Skeleton variant="rounded" width={100} height={40} />
            </div>
            <div className="detail-content-skeleton">
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="90%" height={20} />
            </div>
        </div>
        <div className="detail-right">
            <div className="detail-card-skeleton">
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="rounded" width="100%" height={12} className="mt-4" />
                <div className="detail-amounts-skeleton">
                    <Skeleton variant="text" width={100} height={24} />
                    <Skeleton variant="text" width={80} height={16} />
                </div>
                <Skeleton variant="rounded" width="100%" height={48} className="mt-4" />
                <Skeleton variant="rounded" width="100%" height={48} className="mt-2" />
            </div>
        </div>
    </div>
);

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
    <tr className="table-row-skeleton">
        {Array(cols).fill(0).map((_, i) => (
            <td key={i}>
                <Skeleton variant="text" width="80%" height={18} />
            </td>
        ))}
    </tr>
);

// Dashboard Card Skeleton
export const DashboardCardSkeleton: React.FC = () => (
    <div className="dashboard-card-skeleton">
        <Skeleton variant="text" width="60%" height={24} className="mb-4" />
        <div className="dashboard-card-content">
            <Skeleton variant="rectangular" width="100%" height={200} />
        </div>
    </div>
);

export default Skeleton;
