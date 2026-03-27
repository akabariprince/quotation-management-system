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

const PAGE_LIMIT = 10;

const UserManagement: React.FC = () => {
  const { user, hasPermission } = useAuth();

  // Hooks
  const {
    users,
    meta: usersMeta,
    loading: usersLoading,
    fetchUsers,
    createUser,
    updateUser,
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

  // Search & filter state
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);

  const [roleSearch, setRoleSearch] = useState("");
  const [rolePage, setRolePage] = useState(1);

  // Debounce
  const userSearchTimer = useRef<NodeJS.Timeout | null>(null);
  const roleSearchTimer = useRef<NodeJS.Timeout | null>(null);

  // User modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    isActive: true,
  });

  // Role modal
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

  // Confirm dialog
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
    onConfirm: () => { },
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

  // Initial load
  useEffect(() => {
    loadUsers(1);
    loadRoles(1);
    fetchRoles({ limit: 100 }); // For dropdowns
    fetchPermissionsMeta();
  }, []);

  // Refetch on filter changes
  useEffect(() => {
    loadUsers(1);
    setUserPage(1);
  }, [userStatusFilter, userRoleFilter]);

  // Refetch on page changes
  useEffect(() => {
    loadUsers(userPage);
  }, [userPage]);

  useEffect(() => {
    loadRoles(rolePage);
  }, [rolePage]);

  // Debounced search for users
  const handleUserSearch = (value: string) => {
    setUserSearch(value);
    if (userSearchTimer.current) clearTimeout(userSearchTimer.current);
    userSearchTimer.current = setTimeout(() => {
      setUserPage(1);
      loadUsers(1, value);
    }, 400);
  };

  // Debounced search for roles
  const handleRoleSearch = (value: string) => {
    setRoleSearch(value);
    if (roleSearchTimer.current) clearTimeout(roleSearchTimer.current);
    roleSearchTimer.current = setTimeout(() => {
      setRolePage(1);
      loadRoles(1, value);
    }, 400);
  };

  // ── Helpers ──
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
        return <ShieldCheck className="h-4 w-4 text-accent" />;
      case "master":
        return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      case "creator":
        return <Shield className="h-4 w-4 text-primary" />;
      default:
        return <ShieldOff className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // ── USER CRUD ──
  const handleOpenUserModal = (u?: SystemUser) => {
    if (u) {
      setEditingUser(u);
      setUserForm({
        name: u.name,
        email: u.email,
        password: "",
        roleId: u.roleId,
        isActive: u.isActive,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        password: "",
        roleId: "",
        isActive: true,
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
        const body: any = { ...userForm };
        if (!body.password) delete body.password;
        await updateUser(editingUser.id, body);
        toast.success("User updated successfully");
      } else {
        if (!userForm.password) {
          toast.error("Password is required for new user");
          setUserFormLoading(false);
          return;
        }
        await createUser(userForm);
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
        // Don't send 'name' for updates (slug is immutable)
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
      fetchRoles({ limit: 100 }); // Refresh dropdown data
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
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="enterprise-card p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-muted rounded" />
              <div>
                <div className="h-4 bg-muted rounded w-24 mb-1" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
            <div className="h-5 bg-muted rounded w-14" />
          </div>
          <div className="h-3 bg-muted rounded w-20 mb-3" />
          <div className="flex flex-wrap gap-1 mb-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-5 bg-muted rounded w-16" />
            ))}
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-muted rounded w-16" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  const MatrixSkeleton = () => (
    <div className="enterprise-card overflow-hidden animate-pulse">
      <div className="p-4 border-b border-border">
        <div className="h-5 bg-muted rounded w-40 mb-2" />
        <div className="h-3 bg-muted rounded w-32" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="flex gap-6 flex-1">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-4 bg-muted rounded" />
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
      <div className="page-header">
        <div>
          <h1 className="page-title">User & Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, roles, and permissions dynamically
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2" size="sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
        </Link>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          {hasPermission("user:view") && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
              {!usersLoading && usersMeta && ` (${usersMeta.totalItems})`}
            </TabsTrigger>
          )}
          {hasPermission("role:view") && (
            <TabsTrigger value="roles" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Roles ({roles.length})
            </TabsTrigger>
          )}
          {hasPermission("role:view") && (
            <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          )}
        </TabsList>

        {/* ═════ USERS TAB ═════ */}
        <TabsContent value="users" className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={userStatusFilter || "all"}
                onValueChange={(v) => setUserStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[130px]">
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
                <SelectTrigger className="w-[150px]">
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
                  className="btn-accent gap-2"
                  onClick={() => handleOpenUserModal()}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add User</span>
                </Button>
              )}
            </div>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <TableSkeleton columns={6} rows={5} showAvatar />
          ) : (
            <div className="enterprise-card overflow-hidden mt-4">
              <div className="table-container">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th className="hidden sm:table-cell">Email</th>
                      <th>Role</th>
                      <th className="hidden md:table-cell">Status</th>
                      <th className="hidden lg:table-cell">Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-muted-foreground py-12"
                        >
                          {userSearch || userStatusFilter || userRoleFilter
                            ? "No users match your filters. Try different criteria."
                            : "No users found. Add your first user."}
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                                <span className="text-accent font-semibold text-sm">
                                  {u.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell text-muted-foreground">
                            {u.email}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(u.role?.name)}
                              <span className="text-sm">
                                {u.role?.displayName}
                              </span>
                            </div>
                          </td>
                          <td className="hidden md:table-cell">
                            <span
                              className={
                                u.isActive ? "badge-success" : "badge-error"
                              }
                            >
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell text-muted-foreground">
                            {formatDate(u.lastLogin)}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {hasPermission("user:edit") && (
                                <button
                                  onClick={() => handleOpenUserModal(u)}
                                  className="action-btn"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4 text-muted-foreground" />
                                </button>
                              )}
                              {hasPermission("user:edit") && (
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className="action-btn"
                                  title={u.isActive ? "Deactivate" : "Activate"}
                                >
                                  {u.isActive ? (
                                    <ShieldOff className="h-4 w-4 text-yellow-500" />
                                  ) : (
                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                  )}
                                </button>
                              )}
                              {hasPermission("user:delete") && (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="action-btn action-btn-danger"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
        <TabsContent value="roles" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => handleRoleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {hasPermission("role:create") && (
              <Button
                className="btn-accent gap-2"
                onClick={() => handleOpenRoleModal()}
              >
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            )}
          </div>

          {rolesLoading ? (
            <RoleCardSkeleton />
          ) : roles.length === 0 ? (
            <div className="enterprise-card p-12 text-center text-muted-foreground">
              {roleSearch
                ? "No roles match your search. Try different keywords."
                : "No roles found. Create your first role."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {roles.map((r) => (
                <div key={r.id} className="enterprise-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(r.name)}
                      <div>
                        <h3 className="font-semibold">{r.displayName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {r.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.isSystem && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
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
                    <p className="text-sm text-muted-foreground mb-2">
                      {r.description}
                    </p>
                  )}

                  {/* Badges: discount + OTP */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 bg-orange-100/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded text-xs font-medium">
                      <Percent className="h-3 w-3" />
                      Discount: {r.discountMin ?? 0}% – {r.discountMax ?? 100}%
                    </div>
                    <div
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${r.requireOtpForMaster
                        ? "bg-blue-100/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                        : "bg-green-100/50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                        }`}
                    >
                      <KeyRound className="h-3 w-3" />
                      Master OTP:{" "}
                      {r.requireOtpForMaster ? "Required" : "Not Required"}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {r.permissions.length} permissions
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {r.permissions.slice(0, 5).map((p) => (
                      <span
                        key={p}
                        className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded"
                      >
                        {permissionsMeta?.labels[p] || p}
                      </span>
                    ))}
                    {r.permissions.length > 5 && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        +{r.permissions.length - 5} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {hasPermission("role:edit") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRoleModal(r)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {!r.isSystem && hasPermission("role:delete") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleDeleteRole(r.id, r.displayName)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
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
        <TabsContent value="matrix" className="space-y-4">
          {permissionsLoading || rolesLoading ? (
            <MatrixSkeleton />
          ) : (
            <div className="enterprise-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Role Permission Matrix</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Live view from database
                </p>
              </div>
              <div className="table-container">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-background z-10">
                        Permission
                      </th>
                      {roles.map((r) => (
                        <th
                          key={r.id}
                          className="text-center whitespace-nowrap"
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
                                className="bg-muted/50 font-semibold text-sm"
                              >
                                {group}
                              </td>
                            </tr>
                            {perms.map((perm) => (
                              <tr key={perm}>
                                <td className="pl-6 text-sm sticky left-0 bg-background">
                                  {permissionsMeta.labels[perm] || perm}
                                </td>
                                {roles.map((r) => (
                                  <td key={r.id} className="text-center">
                                    {r.permissions.includes(perm) ? (
                                      <ShieldCheck className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <ShieldOff className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </React.Fragment>
                        ),
                      )}

                    {/* Extra row: OTP requirement */}
                    <tr>
                      <td
                        colSpan={roles.length + 1}
                        className="bg-muted/50 font-semibold text-sm"
                      >
                        Role Settings
                      </td>
                    </tr>
                    <tr>
                      <td className="pl-6 text-sm sticky left-0 bg-background">
                        Master OTP Required
                      </td>
                      {roles.map((r) => (
                        <td key={r.id} className="text-center">
                          {r.requireOtpForMaster ? (
                            <span className="text-xs bg-blue-100/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded font-medium">
                              Yes
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded font-medium">
                              No
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="pl-6 text-sm sticky left-0 bg-background">
                        Discount Range
                      </td>
                      {roles.map((r) => (
                        <td key={r.id} className="text-center">
                          <span className="text-xs bg-orange-100/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                            {r.discountMin ?? 0}% – {r.discountMax ?? 100}%
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
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={userForm.name}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="user@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>
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
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={userForm.roleId}
                onValueChange={(v) => setUserForm((p) => ({ ...p, roleId: v }))}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={userForm.isActive ? "active" : "inactive"}
                onValueChange={(v) =>
                  setUserForm((p) => ({ ...p, isActive: v === "active" }))
                }
              >
                <SelectTrigger>
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
              onClick={() => setShowUserModal(false)}
              disabled={userFormLoading}
            >
              Cancel
            </Button>
            <Button
              className="btn-accent"
              onClick={handleSaveUser}
              disabled={userFormLoading}
            >
              {userFormLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
            <DialogTitle>
              {editingRole ? "Edit Role" : "Create New Role"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Role Name (slug) — only on create */}
            {!editingRole && (
              <div className="space-y-2">
                <Label>Role Name (slug) *</Label>
                <Input
                  value={roleForm.name}
                  onChange={(e) =>
                    setRoleForm((p) => ({
                      ...p,
                      name: e.target.value.toLowerCase().replace(/\s/g, "_"),
                    }))
                  }
                  placeholder="e.g. supervisor"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters and underscores only
                </p>
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <Label>Display Name *</Label>
              <Input
                value={roleForm.displayName}
                onChange={(e) =>
                  setRoleForm((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="e.g. Supervisor"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="What this role does"
              />
            </div>

            {/* ── Discount Range ── */}
            <div className="border rounded-lg p-4 bg-orange-50/50 dark:bg-orange-950/10 border-orange-200/30 space-y-3">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-orange-600" />
                <Label className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  Discount Range
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Min Discount (%)
                  </Label>
                  <div className="flex items-center gap-2">
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
                      className="h-9"
                      min={0}
                      max={100}
                      step={0.5}
                      disabled={editingRole?.name === "admin"}
                    />
                    <Percent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Max Discount (%)
                  </Label>
                  <div className="flex items-center gap-2">
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
                      className="h-9"
                      min={0}
                      max={100}
                      step={0.5}
                      disabled={editingRole?.name === "admin"}
                    />
                    <Percent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Visual range bar */}
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden relative">
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
                  Admin role always has full discount range (0% – 100%)
                </p>
              )}
            </div>

            {/* ── OTP for Master Data ── */}
            <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/10 border-blue-200/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-semibold text-blue-700 dark:text-blue-400">
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-blue-600" />
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

            {/* ── Permissions ── */}
            <div className="space-y-2">
              <Label>
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
                    <div key={group} className="border rounded-lg p-3 mb-2">
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
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
                        <span className="font-semibold text-sm">{group}</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1 pl-6">
                        {perms.map((perm) => (
                          <label
                            key={perm}
                            className="flex items-center gap-2 cursor-pointer text-sm"
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
              onClick={() => setShowRoleModal(false)}
              disabled={roleFormLoading}
            >
              Cancel
            </Button>
            <Button
              className="btn-accent"
              onClick={handleSaveRole}
              disabled={roleFormLoading}
            >
              {roleFormLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

      {/* ═════ CONFIRM DIALOG ═════ */}
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
