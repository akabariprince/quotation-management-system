// src/pages/ApprovalManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  Clock,
  Shield,
  Search,
  RefreshCw,
  AlertCircle,
  KeyRound,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  User,
  Mail,
  Calendar,
  FileText,
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface OTPLog {
  id: string;
  type: "login" | "discount" | "master_activation";
  entityId: string | null;
  entityType: string | null;
  email: string;
  status: "pending" | "approved" | "expired";
  attempts: number;
  maxAttempts: number;
  expiresAt: string;
  approvedAt: string | null;
  createdAt: string;
  requester?: { id: string; name: string; email: string };
  approver?: { id: string; name: string; email: string };
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  totalItems?: number;
  limit: number;
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
            {Array.from({ length: 6 }).map((_, i) => (
              <th key={i}>
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 6 }).map((_, j) => (
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

// ─── OTP Verify Modal ───────────────────────────────────────────────────────

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

  const [pendingLogs, setPendingLogs] = useState<OTPLog[]>([]);
  const [allLogs, setAllLogs] = useState<OTPLog[]>([]);
  const [pendingMeta, setPendingMeta] = useState<PaginationMeta | null>(null);
  const [allMeta, setAllMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pendingPage, setPendingPage] = useState(1);
  const [allPage, setAllPage] = useState(1);

  // Modals
  const [otpModal, setOtpModal] = useState<{
    open: boolean;
    item: OTPLog | null;
  }>({
    open: false,
    item: null,
  });
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    item: OTPLog | null;
  }>({
    open: false,
    item: null,
  });

  // ─── Fetch Data ─────────────────────────────────────────────────────

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

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchPending(), fetchAll()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (!loading) fetchPending();
  }, [pendingPage]);

  useEffect(() => {
    if (!loading) fetchAll();
  }, [allPage, searchTerm, filterType, filterStatus]);

  // ─── Actions ────────────────────────────────────────────────────────

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
        await Promise.all([fetchPending(), fetchAll()]);
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
        await Promise.all([fetchPending(), fetchAll()]);
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
    await Promise.all([fetchPending(), fetchAll()]);
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

  const pendingCount = pendingMeta?.totalCount || pendingMeta?.totalItems || 0;
  const totalCount = allMeta?.totalCount || allMeta?.totalItems || 0;

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
        <TableSkeleton rows={5} />
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
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
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
          <p className="stat-value">
            {allLogs.filter((l) => l.status === "approved").length}
          </p>
          <p className="stat-label">Approved Today</p>
        </div>
        <div className="stat-card">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="stat-value">
            {allLogs.filter((l) => l.status === "expired").length}
          </p>
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
        <div className="overflow-x-auto">
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
        </div>

        {/* ─── Pending Tab ─────────────────────────────────────────────── */}
        <TabsContent value="pending" className="space-y-4">
          <div className="enterprise-card overflow-hidden mt-4">
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Email</th>
                    <th className="hidden sm:table-cell">Requested By</th>
                    <th className="hidden md:table-cell">Entity</th>
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
                            <span className={getTypeBadge(log.type)}>
                              {getTypeLabel(log.type)}
                            </span>
                          </td>
                          <td className="font-medium text-sm">{log.email}</td>
                          <td className="hidden sm:table-cell text-muted-foreground text-sm">
                            {log.requester?.name || "—"}
                          </td>
                          <td className="hidden md:table-cell text-sm">
                            {log.entityType ? (
                              <span className="bg-muted px-2 py-1 rounded text-xs">
                                {log.entityType}
                              </span>
                            ) : (
                              "—"
                            )}
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
                              <div className="flex items-center gap-2">
                                {hasPermission("approval:manage") && (
                                  <Button
                                    size="sm"
                                    className="h-8 bg-success hover:bg-success/90 text-success-foreground"
                                    onClick={() =>
                                      setOtpModal({ open: true, item: log })
                                    }
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Approve
                                  </Button>
                                )}

                                {hasPermission("approval:manage") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      setRejectModal({ open: true, item: log })
                                    }
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                  </Button>
                                )}
                                {hasPermission("approval:manage") && (
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

        {/* ─── All Logs Tab ────────────────────────────────────────────── */}
        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="enterprise-card p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setAllPage(1);
                  }}
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
                    <th className="hidden sm:table-cell">Email</th>
                    <th className="hidden md:table-cell">Requested By</th>
                    <th className="hidden lg:table-cell">Approved By</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
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
                          <span className={getTypeBadge(log.type)}>
                            {getTypeLabel(log.type)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell text-sm">
                          {log.email}
                        </td>
                        <td className="hidden md:table-cell text-sm text-muted-foreground">
                          {log.requester?.name || "—"}
                        </td>
                        <td className="hidden lg:table-cell text-sm text-muted-foreground">
                          {log.approver?.name || "—"}
                        </td>
                        <td>
                          <span className={getStatusBadge(log.status)}>
                            {log.status.charAt(0).toUpperCase() +
                              log.status.slice(1)}
                          </span>
                        </td>
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

      {/* Modals */}
      <OTPVerifyModal
        isOpen={otpModal.open}
        onClose={() => setOtpModal({ open: false, item: null })}
        onVerify={handleApprove}
        loading={actionLoading}
        title={`Approve ${otpModal.item?.entityType || otpModal.item?.type || "Request"}`}
        description="Enter the OTP to verify and approve this request"
      />

      <RejectModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, item: null })}
        onReject={handleReject}
        loading={actionLoading}
        itemName={
          rejectModal.item?.entityType || rejectModal.item?.type || "Request"
        }
      />
    </div>
  );
};

export default ApprovalManagement;
