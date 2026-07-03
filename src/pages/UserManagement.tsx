// src/pages/UserManagement.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Search,
  Users,
  KeyRound,
  Percent,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useUsers, SystemUser } from "@/hooks/useUsers";
import { useRoles, Role, PermissionsMeta } from "@/hooks/useRoles";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TableSkeleton from "@/components/common/TableSkeleton";
import Pagination from "@/components/common/Pagination";
import { Link } from "react-router-dom";
import VerificationField from "@/components/common/VerificationField";

const PAGE_LIMIT = 10;

const normalizeMobile = (mobile: string) => {
  const digits = mobile.replace(/\D/g, "").slice(0, 10);
  return digits ? `+91${digits}` : "";
};

const getLocalMobile = (mobile?: string | null) => {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) {
    return digits.slice(2, 12);
  }
  return digits.slice(0, 10);
};

const UserManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();

  const {
    users,
    meta: usersMeta,
    loading: usersLoading,
    fetchUsers,
    createUser,
    updateUser,
    requestUserMobileOTP,
    verifyUserMobileOTP,
    requestUserEmailOTP,
    verifyUserEmailOTP,
    deleteUser,
  } = useUsers();

  const {
    roles,
    meta: rolesMeta,
    loading: rolesLoading,
    permissionsMeta,
    permissionsLoading,
    fetchRoles,
    fetchPermissionsMeta,
    createRole,
    updateRole,
    deleteRole,
  } = useRoles();

  const [activeTab, setActiveTab] = useState("users");

  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [roleSearch, setRoleSearch] = useState("");
  const [rolePage, setRolePage] = useState(1);

  const userSearchTimer = useRef<NodeJS.Timeout | null>(null);
  const roleSearchTimer = useRef<NodeJS.Timeout | null>(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [sendingUserOtp, setSendingUserOtp] = useState(false);
  const [verifyingUserOtp, setVerifyingUserOtp] = useState(false);
  const [userOtpCode, setUserOtpCode] = useState("");
  const [userOtpLogId, setUserOtpLogId] = useState<string | null>(null);
  const [verifiedUserMobileOtpLogId, setVerifiedUserMobileOtpLogId] = useState<
    string | null
  >(null);
  const [verifiedUserMobile, setVerifiedUserMobile] = useState<string | null>(
    null,
  );
  const [sendingUserEmailOtp, setSendingUserEmailOtp] = useState(false);
  const [verifyingUserEmailOtp, setVerifyingUserEmailOtp] = useState(false);
  const [userEmailOtpCode, setUserEmailOtpCode] = useState("");
  const [userEmailOtpLogId, setUserEmailOtpLogId] = useState<string | null>(
    null,
  );
  const [verifiedUserEmailOtpLogId, setVerifiedUserEmailOtpLogId] = useState<
    string | null
  >(null);
  const [verifiedUserEmail, setVerifiedUserEmail] = useState<string | null>(
    null,
  );
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    roleId: "",
    isActive: true,
    whatsappVerified: false,
    emailVerified: false,
  });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormLoading, setRoleFormLoading] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    displayName: "",
    description: "",
    permissions: [] as string[],
    discountMin: 0,
    discountMax: 100,
    requireOtpForMaster: true,
    isActive: true,
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "danger" | "warning" | "info";
    loading: boolean;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "danger",
    loading: false,
  });

  // ── Data Fetching ──
  const loadUsers = useCallback(
    (page?: number, search?: string) => {
      const p = page ?? userPage;
      const s = search ?? userSearch;
      const params: any = { page: p, limit: PAGE_LIMIT };
      if (s) params.search = s;
      if (userStatusFilter) params.isActive = userStatusFilter;
      if (userRoleFilter) params.roleId = userRoleFilter;
      fetchUsers(params);
    },
    [userPage, userSearch, userStatusFilter, userRoleFilter, fetchUsers],
  );

  const loadRoles = useCallback(
    (page?: number, search?: string) => {
      const p = page ?? rolePage;
      const s = search ?? roleSearch;
      const params: any = { page: p, limit: PAGE_LIMIT };
      if (s) params.search = s;
      fetchRoles(params);
    },
    [rolePage, roleSearch, fetchRoles],
  );

  useEffect(() => {
    loadUsers(1);
    loadRoles(1);
    fetchRoles({ limit: 100 });
    fetchPermissionsMeta();
  }, []);
  useEffect(() => {
    loadUsers(1);
    setUserPage(1);
  }, [userStatusFilter, userRoleFilter]);
  useEffect(() => {
    loadUsers(userPage);
  }, [userPage]);
  useEffect(() => {
    loadRoles(rolePage);
  }, [rolePage]);

  const handleUserSearch = (value: string) => {
    setUserSearch(value);
    if (userSearchTimer.current) clearTimeout(userSearchTimer.current);
    userSearchTimer.current = setTimeout(() => {
      setUserPage(1);
      loadUsers(1, value);
    }, 400);
  };

  const handleRoleSearch = (value: string) => {
    setRoleSearch(value);
    if (roleSearchTimer.current) clearTimeout(roleSearchTimer.current);
    roleSearchTimer.current = setTimeout(() => {
      setRolePage(1);
      loadRoles(1, value);
    }, 400);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return <ShieldCheck className="h-3.5 w-3.5 text-accent" />;
      case "master":
        return <ShieldAlert className="h-3.5 w-3.5 text-yellow-500" />;
      case "creator":
        return <Shield className="h-3.5 w-3.5 text-primary" />;
      default:
        return <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  // ── USER CRUD ──
  const handleOpenUserModal = (u?: SystemUser) => {
    setUserOtpCode("");
    setUserOtpLogId(null);
    setVerifiedUserMobileOtpLogId(null);
    setUserEmailOtpCode("");
    setUserEmailOtpLogId(null);
    setVerifiedUserEmailOtpLogId(null);
    if (u) {
      setEditingUser(u);
      setVerifiedUserMobile(u.whatsappVerifiedMobile || null);
      setVerifiedUserEmail(u.emailVerifiedEmail || null);
      setUserForm({
        name: u.name,
        email: u.email,
        password: "",
        mobile: getLocalMobile(u.mobile),
        roleId: u.roleId,
        isActive: u.isActive,
        whatsappVerified: Boolean(u.whatsappVerified),
        emailVerified: Boolean(u.emailVerified),
      });
    } else {
      setEditingUser(null);
      setVerifiedUserMobile(null);
      setVerifiedUserEmail(null);
      setUserForm({
        name: "",
        email: "",
        password: "",
        mobile: "",
        roleId: "",
        isActive: true,
        whatsappVerified: false,
        emailVerified: false,
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.roleId) {
      toast.error("Please fill all required fields");
      return;
    }
    setUserFormLoading(true);
    try {
      if (editingUser) {
        const body: any = {
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          mobile: userForm.mobile ? normalizeMobile(userForm.mobile) : null,
          roleId: userForm.roleId,
          isActive: userForm.isActive,
        };
        if (!body.password) delete body.password;
        body.verificationOtpLogId =
          userForm.whatsappVerified &&
          userForm.mobile &&
          verifiedUserMobile === normalizeMobile(userForm.mobile)
            ? verifiedUserMobileOtpLogId
            : null;
        body.emailVerificationOtpLogId =
          userForm.emailVerified &&
          verifiedUserEmail === userForm.email.trim().toLowerCase()
            ? verifiedUserEmailOtpLogId
            : null;
        await updateUser(editingUser.id, body);
        toast.success("User updated successfully");
      } else {
        if (!userForm.password) {
          toast.error("Password is required for new user");
          setUserFormLoading(false);
          return;
        }
        const body: any = {
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          mobile: userForm.mobile ? normalizeMobile(userForm.mobile) : null,
          roleId: userForm.roleId,
          isActive: userForm.isActive,
          verificationOtpLogId:
            userForm.whatsappVerified &&
            userForm.mobile &&
            verifiedUserMobile === normalizeMobile(userForm.mobile)
              ? verifiedUserMobileOtpLogId
              : null,
          emailVerificationOtpLogId:
            userForm.emailVerified &&
            verifiedUserEmail === userForm.email.trim().toLowerCase()
              ? verifiedUserEmailOtpLogId
              : null,
        };
        await createUser(body);
        toast.success("User created successfully");
      }
      setShowUserModal(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleSendUserOtp = async () => {
    if (!userForm.mobile || userForm.mobile.length !== 10) {
      toast.error("Enter a valid mobile number first");
      return;
    }
    setSendingUserOtp(true);
    try {
      const result = await requestUserMobileOTP(
        normalizeMobile(userForm.mobile),
      );
      setUserOtpLogId(result.otpLogId);
      setVerifiedUserMobileOtpLogId(null);
      setUserOtpCode("");
      setUserForm((prev) => ({ ...prev, whatsappVerified: false }));
      toast.success(`WhatsApp OTP sent to ${result.mobile}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send WhatsApp OTP");
    } finally {
      setSendingUserOtp(false);
    }
  };

  const handleVerifyUserOtp = async () => {
    if (!userOtpLogId) {
      toast.error("Request OTP first");
      return;
    }
    if (userOtpCode.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setVerifyingUserOtp(true);
    try {
      const result = await verifyUserMobileOTP(
        normalizeMobile(userForm.mobile),
        userOtpCode,
        userOtpLogId,
      );
      setVerifiedUserMobile(result.verifiedMobile);
      setVerifiedUserMobileOtpLogId(result.otpLogId);
      setUserForm((prev) => ({ ...prev, whatsappVerified: true }));
      setUserOtpLogId(null);
      setUserOtpCode("");
      toast.success("User mobile verified");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify WhatsApp OTP");
    } finally {
      setVerifyingUserOtp(false);
    }
  };

  const handleSendUserEmailOtp = async () => {
    const normalizedEmail = userForm.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Enter a valid email address first");
      return;
    }
    setSendingUserEmailOtp(true);
    try {
      const result = await requestUserEmailOTP(normalizedEmail);
      setUserEmailOtpLogId(result.otpLogId);
      setVerifiedUserEmailOtpLogId(null);
      setUserEmailOtpCode("");
      setUserForm((prev) => ({ ...prev, emailVerified: false }));
      toast.success(`Email OTP sent to ${result.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send email OTP");
    } finally {
      setSendingUserEmailOtp(false);
    }
  };

  const handleVerifyUserEmailOtp = async () => {
    const normalizedEmail = userForm.email.trim().toLowerCase();
    if (!userEmailOtpLogId) {
      toast.error("Request OTP first");
      return;
    }
    if (userEmailOtpCode.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setVerifyingUserEmailOtp(true);
    try {
      const result = await verifyUserEmailOTP(
        normalizedEmail,
        userEmailOtpCode,
        userEmailOtpLogId,
      );
      setVerifiedUserEmail(result.verifiedEmail);
      setVerifiedUserEmailOtpLogId(result.otpLogId);
      setUserForm((prev) => ({ ...prev, emailVerified: true }));
      setUserEmailOtpLogId(null);
      setUserEmailOtpCode("");
      toast.success("User email verified");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify email OTP");
    } finally {
      setVerifyingUserEmailOtp(false);
    }
  };

  const resetUserMobileFlow = () => {
    setUserOtpLogId(null);
    setUserOtpCode("");
    setVerifiedUserMobileOtpLogId(null);
    setVerifiedUserMobile(null);
    setUserForm((prev) => ({ ...prev, whatsappVerified: false }));
  };

  const resetUserEmailFlow = () => {
    setUserEmailOtpLogId(null);
    setUserEmailOtpCode("");
    setVerifiedUserEmailOtpLogId(null);
    setVerifiedUserEmail(null);
    setUserForm((prev) => ({ ...prev, emailVerified: false }));
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === user?.id) {
      toast.error("Cannot delete your own account");
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Delete User",
      description: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      variant: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await deleteUser(userId);
          toast.success("User deleted successfully");
          loadUsers();
        } catch (err: any) {
          toast.error(err.message || "Failed to delete user");
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

  const handleToggleUserStatus = (u: SystemUser) => {
    const newStatus = !u.isActive;
    const action = newStatus ? "activate" : "deactivate";
    setConfirmDialog({
      open: true,
      title: `${newStatus ? "Activate" : "Deactivate"} User`,
      description: `Are you sure you want to ${action} "${u.name}"?`,
      variant: "warning",
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await updateUser(u.id, { isActive: newStatus });
          toast.success(`User ${action}d successfully`);
          loadUsers();
        } catch (err: any) {
          toast.error(err.message || "Failed to update status");
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

  // ── ROLE CRUD ──
  const handleOpenRoleModal = (r?: Role) => {
    if (r) {
      setEditingRole(r);
      setRoleForm({
        name: r.name,
        displayName: r.displayName,
        description: r.description || "",
        permissions: [...r.permissions],
        discountMin: r.discountMin ?? 0,
        discountMax: r.discountMax ?? 100,
        requireOtpForMaster: r.requireOtpForMaster ?? true,
        isActive: r.isActive,
      });
    } else {
      setEditingRole(null);
      setRoleForm({
        name: "",
        displayName: "",
        description: "",
        permissions: [],
        discountMin: 0,
        discountMax: 100,
        requireOtpForMaster: true,
        isActive: true,
      });
    }
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.displayName || roleForm.permissions.length === 0) {
      toast.error(
        "Please fill display name and select at least one permission",
      );
      return;
    }
    setRoleFormLoading(true);
    try {
      if (editingRole) {
        const { name, ...updateData } = roleForm;
        await updateRole(editingRole.id, updateData);
        toast.success("Role updated successfully");
      } else {
        if (!roleForm.name) {
          toast.error("Role name is required");
          setRoleFormLoading(false);
          return;
        }
        await createRole(roleForm);
        toast.success("Role created successfully");
      }
      setShowRoleModal(false);
      loadRoles();
      fetchRoles({ limit: 100 });
    } catch (err: any) {
      toast.error(err.message || "Failed to save role");
    } finally {
      setRoleFormLoading(false);
    }
  };

  const handleDeleteRole = (roleId: string, roleName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Role",
      description: `Are you sure you want to delete the role "${roleName}"? Users assigned to this role will be affected.`,
      variant: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await deleteRole(roleId);
          toast.success("Role deleted successfully");
          loadRoles();
          fetchRoles({ limit: 100 });
        } catch (err: any) {
          toast.error(err.message || "Failed to delete role");
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

  const togglePermission = (perm: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleGroupPermissions = (groupPerms: string[]) => {
    const allSelected = groupPerms.every((p) =>
      roleForm.permissions.includes(p),
    );
    if (allSelected) {
      setRoleForm((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !groupPerms.includes(p)),
      }));
    } else {
      setRoleForm((prev) => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...groupPerms])],
      }));
    }
  };

  // ── Skeletons ──
  const RoleCardSkeleton = () => (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="enterprise-card p-3 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-muted rounded" />
              <div>
                <div className="h-3 bg-muted rounded w-20 mb-1" />
                <div className="h-2 bg-muted rounded w-14" />
              </div>
            </div>
            <div className="h-4 bg-muted rounded w-12" />
          </div>
          <div className="h-2 bg-muted rounded w-16 mb-2" />
          <div className="flex flex-wrap gap-1 mb-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-4 bg-muted rounded w-14" />
            ))}
          </div>
          <div className="flex gap-1">
            <div className="h-6 bg-muted rounded w-14" />
            <div className="h-6 bg-muted rounded w-14" />
          </div>
        </div>
      ))}
    </div>
  );

  const MatrixSkeleton = () => (
    <div className="enterprise-card overflow-hidden animate-pulse">
      <div className="p-3 border-b border-border">
        <div className="h-4 bg-muted rounded w-36 mb-1" />
        <div className="h-3 bg-muted rounded w-28" />
      </div>
      <div className="p-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 bg-muted rounded w-28" />
            <div className="flex gap-4 flex-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-3 w-3 bg-muted rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-sm font-semibold leading-none">
            User & Role Management
          </h1>
          <p className="text-muted-foreground text-xs">
            Manage users, roles, and permissions dynamically
          </p>
        </div>
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
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-2 mt-1"
      >
        <TabsList>
          {hasPermission("user:view") && (
            <TabsTrigger value="users" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              Users{!usersLoading && usersMeta && ` (${usersMeta.totalItems})`}
            </TabsTrigger>
          )}
          {hasPermission("role:view") && (
            <TabsTrigger value="roles" className="gap-1 text-xs">
              <KeyRound className="h-3 w-3" />
              Roles ({roles.length})
            </TabsTrigger>
          )}
          {hasPermission("role:view") && (
            <TabsTrigger value="matrix" className="text-xs">
              Permission Matrix
            </TabsTrigger>
          )}
        </TabsList>

        {/* ═════ USERS TAB ═════ */}
        <TabsContent value="users" className="space-y-1">
          <div className="flex flex-col sm:flex-row gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
            <div className="flex gap-1">
              <Select
                value={userStatusFilter || "all"}
                onValueChange={(v) => setUserStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[100px] h-7 text-xs px-2">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={userRoleFilter || "all"}
                onValueChange={(v) => setUserRoleFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[110px] h-7 text-xs px-2">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasPermission("user:create") && (
                <Button
                  className="btn-accent gap-1 h-7 text-xs px-2"
                  onClick={() => handleOpenUserModal()}
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden sm:inline text-white">Add User</span>
                </Button>
              )}
            </div>
          </div>

          {usersLoading ? (
            <TableSkeleton columns={6} rows={5} showAvatar />
          ) : (
            <div className="enterprise-card overflow-hidden">
              <div className="table-container">
                <table className="enterprise-table w-full">
                  <thead>
                    <tr>
                      <th className="px-3 py-1.5 text-xs">User</th>
                      <th className="hidden sm:table-cell px-3 py-1.5 text-xs">
                        Contact
                      </th>
                      <th className="px-3 py-1.5 text-xs">Role</th>
                      <th className="hidden md:table-cell px-3 py-1.5 text-xs">
                        Status
                      </th>
                      <th className="hidden lg:table-cell px-3 py-1.5 text-xs">
                        Last Login
                      </th>
                      <th className="px-3 py-1.5 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-muted-foreground py-8 text-sm"
                        >
                          {userSearch || userStatusFilter || userRoleFilter
                            ? "No users match your filters."
                            : "No users found. Add your first user."}
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/50">
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                                <span className="text-accent font-semibold text-xs">
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm">
                                  {u.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-3 py-2 min-w-[300px]">
                            <div className="flex flex-col gap-1.5">
                              {/* Email */}
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex w-[68px] shrink-0 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    u.emailVerified
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {u.emailVerified ? (
                                    <ShieldCheck className="h-3 w-3" />
                                  ) : (
                                    <ShieldOff className="h-3 w-3" />
                                  )}
                                  Email
                                </span>

                                <span
                                  className="min-w-0 flex-1 truncate text-sm text-foreground"
                                  title={u.email}
                                >
                                  {u.email}
                                </span>
                              </div>

                              {/* Mobile */}
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex w-[68px] shrink-0 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    u.whatsappVerified
                                      ? "bg-green-100 text-green-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {u.whatsappVerified ? (
                                    <ShieldCheck className="h-3 w-3" />
                                  ) : (
                                    <ShieldOff className="h-3 w-3" />
                                  )}
                                  WA
                                </span>

                                <span
                                  className="text-sm text-foreground"
                                  title={u.mobile || ""}
                                >
                                  {u.mobile || "No mobile"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-1">
                              {getRoleIcon(u.role?.name)}
                              <span className="text-sm">
                                {u.role?.displayName}
                              </span>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-3 py-1">
                            <span
                              className={
                                u.isActive ? "badge-success" : "badge-error"
                              }
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-3 py-1 text-muted-foreground text-sm">
                            {formatDate(u.lastLogin)}
                          </td>
                          <td className="px-3 py-1">
                            <div className="flex items-center gap-0.5">
                              {hasPermission("user:edit") && (
                                <button
                                  onClick={() => handleOpenUserModal(u)}
                                  className="action-btn p-1"
                                  title="Edit"
                                >
                                  <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              )}
                              {hasPermission("user:edit") && (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className="action-btn p-1"
                                  title={u.isActive ? "Deactivate" : "Activate"}
                                >
                                  {u.isActive ? (
                                    <ShieldOff className="h-3.5 w-3.5 text-yellow-500" />
                                  ) : (
                                    <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                                  )}
                                </button>
                              )}
                              {hasPermission("user:delete") && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="action-btn action-btn-danger p-1"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {usersMeta && (
                <Pagination
                  currentPage={usersMeta.currentPage}
                  totalPages={usersMeta.totalPages}
                  totalCount={usersMeta.totalItems}
                  limit={usersMeta.limit}
                  onPageChange={setUserPage}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* ═════ ROLES TAB ═════ */}
        <TabsContent value="roles" className="space-y-1">
          <div className="flex flex-col sm:flex-row gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => handleRoleSearch(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
            {hasPermission("role:create") && (
              <Button
                className="btn-accent gap-1 h-7 text-xs px-2"
                onClick={() => handleOpenRoleModal()}
              >
                <Plus className="h-3 w-3" />
                Add Role
              </Button>
            )}
          </div>

          {rolesLoading ? (
            <RoleCardSkeleton />
          ) : roles.length === 0 ? (
            <div className="enterprise-card p-8 text-center text-muted-foreground text-sm">
              {roleSearch
                ? "No roles match your search."
                : "No roles found. Create your first role."}
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {roles.map((r) => (
                <div key={r.id} className="enterprise-card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {getRoleIcon(r.name)}
                      <div>
                        <h3 className="font-semibold text-sm">
                          {r.displayName}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {r.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.isSystem && (
                        <span className="text-xs bg-muted px-1.5 py-px rounded">
                          System
                        </span>
                      )}
                      <span
                        className={r.isActive ? "badge-success" : "badge-error"}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {r.description && (
                    <p className="text-xs text-muted-foreground mb-1.5">
                      {r.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1 bg-orange-100/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 px-1.5 py-px rounded text-xs font-medium">
                      <Percent className="h-2.5 w-2.5" />
                      Discount: {r.discountMin ?? 0}%–{r.discountMax ?? 100}%
                    </div>
                    <div
                      className={`flex items-center gap-1 px-1.5 py-px rounded text-xs font-medium ${
                        r.requireOtpForMaster
                          ? "bg-blue-100/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                          : "bg-green-100/50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                      }`}
                    >
                      <KeyRound className="h-2.5 w-2.5" />
                      Master OTP:{" "}
                      {r.requireOtpForMaster ? "Required" : "Not Required"}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    {r.permissions.length} permissions
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.permissions.slice(0, 5).map((p) => (
                      <span
                        key={p}
                        className="text-xs bg-accent/10 text-accent px-1.5 py-px rounded"
                      >
                        {permissionsMeta?.labels[p] || p}
                      </span>
                    ))}
                    {r.permissions.length > 5 && (
                      <span className="text-xs bg-muted px-1.5 py-px rounded">
                        +{r.permissions.length - 5} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {hasPermission("role:edit") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
                        onClick={() => handleOpenRoleModal(r)}
                      >
                        <Edit className="h-3 w-3 mr-0.5" />
                        Edit
                      </Button>
                    )}
                    {!r.isSystem && hasPermission("role:delete") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2 text-destructive"
                        onClick={() => handleDeleteRole(r.id, r.displayName)}
                      >
                        <Trash2 className="h-3 w-3 mr-0.5" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {rolesMeta && (
            <Pagination
              currentPage={rolesMeta.currentPage}
              totalPages={rolesMeta.totalPages}
              totalCount={rolesMeta.totalCount}
              limit={rolesMeta.limit}
              onPageChange={setRolePage}
            />
          )}
        </TabsContent>

        {/* ═════ PERMISSION MATRIX TAB ═════ */}
        <TabsContent value="matrix" className="space-y-1">
          {permissionsLoading || rolesLoading ? (
            <MatrixSkeleton />
          ) : (
            <div className="enterprise-card overflow-hidden">
              <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-sm">
                  Role Permission Matrix
                </h3>
                <p className="text-xs text-muted-foreground">
                  Live view from database
                </p>
              </div>
              <div className="table-container">
                <table className="enterprise-table w-full">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-background z-10 px-3 py-1.5 text-xs">
                        Permission
                      </th>
                      {roles.map((r) => (
                        <th
                          key={r.id}
                          className="text-center whitespace-nowrap px-3 py-1.5 text-xs"
                        >
                          <div className="flex items-center justify-center gap-1">
                            {getRoleIcon(r.name)}
                            <span>{r.displayName}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionsMeta &&
                      Object.entries(permissionsMeta.groups).map(
                        ([group, perms]) => (
                          <React.Fragment key={group}>
                            <tr>
                              <td
                                colSpan={roles.length + 1}
                                className="bg-muted/50 font-semibold text-xs px-3 py-1"
                              >
                                {group}
                              </td>
                            </tr>
                            {perms.map((perm) => (
                              <tr key={perm}>
                                <td className="pl-6 text-xs sticky left-0 bg-background px-3 py-1">
                                  {permissionsMeta.labels[perm] || perm}
                                </td>
                                {roles.map((r) => (
                                  <td
                                    key={r.id}
                                    className="text-center px-3 py-1"
                                  >
                                    {r.permissions.includes(perm) ? (
                                      <ShieldCheck className="h-3.5 w-3.5 text-green-500 mx-auto" />
                                    ) : (
                                      <ShieldOff className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </React.Fragment>
                        ),
                      )}
                    <tr>
                      <td
                        colSpan={roles.length + 1}
                        className="bg-muted/50 font-semibold text-xs px-3 py-1"
                      >
                        Role Settings
                      </td>
                    </tr>
                    <tr>
                      <td className="pl-6 text-xs sticky left-0 bg-background px-3 py-1">
                        Master OTP Required
                      </td>
                      {roles.map((r) => (
                        <td key={r.id} className="text-center px-3 py-1">
                          {r.requireOtpForMaster ? (
                            <span className="text-xs bg-blue-100/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-1.5 py-px rounded font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-1.5 py-px rounded font-medium">
                              No
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pl-6 text-xs sticky left-0 bg-background px-3 py-1">
                        Discount Range
                      </td>
                      {roles.map((r) => (
                        <td key={r.id} className="text-center px-3 py-1">
                          <span className="text-xs bg-orange-100/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 px-1.5 py-px rounded font-medium whitespace-nowrap">
                            {r.discountMin ?? 0}%–{r.discountMax ?? 100}%
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═════ USER MODAL ═════ */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Name *</Label>
              <Input
                value={userForm.name}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Full name"
                className="h-8 text-sm"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 gap-3">
              <VerificationField
                label="Mobile Number"
                value={userForm.mobile}
                onChange={(value) => {
                  const mobile = value.replace(/\D/g, "").slice(0, 10);
                  setUserForm((p) => ({
                    ...p,
                    mobile,
                    whatsappVerified:
                      verifiedUserMobile &&
                      verifiedUserMobile === normalizeMobile(mobile)
                        ? p.whatsappVerified
                        : false,
                  }));
                  if (
                    verifiedUserMobile &&
                    verifiedUserMobile !== normalizeMobile(mobile)
                  ) {
                    setVerifiedUserMobileOtpLogId(null);
                  }
                }}
                placeholder="XXXXXXXXXX"
                maxLength={10}
                inputMode="numeric"
                prefix="+91"
                verified={userForm.whatsappVerified}
                verifiedLabel="WhatsApp Verified"
                unverifiedLabel="WhatsApp Not Verified"
                otpLogId={userOtpLogId}
                otpValue={userOtpCode}
                onOtpChange={setUserOtpCode}
                onSendOtp={handleSendUserOtp}
                onVerifyOtp={handleVerifyUserOtp}
                onResetFlow={resetUserMobileFlow}
                sendingOtp={sendingUserOtp}
                verifyingOtp={verifyingUserOtp}
                sendButtonLabel="Send OTP"
                resendButtonLabel="Send Again"
                isValueValid={!userForm.mobile || userForm.mobile.length === 10}
              />
              <VerificationField
                label="Email"
                required
                value={userForm.email}
                onChange={(value) => {
                  setUserForm((p) => ({
                    ...p,
                    email: value,
                    emailVerified:
                      verifiedUserEmail &&
                      verifiedUserEmail === value.trim().toLowerCase()
                        ? p.emailVerified
                        : false,
                  }));
                  if (
                    verifiedUserEmail &&
                    verifiedUserEmail !== value.trim().toLowerCase()
                  ) {
                    setVerifiedUserEmailOtpLogId(null);
                  }
                }}
                placeholder="user@company.com"
                type="email"
                verified={userForm.emailVerified}
                verifiedLabel="Email Verified"
                unverifiedLabel="Email Not Verified"
                otpLogId={userEmailOtpLogId}
                otpValue={userEmailOtpCode}
                onOtpChange={setUserEmailOtpCode}
                onSendOtp={handleSendUserEmailOtp}
                onVerifyOtp={handleVerifyUserEmailOtp}
                onResetFlow={resetUserEmailFlow}
                sendingOtp={sendingUserEmailOtp}
                verifyingOtp={verifyingUserEmailOtp}
                sendButtonLabel="Send OTP"
                resendButtonLabel="Send Again"
                isValueValid={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                  userForm.email.trim().toLowerCase() || "invalid",
                )}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {editingUser
                  ? "New Password (leave blank to keep)"
                  : "Password *"}
              </Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="Min 6 characters"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Role *</Label>
              <Select
                value={userForm.roleId}
                onValueChange={(v) => setUserForm((p) => ({ ...p, roleId: v }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r.isActive)
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select
                value={userForm.isActive ? "active" : "inactive"}
                onValueChange={(v) =>
                  setUserForm((p) => ({ ...p, isActive: v === "active" }))
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowUserModal(false)}
              disabled={userFormLoading}
            >
              Cancel
            </Button>
            <Button
              className="btn-accent h-7 text-xs"
              onClick={handleSaveUser}
              disabled={userFormLoading}
            >
              {userFormLoading ? (
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {editingUser ? "Updating..." : "Creating..."}
                </div>
              ) : editingUser ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═════ ROLE MODAL ═════ */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!editingRole && (
              <div className="space-y-1">
                <Label className="text-xs">Role Name (slug) *</Label>
                <Input
                  value={roleForm.name}
                  onChange={(e) =>
                    setRoleForm((p) => ({
                      ...p,
                      name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                    }))
                  }
                  placeholder="e.g. supervisor"
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters and underscores only
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Display Name *</Label>
              <Input
                value={roleForm.displayName}
                onChange={(e) =>
                  setRoleForm((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="e.g. Supervisor"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Input
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="What this role does"
                className="h-8 text-sm"
              />
            </div>

            {/* Discount Range */}
            <div className="border rounded-lg p-3 bg-orange-50/50 dark:bg-orange-950/10 border-orange-200/30 space-y-2">
              <div className="flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-orange-600" />
                <Label className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                  Discount Range
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">
                    Min Discount (%)
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={roleForm.discountMin}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(
                            roleForm.discountMax,
                            Number(e.target.value),
                          ),
                        );
                        setRoleForm((p) => ({ ...p, discountMin: val }));
                      }}
                      className="h-8 text-sm"
                      min={0}
                      max={100}
                      step={0.5}
                      disabled={editingRole?.name === "admin"}
                    />
                    <Percent className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">
                    Max Discount (%)
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      value={roleForm.discountMax}
                      onChange={(e) => {
                        const val = Math.max(
                          roleForm.discountMin,
                          Math.min(100, Number(e.target.value)),
                        );
                        setRoleForm((p) => ({ ...p, discountMax: val }));
                      }}
                      className="h-8 text-sm"
                      min={0}
                      max={100}
                      step={0.5}
                      disabled={editingRole?.name === "admin"}
                    />
                    <Percent className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full absolute"
                    style={{
                      left: `${roleForm.discountMin}%`,
                      width: `${roleForm.discountMax - roleForm.discountMin}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span className="font-semibold text-orange-600">
                    {roleForm.discountMin}% — {roleForm.discountMax}%
                  </span>
                  <span>100%</span>
                </div>
              </div>
              {editingRole?.name === "admin" && (
                <p className="text-[10px] text-amber-600 font-medium">
                  Admin role always has full discount range (0%–100%)
                </p>
              )}
            </div>

            {/* OTP for Master Data */}
            <div className="border rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/10 border-blue-200/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-blue-600" />
                  <Label className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    OTP for Master Data
                  </Label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleForm.requireOtpForMaster}
                    onChange={(e) =>
                      setRoleForm((p) => ({
                        ...p,
                        requireOtpForMaster: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                    disabled={editingRole?.name === "admin"}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-gray-600 peer-checked:bg-blue-600" />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                {roleForm.requireOtpForMaster
                  ? "Users with this role must verify OTP when creating or activating master data."
                  : "Users with this role can create and activate master data without OTP verification."}
              </p>
              {editingRole?.name === "admin" && (
                <p className="text-[10px] text-amber-600 font-medium">
                  Admin role never requires OTP for master data operations.
                </p>
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Permissions ({roleForm.permissions.length} selected)
              </Label>
              {permissionsMeta &&
                Object.entries(permissionsMeta.groups).map(([group, perms]) => {
                  const allSelected = perms.every((p) =>
                    roleForm.permissions.includes(p),
                  );
                  const someSelected = perms.some((p) =>
                    roleForm.permissions.includes(p),
                  );
                  return (
                    <div key={group} className="border rounded-lg p-2 mb-1.5">
                      <label className="flex items-center gap-1.5 mb-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el)
                              el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleGroupPermissions(perms)}
                          className="rounded"
                        />
                        <span className="font-semibold text-xs">{group}</span>
                      </label>
                      <div className="grid grid-cols-2 gap-0.5 pl-5">
                        {perms.map((perm) => (
                          <label
                            key={perm}
                            className="flex items-center gap-1.5 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={roleForm.permissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                              className="rounded"
                            />
                            {permissionsMeta.labels[perm] || perm}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowRoleModal(false)}
              disabled={roleFormLoading}
            >
              Cancel
            </Button>
            <Button
              className="btn-accent h-7 text-xs"
              onClick={handleSaveRole}
              disabled={roleFormLoading}
            >
              {roleFormLoading ? (
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {editingRole ? "Updating..." : "Creating..."}
                </div>
              ) : editingRole ? (
                "Update Role"
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        loading={confirmDialog.loading}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

export default UserManagement;
