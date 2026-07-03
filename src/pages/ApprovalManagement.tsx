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
import { formatISTDateTimeWithLabel } from "@/utils/time";

// ─── Types ───
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

// ─── Skeletons ───
const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="enterprise-card p-3 flex items-center justify-between"
      >
        <div>
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    ))}
  </div>
);

const TableSkeletonComponent: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="enterprise-card overflow-hidden">
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            {Array.from({ length: 7 }).map((_, i) => (
              <th key={i} className="px-3 py-1.5">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 7 }).map((_, j) => (
                <td key={j} className="px-3 py-1">
                  <Skeleton className="h-3 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── OTP Verify Modal ───
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
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "Enter" && otp.length === 6) onVerify(otp);
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
        className="modal-content max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
            <KeyRound className="h-5 w-5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 btn-accent h-7 text-xs"
            onClick={() => onVerify(otp)}
            disabled={otp.length !== 6 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" />
                Verify & Approve
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Reject Modal ───
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
        className="modal-content max-w-md p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <X className="h-5 w-5 text-destructive" />
          </div>
          <h3 className="text-sm font-semibold text-center">Reject Request</h3>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Reject <strong>{itemName}</strong>?
          </p>
        </div>
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-medium">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for rejection..."
            className="input-field min-h-[60px] resize-none text-xs"
            disabled={loading}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 h-7 text-xs"
            onClick={() => onReject(reason)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Rejecting...
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Reject
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───
const ApprovalManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const api = useApi();
  const isAdmin = (user as any)?.role?.name === "admin";

  const [pendingLogs, setPendingLogs] = useState<OTPLog[]>([]);
  const [allLogs, setAllLogs] = useState<OTPLog[]>([]);
  const [pendingMeta, setPendingMeta] = useState<PaginationMeta | null>(null);
  const [allMeta, setAllMeta] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  // New state variables for Sent Projects
  const [sentProjects, setSentProjects] = useState<any[]>([]);
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsMeta, setProjectsMeta] = useState<PaginationMeta | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Tab selection state: default to 'projects' if has project:approve permission, otherwise 'pending'
  const hasProjectApprove = hasPermission("project:approve");
  const [activeTab, setActiveTab] = useState(
    hasProjectApprove ? "projects" : "pending",
  );

  const searchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    item: OTPLog | null;
  }>({ open: false, item: null });
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    item: OTPLog | null;
  }>({ open: false, item: null });

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
    onConfirm: () => {},
    variant: "info",
    loading: false,
    confirmText: "Approve",
  });

  // ─── Fetch Data ───
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/otp-logs/stats");
      if (res.success) setStats(res.data);
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

  const fetchSentProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const res = await api.get(
        `/projects?status=sent&page=${projectsPage}&limit=10&sortBy=createdAt&sortOrder=DESC`,
      );
      if (res.success) {
        setSentProjects(res.data || []);
        setProjectsMeta(res.meta || null);
      }
    } catch (err) {
      console.error("Failed to fetch sent projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  }, [projectsPage]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchSentProjects(),
      fetchPending(),
      fetchAll(),
      fetchStats(),
    ]);
  }, [fetchSentProjects, fetchPending, fetchAll, fetchStats]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    };
    loadAll();
  }, []);
  useEffect(() => {
    if (!loading) fetchPending();
  }, [pendingPage]);
  useEffect(() => {
    if (!loading) fetchAll();
  }, [allPage, filterType, filterStatus]);
  useEffect(() => {
    if (!loading) fetchSentProjects();
  }, [projectsPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setAllPage(1);
      fetchAll();
    }, 400);
  };

  // ─── Actions ───
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
          } else toast.error(res.message || "Failed to approve");
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
            if (res.success) successCount++;
            else failCount++;
          } catch {
            failCount++;
          }
        }
        if (successCount > 0)
          toast.success(
            `${successCount} item(s) approved successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
          );
        if (failCount > 0 && successCount === 0)
          toast.error("Failed to approve items");
        await refreshAll();
        setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }));
      },
    });
  };

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
      } else toast.error(res.message || "Invalid OTP");
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
      } else toast.error(res.message || "Failed to reject");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject");
    }
    setActionLoading(false);
  };

  const handleResend = async (item: OTPLog) => {
    try {
      const res = await api.post(`/otp-logs/${item.id}/resend`, {});
      if (res.success) toast.success("OTP resent to " + item.email);
      else toast.error(res.message || "Failed to resend");
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

  const handleApproveProject = (project: any) => {
    setConfirmDialog({
      open: true,
      title: "Approve Project",
      description: `Are you sure you want to approve Project ${project.projectNo} for customer "${project.customer?.name || "Customer"}"? This will move it to Pending Purchase Orders.`,
      variant: "info",
      loading: false,
      confirmText: "Approve",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const res = await api.patch(`/projects/${project.id}/status`, {
            status: "approved",
          });
          if (res.success) {
            toast.success(
              `Project ${project.projectNo} approved and customer email/WhatsApp will be sent!`,
            );
            await refreshAll();
          } else {
            toast.error(res.message || "Failed to approve project");
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed to approve project");
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

  const handleRejectProject = (project: any) => {
    setConfirmDialog({
      open: true,
      title: "Reject Project",
      description: `Are you sure you want to reject Project ${project.projectNo}? This will change its status to Rejected and hide it from reports.`,
      variant: "danger",
      loading: false,
      confirmText: "Reject",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const res = await api.patch(`/projects/${project.id}/status`, {
            status: "rejected",
          });
          if (res.success) {
            toast.success(`Project ${project.projectNo} rejected successfully`);
            await refreshAll();
          } else {
            toast.error(res.message || "Failed to reject project");
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed to reject project");
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

  // ─── Helpers ───
  const formatDate = (date: string) => formatISTDateTimeWithLabel(date);
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
  const getEntityDisplayName = (log: OTPLog): string => {
    if (log?.entityName) return log.entityName;
    if (log?.entityType) return log.entityType;
    return getTypeLabel(log?.type);
  };
  const getRequesterName = (log: OTPLog): string => {
    if (log.requester?.name) return log.requester.name;
    if (log.requester?.email) return log.requester.email;
    if (log.email) return log.email;
    return "—";
  };
  const getApproverName = (log: OTPLog): string => {
    if (log.approver?.name) return log.approver.name;
    if (log.approver?.email) return log.approver.email;
    return "—";
  };

  const pendingCount =
    stats?.pending ?? pendingMeta?.totalCount ?? pendingMeta?.totalItems ?? 0;
  const totalCount =
    stats?.total ?? allMeta?.totalCount ?? allMeta?.totalItems ?? 0;
  const approvedToday = stats?.approvedToday ?? 0;
  const expiredToday = stats?.expiredToday ?? 0;
  const nonExpiredPendingCount = pendingLogs.filter(
    (log) => !isExpired(log.expiresAt),
  ).length;

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between py-1">
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 mt-1" />
          </div>
        </div>
        <StatsSkeleton />
        <div className="mt-1">
          <TableSkeletonComponent rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-sm font-semibold leading-none">
            Approval Management
          </h1>
          <p className="text-muted-foreground text-xs">
            Review and approve pending OTP requests
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/dashboard">
            <Button
              variant="outline"
              className="gap-1 h-7 text-xs px-2"
              size="sm"
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline text-white">
                Back to Dashboard
              </span>
            </Button>
          </Link>
          {isAdmin &&
            hasPermission("approval:manage") &&
            nonExpiredPendingCount > 0 && (
              <Button
                size="sm"
                className="gap-1 h-7 text-xs px-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleBatchDirectApprove}
              >
                <ShieldCheck className="h-3 w-3" />
                <span className="hidden sm:inline text-white">Approve All</span>
                <span className="bg-white/20 px-1 py-px rounded text-xs">
                  {nonExpiredPendingCount}
                </span>
              </Button>
            )}
        </div>
      </div>

      {/* Summary Cards — icon right, label+value left */}
      <div
        className={`grid grid-cols-2 ${hasPermission("project:approve") ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3 mt-1`}
      >
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Pending Approvals</p>
            <p className="text-lg font-bold text-foreground">{pendingCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-warning" />
          </div>
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Approved Today</p>
            <p className="text-lg font-bold text-foreground">{approvedToday}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
            <Check className="h-4 w-4 text-success" />
          </div>
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Expired / Rejected</p>
            <p className="text-lg font-bold text-foreground">{expiredToday}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        </div>
        <div className="enterprise-card p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total OTP Requests</p>
            <p className="text-lg font-bold text-foreground">{totalCount}</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
        </div>
        {hasPermission("project:approve") && (
          <div className="enterprise-card p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending Projects</p>
              <p className="text-lg font-bold text-foreground">
                {projectsMeta?.totalCount ?? sentProjects.length}
              </p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-info" />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-2 mt-2"
      >
        <div className="overflow-x-auto display flex items-center gap-2">
          <TabsList>
            {hasPermission("project:approve") && (
              <TabsTrigger value="projects">Project Approvals</TabsTrigger>
            )}
            <TabsTrigger value="pending">
              Pending Queue
              {pendingCount > 0 && (
                <span className="ml-1 bg-warning/20 text-warning px-1.5 py-px rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All OTP Logs</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-7 text-xs px-2 ml-1"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>

        {/* ─── Project Approvals Tab ─── */}
        {hasPermission("project:approve") && (
          <TabsContent value="projects" className="space-y-1">
            <div className="enterprise-card overflow-hidden">
              <div className="table-container">
                <table className="enterprise-table w-full">
                  <thead>
                    <tr>
                      <th className="px-3 py-1.5 text-xs">Project No</th>
                      <th className="px-3 py-1.5 text-xs">Project Name</th>
                      <th className="px-3 py-1.5 text-xs">Customer</th>
                      <th className="hidden sm:table-cell px-3 py-1.5 text-xs">
                        Salesperson
                      </th>
                      <th className="hidden md:table-cell px-3 py-1.5 text-xs">
                        Date
                      </th>
                      <th className="hidden lg:table-cell px-3 py-1.5 text-xs">
                        Total Value
                      </th>
                      <th className="px-3 py-1.5 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectsLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-4 text-xs text-muted-foreground"
                        >
                          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                          Loading projects...
                        </td>
                      </tr>
                    ) : sentProjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-muted-foreground py-8 text-sm"
                        >
                          <Check className="h-6 w-6 mx-auto mb-1 text-success opacity-50" />
                          <p>No projects pending approval.</p>
                        </td>
                      </tr>
                    ) : (
                      sentProjects.map((project) => (
                        <tr key={project.id}>
                          <td className="px-3 py-1 font-mono text-sm font-semibold text-primary">
                            {project.projectNo}
                          </td>
                          <td className="px-3 py-1 text-sm font-medium">
                            {project.projectName || (
                              <span className="text-muted-foreground italic">
                                No Name
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {project.customer?.name || "—"}
                              </span>
                              {project.customer?.email && (
                                <span className="text-[10px] text-muted-foreground">
                                  {project.customer.email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-3 py-1 text-sm text-muted-foreground">
                            {project.salesPerson?.name || "—"}
                          </td>
                          <td className="hidden md:table-cell px-3 py-1 text-sm text-muted-foreground">
                            {project.date}
                          </td>
                          <td className="hidden lg:table-cell px-3 py-1 text-sm font-semibold">
                            {new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            }).format(Number(project.grandTotalWithGst) || 0)}
                          </td>
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700 text-white gap-1"
                                onClick={() => handleApproveProject(project)}
                              >
                                <Check className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2 text-destructive border-destructive/50 hover:bg-destructive/10 gap-1"
                                onClick={() => handleRejectProject(project)}
                              >
                                <X className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {projectsMeta && projectsMeta.totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Page {projectsMeta.currentPage} of {projectsMeta.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      disabled={projectsPage <= 1}
                      onClick={() => setProjectsPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      disabled={projectsPage >= projectsMeta.totalPages}
                      onClick={() => setProjectsPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* ─── Pending Tab ─── */}
        <TabsContent value="pending" className="space-y-1">
          <div className="enterprise-card overflow-hidden">
            <div className="table-container">
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    <th className="px-3 py-1.5 text-xs">Type</th>
                    <th className="px-3 py-1.5 text-xs">Entity</th>
                    <th className="hidden sm:table-cell px-3 py-1.5 text-xs">
                      Requested By
                    </th>
                    <th className="hidden md:table-cell px-3 py-1.5 text-xs">
                      Email
                    </th>
                    <th className="hidden lg:table-cell px-3 py-1.5 text-xs">
                      Expires
                    </th>
                    <th className="px-3 py-1.5 text-xs">Status</th>
                    <th className="px-3 py-1.5 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-muted-foreground py-8 text-sm"
                      >
                        <Check className="h-6 w-6 mx-auto mb-1 text-success opacity-50" />
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
                          <td className="px-3 py-1">
                            <span className={getTypeBadge(log?.type)}>
                              {getTypeLabel(log?.type)}
                            </span>
                          </td>
                          <td className="px-3 py-1 text-sm">
                            {log?.entityType ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="bg-muted px-1.5 py-px rounded text-xs w-fit capitalize">
                                  {log.entityType}
                                </span>
                                {log?.entityName && (
                                  <span
                                    className="text-xs font-medium text-foreground truncate max-w-[140px]"
                                    title={log.entityName}
                                  >
                                    {log.entityName}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="hidden sm:table-cell px-3 py-1 text-sm">
                            <span className="font-medium text-foreground">
                              {getRequesterName(log)}
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-3 py-1 text-muted-foreground text-sm">
                            {log.email}
                          </td>
                          <td className="hidden lg:table-cell px-3 py-1 text-sm">
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
                          <td className="px-3 py-1">
                            <span
                              className={
                                expired ? "badge-error" : "badge-warning"
                              }
                            >
                              {expired ? "Expired" : "Pending"}
                            </span>
                          </td>
                          <td className="px-3 py-1">
                            {!expired ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                {hasPermission("approval:manage") &&
                                  (isAdmin ? (
                                    <Button
                                      size="sm"
                                      className="h-6 text-xs px-2 bg-green-600 hover:bg-green-700 text-white gap-1"
                                      onClick={() => handleDirectApprove(log)}
                                    >
                                      <ShieldCheck className="h-3 w-3" />
                                      Approve
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="h-6 text-xs px-2 bg-success hover:bg-success/90 text-success-foreground"
                                      onClick={() =>
                                        setOtpModal({ open: true, item: log })
                                      }
                                    >
                                      <Check className="h-3 w-3 mr-0.5" />
                                      Approve
                                    </Button>
                                  ))}
                                {hasPermission("approval:manage") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs px-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                                    onClick={() =>
                                      setRejectModal({ open: true, item: log })
                                    }
                                  >
                                    <X className="h-3 w-3 mr-0.5" />
                                    Reject
                                  </Button>
                                )}
                                {hasPermission("approval:manage") &&
                                  !isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs px-1.5"
                                      onClick={() => handleResend(log)}
                                      title="Resend OTP"
                                    >
                                      <Send className="h-3 w-3" />
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
            {pendingMeta && pendingMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {pendingMeta.currentPage} of {pendingMeta.totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    disabled={pendingPage <= 1}
                    onClick={() => setPendingPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    disabled={pendingPage >= pendingMeta.totalPages}
                    onClick={() => setPendingPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── All Logs Tab ─── */}
        <TabsContent value="all" className="space-y-1">
          <div className="enterprise-card p-2">
            <div className="flex flex-col sm:flex-row items-center gap-1.5">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by email, entity name..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              <Select
                value={filterType}
                onValueChange={(v) => {
                  setFilterType(v);
                  setAllPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[120px] h-7 text-xs px-2">
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
                <SelectTrigger className="w-full sm:w-[110px] h-7 text-xs px-2">
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

          <div className="enterprise-card overflow-hidden">
            <div className="table-container">
              <table className="enterprise-table w-full">
                <thead>
                  <tr>
                    <th className="px-3 py-1.5 text-xs">Date</th>
                    <th className="px-3 py-1.5 text-xs">Type</th>
                    <th className="hidden sm:table-cell px-3 py-1.5 text-xs">
                      Entity
                    </th>
                    <th className="hidden md:table-cell px-3 py-1.5 text-xs">
                      Requested By
                    </th>
                    <th className="hidden lg:table-cell px-3 py-1.5 text-xs">
                      Approved By
                    </th>
                    <th className="px-3 py-1.5 text-xs">Status</th>
                    {isAdmin && (
                      <th className="px-3 py-1.5 text-xs">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {allLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 7 : 6}
                        className="text-center text-muted-foreground py-8 text-sm"
                      >
                        <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        No OTP logs found.
                      </td>
                    </tr>
                  ) : (
                    allLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-3 py-1 text-muted-foreground text-sm whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-3 py-1">
                          <span className={getTypeBadge(log?.type)}>
                            {getTypeLabel(log?.type)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-1 text-sm">
                          {log?.entityType ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="bg-muted px-1.5 py-px rounded text-xs w-fit capitalize">
                                {log.entityType}
                              </span>
                              {log?.entityName && (
                                <span
                                  className="text-xs text-foreground font-medium truncate max-w-[120px]"
                                  title={log.entityName}
                                >
                                  {log.entityName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              {log.email}
                            </span>
                          )}
                        </td>
                        <td className="hidden md:table-cell px-3 py-1 text-sm">
                          <span className="font-medium text-foreground">
                            {getRequesterName(log)}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell px-3 py-1 text-sm">
                          {log.status === "approved" ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">
                                {getApproverName(log)}
                              </span>
                              {log.approvedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(log.approvedAt)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-1">
                          <span className={getStatusBadge(log.status)}>
                            {log.status.charAt(0).toUpperCase() +
                              log.status.slice(1)}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-1">
                            {log.status === "pending" &&
                            !isExpired(log.expiresAt) ? (
                              <div className="flex items-center gap-0.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs gap-0.5 px-1.5 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30"
                                  onClick={() => handleDirectApprove(log)}
                                >
                                  <ShieldCheck className="h-3 w-3" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs gap-0.5 px-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
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
            {allMeta && allMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-1.5 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {allLogs.length} of{" "}
                  {allMeta.totalCount || allMeta.totalItems} • Page{" "}
                  {allMeta.currentPage} of {allMeta.totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    disabled={allPage <= 1}
                    onClick={() => setAllPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    disabled={allPage >= allMeta.totalPages}
                    onClick={() => setAllPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <OTPVerifyModal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ open: false, item: null })}
        onVerify={handleApprove}
        loading={actionLoading}
        title={`Approve ${getEntityDisplayName(otpModal.item!)}`}
        description="Enter the OTP to verify and approve this request"
      />

      <RejectModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, item: null })}
        onReject={handleReject}
        loading={actionLoading}
        itemName={getEntityDisplayName(rejectModal.item!)}
      />

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
