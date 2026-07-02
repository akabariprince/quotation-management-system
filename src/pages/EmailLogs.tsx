import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { formatISTDateTimeWithLabel } from "@/utils/time";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface NotificationLog {
  id: string;
  channel: "email" | "whatsapp";
  recipient: string;
  subject: string;
  type: string;
  status: "queued" | "pending" | "sent" | "delivered" | "read" | "failed";
  errorMessage: string | null;
  providerStatus?: string | null;
  createdAt: string;
  sender?: { id: string; name: string; email: string };
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  todayCount: number;
}

const PageSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <Skeleton className="h-5 w-56" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Skeleton key={idx} className="h-20 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-12 rounded-lg" />
    <Skeleton className="h-80 rounded-lg" />
  </div>
);

const typeOptions = [
  "customer_otp_verification",
  "discount_approval",
  "project_quotation",
  "login_notification",
  "master_data_change",
  "admin_notification",
];

const formatDate = (value: string) => formatISTDateTimeWithLabel(value);

const statusBadgeClass = (status: NotificationLog["status"]) => {
  if (status === "failed") return "badge-error";
  if (status === "queued" || status === "pending") return "badge-warning";
  return "badge-success";
};

const EmailLogs: React.FC = () => {
  const api = useApi();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [channel, setChannel] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    if (searchTerm) params.append("search", searchTerm);
    if (channel !== "all") params.append("channel", channel);
    if (type !== "all") params.append("type", type);
    if (status !== "all") params.append("status", status);

    const res = await api.get(`/email-logs?${params.toString()}`);
    setLogs(res.data || []);
    setMeta(res.meta || null);
  }, [api, channel, page, searchTerm, status, type]);

  const fetchStats = useCallback(async () => {
    const res = await api.get("/email-logs/stats");
    setStats(res.data || null);
  }, [api]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchLogs(), fetchStats()]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading) fetchLogs();
  }, [fetchLogs, loading]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLogs(), fetchStats()]);
      toast.success("Notification logs refreshed");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const header = "Date,Channel,Type,Recipient,Status,Subject\n";
    const rows = logs
      .map(
        (log) =>
          `"${formatDate(log.createdAt)}","${log.channel}","${log.type}","${log.recipient}","${log.status}","${log.subject}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `notification-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-sm font-semibold leading-none">
            Notification Activity Log
          </h1>
          <p className="text-muted-foreground text-xs">
            Email and WhatsApp delivery history
          </p>
        </div>
        <div className="flex gap-1">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-1 h-7 text-xs px-2" size="sm">
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline text-white">Back to Dashboard</span>
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs px-2" onClick={handleRefresh}>
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline text-white">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 h-7 text-xs px-2" onClick={handleExport}>
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline text-white">Export</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-1 lg:grid-cols-4">
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{stats?.total || 0}</p>
          </div>
          <Mail className="h-4 w-4 text-accent" />
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Successful</p>
            <p className="text-lg font-bold">{stats?.sent || 0}</p>
          </div>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-lg font-bold">{stats?.failed || 0}</p>
          </div>
          <XCircle className="h-4 w-4 text-red-600" />
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="text-lg font-bold">{stats?.todayCount || 0}</p>
          </div>
          <Calendar className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="enterprise-card p-2 mt-1">
        <div className="flex flex-col gap-1.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search subject or recipient..."
              className="pl-7 h-7 text-xs"
            />
          </div>
          <Select value={channel} onValueChange={(value) => { setChannel(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[120px] h-7 text-xs px-2">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[170px] h-7 text-xs px-2">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {typeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[120px] h-7 text-xs px-2">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="enterprise-card overflow-hidden mt-1">
        <div className="table-container">
          <table className="enterprise-table w-full">
            <thead>
              <tr>
                <th className="px-3 py-1.5 text-xs">Date</th>
                <th className="px-3 py-1.5 text-xs">Channel</th>
                <th className="px-3 py-1.5 text-xs">Type</th>
                <th className="hidden md:table-cell px-3 py-1.5 text-xs">Recipient</th>
                <th className="hidden lg:table-cell px-3 py-1.5 text-xs">Sent By</th>
                <th className="px-3 py-1.5 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No notification logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-3 py-1 text-sm">{formatDate(log.createdAt)}</td>
                    <td className="px-3 py-1 text-sm">
                      <span className="inline-flex items-center gap-1">
                        {log.channel === "whatsapp" ? (
                          <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 text-accent" />
                        )}
                        {log.channel}
                      </span>
                    </td>
                    <td className="px-3 py-1 text-sm font-medium">{log.type}</td>
                    <td className="hidden md:table-cell px-3 py-1 text-sm">{log.recipient}</td>
                    <td className="hidden lg:table-cell px-3 py-1 text-sm">{log.sender?.name || "—"}</td>
                    <td className="px-3 py-1 text-sm">
                      <span className={statusBadgeClass(log.status)}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
            <p className="text-xs text-muted-foreground">
              Page {meta.currentPage} of {meta.totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-xs"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((prev) => prev + 1)}
              >
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
