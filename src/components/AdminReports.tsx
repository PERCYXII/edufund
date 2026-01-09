import React, { useMemo, useState } from 'react';
import {
    TrendingUp,
    Download,
    DollarSign,
    Users,
    Calendar,
    Search,
    X
} from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0
    }).format(amount);
};

interface AdminReportsProps {
    transactions: any[];
    stats: {
        totalFunded: number;
        activeCampaigns: number;
        totalUniversities: number;
    };
}

const AdminReports: React.FC<AdminReportsProps> = ({ transactions, stats }) => {

    // Filter States
    const [monthFilter, setMonthFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [universityFilter, setUniversityFilter] = useState('');
    const [studentNumberFilter, setStudentNumberFilter] = useState('');

    // Calculate ACTUAL Platform Revenue (Donations with no campaign_id)
    const platformRevenue = useMemo(() => {
        return transactions
            .filter(t => !t.campaign_id || t.campaign_id === null)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
    }, [transactions]);

    // Calculate Monthly Trends (simplified)
    const monthlyStats = useMemo(() => {
        const months: Record<string, number> = {};
        transactions.forEach(t => {
            const date = new Date(t.created_at);
            const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            months[key] = (months[key] || 0) + (t.amount || 0);
        });
        return Object.entries(months).slice(-6); // Last 6 months
    }, [transactions]);

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const txDate = new Date(t.created_at);
            const txMonthShort = txDate.toISOString().slice(0, 7); // e.g., "2026-01"

            const matchesMonth = monthFilter ? txMonthShort === monthFilter : true;

            // Campaign Type matches
            const matchesType = typeFilter ? (t.campaign?.type || '').toLowerCase() === typeFilter.toLowerCase() : true;

            // University matches (fuzzy search)
            const uniName = t.campaign?.student?.university?.name || '';
            const matchesUni = universityFilter ? uniName.toLowerCase().includes(universityFilter.toLowerCase()) : true;

            // Student Number matches (fuzzy search)
            const studentNum = t.campaign?.student?.student_number || '';
            const matchesStudentNum = studentNumberFilter ? studentNum.toLowerCase().includes(studentNumberFilter.toLowerCase()) : true;

            return matchesMonth && matchesType && matchesUni && matchesStudentNum;
        });
    }, [transactions, monthFilter, typeFilter, universityFilter, studentNumberFilter]);

    const handleExport = () => {
        // Updated CSV Export with new fields
        const headers = ["Date", "Donor", "Campaign", "Type", "University", "Student Number", "Amount", "Status"];
        const rows = filteredTransactions.map(t => [
            new Date(t.created_at).toLocaleDateString(),
            t.guest_name || 'Anonymous',
            t.campaign?.title || 'Platform Donation',
            t.campaign?.type || 'N/A',
            t.campaign?.student?.university?.name || 'N/A',
            t.campaign?.student?.student_number || 'N/A',
            t.amount,
            t.status
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "edufund_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearFilters = () => {
        setMonthFilter('');
        setTypeFilter('');
        setUniversityFilter('');
        setStudentNumberFilter('');
    };

    return (
        <div className="admin-content animate-fade-in">
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="admin-page-title">Platform Reports</h2>
                    <p className="admin-page-subtitle">Overview of platform performance and financial statistics</p>
                </div>
                <button
                    onClick={handleExport}
                    className="btn btn-primary"
                >
                    <Download size={18} />
                    Export Data
                </button>
            </div>

            {/* Key Metrics Cards */}
            <div className="admin-stats-grid mb-8">
                <div className="admin-stat-card success">
                    <div className="admin-stat-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-label">Total Volume</span>
                        <span className="admin-stat-value">{formatCurrency(stats.totalFunded)}</span>
                    </div>
                </div>

                <div className="admin-stat-card info">
                    <div className="admin-stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-label">Platform Support (Donations)</span>
                        <span className="admin-stat-value">{formatCurrency(platformRevenue)}</span>
                        <div className="stat-trend positive">
                            <TrendingUp size={14} />
                            <span>100% Voluntary</span>
                        </div>
                    </div>
                </div>

                <div className="admin-stat-card primary">
                    <div className="admin-stat-icon">
                        <Users size={24} />
                    </div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-label">Active Campaigns</span>
                        <span className="admin-stat-value">{stats.activeCampaigns}</span>
                    </div>
                </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="admin-section mb-8">
                <div className="admin-section-title flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    Monthly Donation Volume
                </div>

                <div className="p-6">
                    <div className="h-64 flex items-end justify-between gap-4">
                        {monthlyStats.length > 0 ? monthlyStats.map(([month, amount], idx) => {
                            const max = Math.max(...monthlyStats.map(([, a]) => a)) || 1;
                            const height = (amount / max) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="tooltip opacity-0 group-hover:opacity-100 absolute -mt-8 bg-gray-800 text-white text-xs py-1 px-2 rounded transition-opacity pointer-events-none z-10">
                                        {formatCurrency(amount)}
                                    </div>
                                    <div
                                        className="w-full bg-primary-100 rounded-t-lg hover:bg-primary-200 transition-colors relative"
                                        style={{ height: `${height}%`, minHeight: '4px', backgroundColor: 'var(--color-primary-100)' }}
                                    >
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium rotate-0 truncate w-full text-center">
                                        {month}
                                    </span>
                                </div>
                            );
                        }) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No data for charts yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="admin-section">
                <div className="admin-section-title flex justify-between items-center flex-wrap gap-4">
                    <span>Transaction History</span>
                    {(monthFilter || typeFilter || universityFilter || studentNumberFilter) && (
                        <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                            <X size={14} /> Clear Filters
                        </button>
                    )}
                </div>

                {/* Filters Toolbar */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 border-b border-gray-100">
                    <div className="form-group mb-0">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Month</label>
                        <input
                            type="month"
                            className="form-input w-full text-sm"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-0">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Campaign Type</label>
                        <select
                            className="form-input w-full text-sm"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="standard">Standard</option>
                            <option value="quick_assist">Quick Assist</option>
                        </select>
                    </div>
                    <div className="form-group mb-0">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">University</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search university..."
                                className="form-input w-full text-sm pl-8"
                                value={universityFilter}
                                onChange={(e) => setUniversityFilter(e.target.value)}
                            />
                            <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                        </div>
                    </div>
                    <div className="form-group mb-0">
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Student Number</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search student #..."
                                className="form-input w-full text-sm pl-8"
                                value={studentNumberFilter}
                                onChange={(e) => setStudentNumberFilter(e.target.value)}
                            />
                            <Search size={14} className="absolute left-2.5 top-3 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="admin-table-wrapper max-h-[600px] overflow-y-auto">
                    <table className="admin-table sticky-header">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Donor</th>
                                <th>Campaign</th>
                                <th>Type</th>
                                <th>University</th>
                                <th>Student #</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t: any) => (
                                    <tr key={t.id}>
                                        <td className="text-gray-600 whitespace-nowrap">
                                            {new Date(t.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="font-semibold text-gray-800">
                                            {t.guest_name || (t.is_anonymous ? 'Anonymous' : 'Unknown')}
                                        </td>
                                        <td className="text-gray-600 truncate max-w-xs" title={t.campaign?.title}>
                                            {t.campaign?.title || 'Platform Donation'}
                                        </td>
                                        <td className="text-gray-600 text-sm">
                                            {t.campaign?.type ? (
                                                <span className="capitalize">{t.campaign.type.replace('_', ' ')}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="text-gray-600 text-sm">
                                            {t.campaign?.student?.university?.name || '-'}
                                        </td>
                                        <td className="text-gray-600 text-sm font-mono">
                                            {t.campaign?.student?.student_number || '-'}
                                        </td>
                                        <td className="font-bold text-gray-900" style={{ textAlign: 'right' }}>
                                            {formatCurrency(t.amount)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === 'received' || t.status === 'completed'
                                                ? 'bg-green-50 text-green-700 border border-green-200'
                                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                                }`} style={{
                                                    backgroundColor: t.status === 'received' || t.status === 'completed' ? 'var(--color-success-50)' : 'var(--color-warning-50)',
                                                    color: t.status === 'received' || t.status === 'completed' ? 'var(--color-success-700)' : 'var(--color-warning-700)'
                                                }}>
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ padding: 'var(--spacing-8)', textAlign: 'center', color: 'var(--color-gray-500)' }}>
                                        No transactions match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-gray-50 text-xs text-gray-500 border-t border-gray-100 flex justify-between">
                    <span>Showing {filteredTransactions.length} transaction(s)</span>
                    {filteredTransactions.length > 100 && <span>Scroll for more</span>}
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
