// src/pages/EmailLogs.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  FileText,
  Shield,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────

interface EmailLog {
  id: string;
  toEmail: string;
  subject: string;
  type: string;
  referenceId: string | null;
  referenceType: string | null;
  status: 'sent' | 'failed';
  errorMessage: string | null;
  sentBy: string | null;
  createdAt: string;
  sender?: { id: string; name: string; email: string };
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  totalItems?: number;
  limit: number;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  todayCount: number;
  byType: Array<{ type: string; count: string }>;
}

// ─── Type Config ────────────────────────────────────────────────────────────

const emailTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  login_otp: { label: 'Login OTP', icon: <Shield className="h-4 w-4" />, color: 'text-primary' },
  master_activation_otp: { label: 'Master OTP', icon: <Shield className="h-4 w-4" />, color: 'text-accent' },
  discount_otp: { label: 'Discount OTP', icon: <Shield className="h-4 w-4" />, color: 'text-warning' },
  project_created: { label: 'Project Created', icon: <FileText className="h-4 w-4" />, color: 'text-blue-600' },
  project_sent: { label: 'Project Sent', icon: <Mail className="h-4 w-4" />, color: 'text-success' },
  project_revised: { label: 'Project Revised', icon: <FileText className="h-4 w-4" />, color: 'text-orange-600' },
  project_approved: { label: 'Project Approved', icon: <CheckCircle className="h-4 w-4" />, color: 'text-success' },
  project_status_update: { label: 'Status Update', icon: <RefreshCw className="h-4 w-4" />, color: 'text-indigo-600' },
  welcome: { label: 'Welcome', icon: <Mail className="h-4 w-4" />, color: 'text-emerald-600' },
  approved_notification: { label: 'Approved', icon: <CheckCircle className="h-4 w-4" />, color: 'text-success' },
  rejected_notification: { label: 'Rejected', icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  otp: { label: 'Master OTP', icon: <Shield className="h-4 w-4" />, color: 'text-accent' }
};

const getTypeInfo = (type: string) =>
  emailTypeConfig[type] || { label: type, icon: <Mail className="h-4 w-4" />, color: 'text-muted-foreground' };

// ─── Skeletons ──────────────────────────────────────────────────────────────

const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="stat-card">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-8 w-16 mt-3" />
        <Skeleton className="h-4 w-28 mt-2" />
      </div>
    ))}
  </div>
);

const TableSkeleton: React.FC = () => (
  <div className="enterprise-card overflow-hidden mt-4">
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i}><Skeleton className="h-4 w-20" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 6 }).map((_, j) => (
                <td key={j}><Skeleton className="h-4 w-full" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const EmailLogs: React.FC = () => {
  const api = useApi();

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

  // ─── Fetch ──────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      params.append('sortBy', 'createdAt');
      params.append('sortOrder', 'DESC');
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await api.get(`/email-logs?${params.toString()}`);
      if (res.success) {
        setLogs(res.data || []);
        setMeta(res.meta || null);
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    }
  }, [page, searchTerm, filterType, filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/email-logs/stats');
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchStats()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (!loading) fetchLogs();
  }, [page, searchTerm, filterType, filterStatus]);

  // ─── Helpers ────────────────────────────────────────────────────────

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchLogs(), fetchStats()]);
    setLoading(false);
    toast.success('Refreshed');
  };

  const handleExport = () => {
    // Build CSV from current logs
    const csvHeaders = 'Date,Type,Subject,Sent To,Status\n';
    const csvRows = logs
      .map(
        (log) =>
          `"${formatDate(log.createdAt)}","${getTypeInfo(log.type).label}","${log.subject}","${log.toEmail}","${log.status}"`
      )
      .join('\n');

    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Email logs exported');
  };

  const totalCount = meta?.totalCount || meta?.totalItems || 0;

  // ─── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-56 mt-2" />
          </div>
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <StatsSkeleton />
        <div className="enterprise-card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-11 flex-1 rounded-lg" />
            <Skeleton className="h-11 w-44 rounded-lg" />
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Email Activity Log</h1>
          <p className="text-muted-foreground mt-1">
            Audit trail of all system emails
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2" size="sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <Mail className="h-5 w-5 text-accent" />
          <p className="stat-value">{stats?.total || 0}</p>
          <p className="stat-label">Total Emails</p>
        </div>
        <div className="stat-card">
          <CheckCircle className="h-5 w-5 text-success" />
          <p className="stat-value">{stats?.sent || 0}</p>
          <p className="stat-label">Successfully Sent</p>
        </div>
        <div className="stat-card">
          <XCircle className="h-5 w-5 text-destructive" />
          <p className="stat-value">{stats?.failed || 0}</p>
          <p className="stat-label">Failed</p>
        </div>
        <div className="stat-card">
          <Calendar className="h-5 w-5 text-primary" />
          <p className="stat-value">{stats?.todayCount || 0}</p>
          <p className="stat-label">Sent Today</p>
        </div>
      </div>

      {/* Filters */}
      <div className="enterprise-card p-4 mt-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by subject, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-11"
            />
          </div>
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="login_otp">Login OTP</SelectItem>
              <SelectItem value="master_activation_otp">Master OTP</SelectItem>
              <SelectItem value="discount_otp">Discount OTP</SelectItem>
              <SelectItem value="project_created">Project Created</SelectItem>
              <SelectItem value="project_sent">Project Sent</SelectItem>
              <SelectItem value="project_revised">Project Revised</SelectItem>
              <SelectItem value="project_approved">Project Approved</SelectItem>
              <SelectItem value="welcome">Welcome</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="enterprise-card overflow-hidden mt-4">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th className="hidden sm:table-cell">Subject</th>
                <th className="hidden md:table-cell">Sent To</th>
                <th className="hidden lg:table-cell">Sent By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-12">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No email logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const typeInfo = getTypeInfo(log.type);
                  return (
                    <tr key={log.id} className="group">
                      <td className="text-muted-foreground whitespace-nowrap text-sm">
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                          {typeInfo.icon}
                          <span className="text-sm font-medium hidden sm:inline">
                            {typeInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell font-medium max-w-[220px] truncate text-sm">
                        {log.subject}
                      </td>
                      <td className="hidden md:table-cell text-muted-foreground text-sm">
                        {log.toEmail}
                      </td>
                      <td className="hidden lg:table-cell text-muted-foreground text-sm">
                        {log.sender?.name || '—'}
                      </td>
                      <td>
                        {log.status === 'sent' ? (
                          <span className="badge-success">
                            <CheckCircle className="h-3 w-3" />
                            Sent
                          </span>
                        ) : (
                          <span className="badge-error" title={log.errorMessage || undefined}>
                            <XCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {logs.length} of {totalCount} •
              Page {meta.currentPage} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailLogs;