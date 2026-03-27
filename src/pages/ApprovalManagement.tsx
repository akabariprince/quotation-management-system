// src/pages/ApprovalManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  Clock,
  Shield,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertCircle,
  KeyRound,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Link } from "react-router-dom";

// ─── Types ──────────────────────────────────────────────────────────────────

interface OTPLog {
  id: string;
  type: "login" | "discount" | "master_activation";
  entityId: string | null;
  entityType: string | null;
  entityName: string | null;
  email: string;
  status: "pending" | "approved" | "expired";
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  approvedAt: string | null;
  createdAt: string;
  requestedBy: string | null;
  approvedBy: string | null;
  requester?: { id: string; name: string; email: string } | null;
  approver?: { id: string; name: string; email: string } | null;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  totalItems?: number;
  limit: number;
}

interface Stats {
  pending: number;
  approvedToday: number;
  expiredToday: number;
  total: number;
}

// ─── Skeletons ──────────────────────────────────────────────────────────────

const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="stat-card">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-8 w-16 mt-3" />
        <Skeleton className="h-4 w-28 mt-2" />
      </div>
    ))}
  </div>
);

const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="enterprise-card overflow-hidden">
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            {Array.from({ length: 7 }).map((_, i) => (
              <th key={i}>
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 7 }).map((_, j) => (
                <td key={j}>
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── OTP Verify Modal (for non-admin) ───────────────────────────────────────

const OTPVerifyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => void;
  loading: boolean;
  title: string;
  description: string;
}> = ({ isOpen, onClose, onVerify, loading, title, description }) => {
  const [otp, setOtp] = useState("");
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setOtp("");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = otp.split("");
    newOtp[index] = value;
    const joined = newOtp.join("").slice(0, 6);
    setOtp(joined);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otp.length === 6) {
      onVerify(otp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    setOtp(pasted);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-accent" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[i] || ""}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="otp-input"
              disabled={loading}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 btn-accent"
            onClick={() => onVerify(otp)}
            disabled={otp.length !== 6 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Verify & Approve
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Reject Modal ───────────────────────────────────────────────────────────

const RejectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  loading: boolean;
  itemName: string;
}> = ({ isOpen, onClose, onReject, loading, itemName }) => {
  const [reason, setReason] = useState("");

  React.useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-center">Reject Request</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Reject <strong>{itemName}</strong>?
          </p>
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for rejection..."
            className="input-field min-h-[80px] resize-none"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => onReject(reason)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Rejecting...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" /> Reject
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const ApprovalManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const api = useApi();

  // Admin detection
  const isAdmin = (user as any)?.role?.name === "admin";

  const [pendingLogs, setPendingLogs] = useState<OTPLog[]>([]);
  const [allLogs, setAllLogs] = useState<OTPLog[]>([]);
  const [pendingMeta, setPendingMeta] = useState<PaginationMeta | null>(null);
  const [allMeta, setAllMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  // Search debounce
  const searchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    item: OTPLog | null;
  }>({ open: false, item: null });

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    item: OTPLog | null;
  }>({ open: false, item: null });

  // Confirm dialog for admin approval
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "danger" | "warning" | "info";
    loading: boolean;
    confirmText: string;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => { },
    variant: "info",
    loading: false,
    confirmText: "Approve",
  });

  // ─── Fetch Data ─────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/otp-logs/stats");
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get(
        `/otp-logs/pending?page=${pendingPage}&limit=10`,
      );
      if (res.success) {
        setPendingLogs(res.data || []);
        setPendingMeta(res.meta || null);
      }
    } catch (err) {
      console.error("Failed to fetch pending:", err);
    }
  }, [pendingPage]);

  const fetchAll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", allPage.toString());
      params.append("limit", "15");
      params.append("sortBy", "createdAt");
      params.append("sortOrder", "DESC");
      if (searchTerm) params.append("search", searchTerm);
      if (filterType !== "all") params.append("type", filterType);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const res = await api.get(`/otp-logs?${params.toString()}`);
      if (res.success) {
        setAllLogs(res.data || []);
        setAllMeta(res.meta || null);
      }
    } catch (err) {
      console.error("Failed to fetch all logs:", err);
    }
  }, [allPage, searchTerm, filterType, filterStatus]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPending(), fetchAll(), fetchStats()]);
  }, [fetchPending, fetchAll, fetchStats]);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };
    loadAll();
  }, []);

  // Refetch on page changes
  useEffect(() => {
    if (!loading) fetchPending();
  }, [pendingPage]);

  useEffect(() => {
    if (!loading) fetchAll();
  }, [allPage, filterType, filterStatus]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setAllPage(1);
      fetchAll();
    }, 400);
  };

  // ─── Actions ────────────────────────────────────────────────────────

  // Admin approve (no OTP)
  const handleDirectApprove = (log: OTPLog) => {
    const entityLabel = getEntityDisplayName(log);

    setConfirmDialog({
      open: true,
      title: "Approval",
      description: `As admin, you can directly approve "${entityLabel}" without OTP verification. This will immediately activate the item. Do you want to proceed?`,
      variant: "info",
      loading: false,
      confirmText: "Approve Now",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const res = await api.post(`/otp-logs/${log.id}/direct-approve`, {});
          if (res.success) {
            toast.success(
              `"${entityLabel}" approved and activated successfully`,
            );
            await refreshAll();
          } else {
            toast.error(res.message || "Failed to approve");
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed to approve directly");
        } finally {
          setConfirmDialog((prev) => ({
            ...prev,
            open: false,
            loading: false,
          }));
        }
      },
    });
  };

  // Batch approve all pending (admin only)
  const handleBatchDirectApprove = () => {
    const nonExpiredLogs = pendingLogs.filter(
      (log) => !isExpired(log.expiresAt),
    );

    if (nonExpiredLogs.length === 0) {
      toast.info("No active pending items to approve");
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Approve All Pending",
      description: `As admin, you are about to directly approve ${nonExpiredLogs.length} pending item(s) without OTP. All items will be activated immediately. Continue?`,
      variant: "warning",
      loading: false,
      confirmText: `Approve All (${nonExpiredLogs.length})`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        let successCount = 0;
        let failCount = 0;

        for (const log of nonExpiredLogs) {
          try {
            const res = await api.post(
              `/otp-logs/${log.id}/direct-approve`,
              {},
            );
            if (res.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(
            `${successCount} item(s) approved successfully${failCount > 0 ? `, ${failCount} failed` : ""
            }`,
          );
        }
        if (failCount > 0 && successCount === 0) {
          toast.error("Failed to approve items");
        }

        await refreshAll();
        setConfirmDialog((prev) => ({
          ...prev,
          open: false,
          loading: false,
        }));
      },
    });
  };

  // OTP-based approve (for non-admin)
  const handleApprove = async (otp: string) => {
    if (!otpModal.item) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/otp-logs/${otpModal.item.id}/approve`, {
        otp,
      });
      if (res.success) {
        toast.success("Approved successfully");
        setOtpModal({ open: false, item: null });
        await refreshAll();
      } else {
        toast.error(res.message || "Invalid OTP");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve");
    }
    setActionLoading(false);
  };

  const handleReject = async (reason: string) => {
    if (!rejectModal.item) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/otp-logs/${rejectModal.item.id}/reject`, {
        reason,
      });
      if (res.success) {
        toast.success("Rejected successfully");
        setRejectModal({ open: false, item: null });
        await refreshAll();
      } else {
        toast.error(res.message || "Failed to reject");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject");
    }
    setActionLoading(false);
  };

  const handleResend = async (item: OTPLog) => {
    try {
      const res = await api.post(`/otp-logs/${item.id}/resend`, {});
      if (res.success) {
        toast.success("OTP resent to " + item.email);
      } else {
        toast.error(res.message || "Failed to resend");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend");
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await refreshAll();
    setLoading(false);
    toast.success("Data refreshed");
  };

  // ─── Helpers ────────────────────────────────────────────────────────

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "login":
        return "badge-default";
      case "discount":
        return "badge-warning";
      case "master_activation":
        return "badge-success";
      default:
        return "badge-default";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "login":
        return "Login";
      case "discount":
        return "Discount";
      case "master_activation":
        return "Master";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "badge-warning";
      case "approved":
        return "badge-success";
      case "expired":
        return "badge-error";
      default:
        return "badge-default";
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  // Get display name for entity
  const getEntityDisplayName = (log: OTPLog): string => {
    if (log?.entityName) return log?.entityName;
    if (log?.entityType) return log?.entityType;
    return getTypeLabel(log?.type);
  };

  // Get requester display
  const getRequesterName = (log: OTPLog): string => {
    if (log.requester?.name) return log.requester?.name;
    if (log.requester?.email) return log.requester.email;
    if (log.email) return log.email;
    return "—";
  };

  // Get approver display
  const getApproverName = (log: OTPLog): string => {
    if (log.approver?.name) return log.approver?.name;
    if (log.approver?.email) return log.approver.email;
    return "—";
  };

  const pendingCount =
    stats?.pending ?? pendingMeta?.totalCount ?? pendingMeta?.totalItems ?? 0;
  const totalCount =
    stats?.total ?? allMeta?.totalCount ?? allMeta?.totalItems ?? 0;
  const approvedToday = stats?.approvedToday ?? 0;
  const expiredToday = stats?.expiredToday ?? 0;

  // Count non-expired pending for batch approve
  const nonExpiredPendingCount = pendingLogs.filter(
    (log) => !isExpired(log.expiresAt),
  ).length;

  // ─── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 mt-2" />
          </div>
        </div>
        <StatsSkeleton />
        <div className="mt-6">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve pending OTP requests
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex gap-2">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2" size="sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </Link>
          {isAdmin &&
            hasPermission("approval:manage") &&
            nonExpiredPendingCount > 0 && (
              <Button
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBatchDirectApprove}
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Approve All</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {nonExpiredPendingCount}
                </span>
              </Button>
            )}
         
        </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <Clock className="h-5 w-5 text-warning" />
          <p className="stat-value">{pendingCount}</p>
          <p className="stat-label">Pending Approvals</p>
        </div>
        <div className="stat-card">
          <Check className="h-5 w-5 text-success" />
          <p className="stat-value">{approvedToday}</p>
          <p className="stat-label">Approved Today</p>
        </div>
        <div className="stat-card">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="stat-value">{expiredToday}</p>
          <p className="stat-label">Expired / Rejected</p>
        </div>
        <div className="stat-card">
          <Shield className="h-5 w-5 text-primary" />
          <p className="stat-value">{totalCount}</p>
          <p className="stat-label">Total OTP Requests</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6 mt-4">
        <div className="overflow-x-auto display flex items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Queue
              {pendingCount > 0 && (
                <span className="ml-2 bg-warning/20 text-warning px-2 py-0.5 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All OTP Logs</TabsTrigger>
          </TabsList>
           <Button
            variant="outline"
            size="sm"
            className="gap-2 ml-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* ─── Pending Tab ─────────────────────────────────────────── */}
        <TabsContent value="pending" className="space-y-4">
          <div className="enterprise-card overflow-hidden">
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Entity</th>
                    <th className="hidden sm:table-cell">Requested By</th>
                    <th className="hidden md:table-cell">Email</th>
                    <th className="hidden lg:table-cell">Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-muted-foreground py-12"
                      >
                        <Check className="h-8 w-8 mx-auto mb-2 text-success opacity-50" />
                        <p>No pending approvals. All caught up!</p>
                      </td>
                    </tr>
                  ) : (
                    pendingLogs.map((log) => {
                      const expired = isExpired(log.expiresAt);
                      return (
                        <tr
                          key={log.id}
                          className={expired ? "opacity-60" : ""}
                        >
                          <td>
                            <span className={getTypeBadge(log?.type)}>
                              {getTypeLabel(log?.type)}
                            </span>
                          </td>
                          <td className="text-sm">
                            {log?.entityType ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="bg-muted px-2 py-0.5 rounded text-xs w-fit capitalize">
                                  {log?.entityType}
                                </span>
                                {log?.entityName && (
                                  <span
                                    className="text-xs font-medium text-foreground truncate max-w-[140px]"
                                    title={log?.entityName}
                                  >
                                    {log?.entityName}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="hidden sm:table-cell text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {getRequesterName(log)}
                              </span>
                              {log.requester?.email &&
                                log.requester.email !== log.requester?.name && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {log.requester.email}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="hidden md:table-cell text-muted-foreground text-sm">
                            {log.email}
                          </td>
                          <td className="hidden lg:table-cell text-sm">
                            {expired ? (
                              <span className="text-destructive font-medium">
                                Expired
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                {formatDate(log.expiresAt)}
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                expired ? "badge-error" : "badge-warning"
                              }
                            >
                              {expired ? "Expired" : "Pending"}
                            </span>
                          </td>
                          <td>
                            {!expired ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                {hasPermission("approval:manage") && (
                                  <>
                                    {/* Admin gets direct approve */}
                                    {isAdmin ? (
                                      <Button
                                        size="sm"
                                        className="h-8 bg-green-600 hover:bg-green-700 text-white gap-1"
                                        onClick={() => handleDirectApprove(log)}
                                      >
                                        <ShieldCheck className="h-3.5 w-3.5" />

                                        Approve
                                      </Button>
                                    ) : (
                                      /* Non-admin gets OTP-based approve */
                                      <Button
                                        size="sm"
                                        className="h-8 bg-success hover:bg-success/90 text-success-foreground"
                                        onClick={() =>
                                          setOtpModal({
                                            open: true,
                                            item: log,
                                          })
                                        }
                                      >
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        Approve
                                      </Button>
                                    )}
                                  </>
                                )}

                                {hasPermission("approval:manage") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-destructive border-destructive/50 hover:bg-destructive/10"
                                    onClick={() =>
                                      setRejectModal({ open: true, item: log })
                                    }
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                  </Button>
                                )}

                                {/* Only show resend for non-admin */}
                                {hasPermission("approval:manage") &&
                                  !isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8"
                                      onClick={() => handleResend(log)}
                                      title="Resend OTP"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No action
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
            {pendingMeta && pendingMeta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {pendingMeta.currentPage} of {pendingMeta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingPage <= 1}
                    onClick={() => setPendingPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingPage >= pendingMeta.totalPages}
                    onClick={() => setPendingPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── All Logs Tab ────────────────────────────────────────── */}
        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="enterprise-card p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, entity name..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <Select
                value={filterType}
                onValueChange={(v) => {
                  setFilterType(v);
                  setAllPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="master_activation">Master</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v);
                  setAllPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="enterprise-card overflow-hidden">
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th className="hidden sm:table-cell">Entity</th>
                    <th className="hidden md:table-cell">Requested By</th>
                    <th className="hidden lg:table-cell">Approved By</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {allLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 7 : 6}
                        className="text-center text-muted-foreground py-12"
                      >
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No OTP logs found.
                      </td>
                    </tr>
                  ) : (
                    allLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td>
                          <span className={getTypeBadge(log?.type)}>
                            {getTypeLabel(log?.type)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell text-sm">
                          {log?.entityType ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="bg-muted px-2 py-0.5 rounded text-xs w-fit capitalize">
                                {log?.entityType}
                              </span>
                              {log?.entityName && (
                                <span
                                  className="text-xs text-foreground font-medium truncate max-w-[120px]"
                                  title={log?.entityName}
                                >
                                  {log?.entityName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              {log.email}
                            </span>
                          )}
                        </td>
                        <td className="hidden md:table-cell text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {getRequesterName(log)}
                            </span>
                            {log.requester?.email &&
                              log.requester?.name &&
                              log.requester.email !== log.requester?.name && (
                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {log.requester.email}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="hidden lg:table-cell text-sm">
                          {log.status === "approved" ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {getApproverName(log)}
                              </span>
                              {log.approver?.email &&
                                log.approver?.name &&
                                log.approver.email !== log.approver?.name && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {log.approver.email}
                                  </span>
                                )}
                              {log.approvedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(log.approvedAt)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td>
                          <span className={getStatusBadge(log.status)}>
                            {log.status.charAt(0).toUpperCase() +
                              log.status.slice(1)}
                          </span>
                        </td>
                        {/* Admin can approve/reject from all logs */}
                        {isAdmin && (
                          <td>
                            {log.status === "pending" &&
                              !isExpired(log.expiresAt) ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30"
                                  onClick={() => handleDirectApprove(log)}
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5"
                                  onClick={() =>
                                    setRejectModal({ open: true, item: log })
                                  }
                                >
                                  <X className="h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            ) : log.status === "pending" &&
                              isExpired(log.expiresAt) ? (
                              <span className="text-xs text-muted-foreground">
                                Expired
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {allMeta && allMeta.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing {allLogs.length} of{" "}
                  {allMeta.totalCount || allMeta.totalItems} • Page{" "}
                  {allMeta.currentPage} of {allMeta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={allPage <= 1}
                    onClick={() => setAllPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={allPage >= allMeta.totalPages}
                    onClick={() => setAllPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* OTP Verify Modal — Only for non-admin */}
      <OTPVerifyModal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ open: false, item: null })}
        onVerify={handleApprove}
        loading={actionLoading}
        title={`Approve ${getEntityDisplayName(otpModal.item!)}`}
        description="Enter the OTP to verify and approve this request"
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, item: null })}
        onReject={handleReject}
        loading={actionLoading}
        itemName={getEntityDisplayName(rejectModal.item!)}
      />

      {/* Confirm Dialog for admin direct approval */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        loading={confirmDialog.loading}
        confirmText={confirmDialog.confirmText}
        cancelText="Cancel"
      />
    </div>
  );
};

export default ApprovalManagement;
