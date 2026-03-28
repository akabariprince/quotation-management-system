// src/pages/EmailLogs.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, FileText, Shield, Search, Download, CheckCircle, Clock,
  XCircle, RefreshCw, ChevronLeft, ChevronRight, Calendar, AlertCircle, Loader2, ArrowLeft,
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// ─── Types ───
interface EmailLog {
  id: string; toEmail: string; subject: string; type: string;
  referenceId: string | null; referenceType: string | null;
  status: 'sent' | 'failed'; errorMessage: string | null;
  sentBy: string | null; createdAt: string;
  sender?: { id: string; name: string; email: string };
}

interface PaginationMeta {
  currentPage: number; totalPages: number;
  totalCount: number; totalItems?: number; limit: number;
}

interface EmailStats {
  total: number; sent: number; failed: number;
  todayCount: number; byType: Array<{ type: string; count: string }>;
}

// ─── Type Config ───
const emailTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  login_otp: { label: 'Login OTP', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-primary' },
  master_activation_otp: { label: 'Master OTP', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-accent' },
  discount_otp: { label: 'Discount OTP', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-warning' },
  project_created: { label: 'Project Created', icon: <FileText className="h-3.5 w-3.5" />, color: 'text-blue-600' },
  project_sent: { label: 'Project Sent', icon: <Mail className="h-3.5 w-3.5" />, color: 'text-success' },
  project_revised: { label: 'Project Revised', icon: <FileText className="h-3.5 w-3.5" />, color: 'text-orange-600' },
  project_approved: { label: 'Project Approved', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-success' },
  project_status_update: { label: 'Status Update', icon: <RefreshCw className="h-3.5 w-3.5" />, color: 'text-indigo-600' },
  welcome: { label: 'Welcome', icon: <Mail className="h-3.5 w-3.5" />, color: 'text-emerald-600' },
  approved_notification: { label: 'Approved', icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-success' },
  rejected_notification: { label: 'Rejected', icon: <XCircle className="h-3.5 w-3.5" />, color: 'text-destructive' },
  otp: { label: 'Master OTP', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-accent' },
};

const getTypeInfo = (type: string) => emailTypeConfig[type] || { label: type, icon: <Mail className="h-3.5 w-3.5" />, color: 'text-muted-foreground' };

// ─── Skeletons ───
const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="enterprise-card p-3 flex items-center justify-between">
        <div><Skeleton className="h-3 w-20 mb-2" /><Skeleton className="h-6 w-12" /></div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    ))}
  </div>
);

const TableSkeletonComponent: React.FC = () => (
  <div className="enterprise-card overflow-hidden mt-1">
    <div className="table-container">
      <table className="enterprise-table">
        <thead><tr>{Array.from({ length: 6 }).map((_, i) => (<th key={i} className="px-3 py-1.5"><Skeleton className="h-3 w-16" /></th>))}</tr></thead>
        <tbody>{Array.from({ length: 8 }).map((_, i) => (
          <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="px-3 py-1"><Skeleton className="h-3 w-full" /></td>))}</tr>
        ))}</tbody>
      </table>
    </div>
  </div>
);

// ─── Main Component ───
const EmailLogs: React.FC = () => {
  const api = useApi();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

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
      if (res.success) { setLogs(res.data || []); setMeta(res.meta || null); }
    } catch (err) { console.error('Failed to fetch email logs:', err); }
  }, [page, searchTerm, filterType, filterStatus]);

  const fetchStats = useCallback(async () => {
    try { const res = await api.get('/email-logs/stats'); if (res.success) setStats(res.data); }
    catch (err) { console.error('Failed to fetch stats:', err); }
  }, []);

  useEffect(() => { const loadAll = async () => { setLoading(true); await Promise.all([fetchLogs(), fetchStats()]); setLoading(false); }; loadAll(); }, []);
  useEffect(() => { if (!loading) fetchLogs(); }, [page, searchTerm, filterType, filterStatus]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleRefresh = async () => { setLoading(true); await Promise.all([fetchLogs(), fetchStats()]); setLoading(false); toast.success('Refreshed'); };

  const handleExport = () => {
    const csvHeaders = 'Date,Type,Subject,Sent To,Status\n';
    const csvRows = logs.map((log) => `"${formatDate(log.createdAt)}","${getTypeInfo(log.type).label}","${log.subject}","${log.toEmail}","${log.status}"`).join('\n');
    const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url); toast.success('Email logs exported');
  };

  const totalCount = meta?.totalCount || meta?.totalItems || 0;

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between py-1">
          <div><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-48 mt-1" /></div>
          <Skeleton className="h-7 w-20 rounded" />
        </div>
        <StatsSkeleton />
        <div className="enterprise-card p-2 mt-1">
          <div className="flex flex-col sm:flex-row gap-1.5">
            <Skeleton className="h-7 flex-1 rounded" />
            <Skeleton className="h-7 w-32 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
          </div>
        </div>
        <TableSkeletonComponent />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-sm font-semibold leading-none">Email Activity Log</h1>
          <p className="text-muted-foreground text-xs">Audit trail of all system emails</p>
        </div>
        <div className="flex gap-1">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-1 h-7 text-xs px-2" size="sm">
              <ArrowLeft className="h-3 w-3" /><span className="hidden sm:inline text-white">Back to Dashboard</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs px-2" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3" /><span className="hidden sm:inline text-white">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs px-2" onClick={handleExport}>
            <Download className="h-3 w-3" /><span className="hidden sm:inline text-white">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards — icon right, label+value left */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-1">
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total Emails</p>
            <p className="text-lg font-bold text-foreground">{stats?.total || 0}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-accent" />
          </div>
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Successfully Sent</p>
            <p className="text-lg font-bold text-foreground">{stats?.sent || 0}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-lg font-bold text-foreground">{stats?.failed || 0}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Sent Today</p>
            <p className="text-lg font-bold text-foreground">{stats?.todayCount || 0}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="enterprise-card p-2 mt-1">
        <div className="flex flex-col sm:flex-row items-center gap-1.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by subject, email..." value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-7 h-7 text-xs" />
          </div>
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[130px] h-7 text-xs px-2"><SelectValue placeholder="Filter by type" /></SelectTrigger>
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
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[110px] h-7 text-xs px-2"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="enterprise-card overflow-hidden mt-1">
        <div className="table-container">
          <table className="enterprise-table w-full">
            <thead>
              <tr>
                <th className="px-3 py-1.5 text-xs">Date & Time</th>
                <th className="px-3 py-1.5 text-xs">Type</th>
                <th className="hidden sm:table-cell px-3 py-1.5 text-xs">Subject</th>
                <th className="hidden md:table-cell px-3 py-1.5 text-xs">Sent To</th>
                <th className="hidden lg:table-cell px-3 py-1.5 text-xs">Sent By</th>
                <th className="px-3 py-1.5 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                    <Mail className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    No email logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const typeInfo = getTypeInfo(log.type);
                  return (
                    <tr key={log.id} className="group hover:bg-muted/50">
                      <td className="px-3 py-1 text-muted-foreground whitespace-nowrap text-sm">{formatDate(log.createdAt)}</td>
                      <td className="px-3 py-1">
                        <div className={`flex items-center gap-1 ${typeInfo.color}`}>
                          {typeInfo.icon}
                          <span className="text-sm font-medium hidden sm:inline">{typeInfo.label}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-3 py-1 font-medium max-w-[220px] truncate text-sm">{log.subject}</td>
                      <td className="hidden md:table-cell px-3 py-1 text-muted-foreground text-sm">{log.toEmail}</td>
                      <td className="hidden lg:table-cell px-3 py-1 text-muted-foreground text-sm">{log.sender?.name || '—'}</td>
                      <td className="px-3 py-1">
                        {log.status === 'sent' ? (
                          <span className="badge-success"><CheckCircle className="h-3 w-3" /> Sent</span>
                        ) : (
                          <span className="badge-error" title={log.errorMessage || undefined}>
                            <XCircle className="h-3 w-3" /> Failed
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

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {logs.length} of {totalCount} • Page {meta.currentPage} of {meta.totalPages}
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-6 text-xs px-2" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-xs px-2" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailLogs;