import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  DollarSign,
  AlertCircle,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Shield,
  Eye,
  Edit,
  ChevronRight,
  Sparkles,
  Loader2,
  Package,
  Database,
  UserCog,
  Mail,
  BarChart3,
  FolderKanban,
  FilePlus,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import { getVisibleNavItems, type NavItem } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────

const CARD_HEIGHT = 150; // px – single source of truth

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalProjects: number;
  totalValue: number;
  approvedValue: number;
  projectsByStatus: any[];
  recentProjects: any[];
  monthlyRevenue: any[];
}

// ─── Utility Functions ──────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return "badge-success";
    case "sent":
      return "badge-warning";
    case "expired":
      return "badge-error";
    default:
      return "badge-default";
  }
};

// ─── Skeleton Components ────────────────────────────────────────────────────

const NavCardSkeleton: React.FC = () => (
  <div
    className="enterprise-card p-4 flex items-center"
    style={{ height: `${CARD_HEIGHT}px` }}
  >
    <Skeleton className="h-16 w-16 rounded-xl flex-shrink-0" />
    <div className="flex-1 ml-4 space-y-2">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-end pt-2">
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
    <Skeleton className="h-4 w-4 ml-3" />
  </div>
);

const NavigationGridSkeleton: React.FC = () => (
  <div className="space-y-6">
    {[3, 2, 5].map((count, section) => (
      <div key={section}>
        <Skeleton className="h-4 w-28 mb-3 ml-1" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <NavCardSkeleton key={i} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ModuleGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="enterprise-card p-7"
        style={{ height: `${CARD_HEIGHT}px` }}
      >
        <div className="flex items-start justify-between mb-5">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    ))}
  </div>
);

const RecentTableSkeleton: React.FC = () => (
  <div className="enterprise-card overflow-hidden">
    <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-20" />
    </div>
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="hidden sm:table-cell">
              <Skeleton className="h-4 w-24" />
            </th>
            <th className="hidden md:table-cell">
              <Skeleton className="h-4 w-16" />
            </th>
            <th>
              <Skeleton className="h-4 w-20" />
            </th>
            <th>
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>
              <td>
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="hidden sm:table-cell">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </td>
              <td>
                <Skeleton className="h-4 w-24" />
              </td>
              <td>
                <Skeleton className="h-6 w-16 rounded-full" />
              </td>
              <td>
                <Skeleton className="h-4 w-8" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const InfoPanelSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="enterprise-card p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="pt-4 border-t border-border space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
    <div className="enterprise-card p-6">
      <Skeleton className="h-5 w-24 mb-3" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

const AdminDashboardSkeleton: React.FC = () => (
  <div className="animate-fade-in">
    <div className="page-header">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56 mt-2" />
      </div>
      <Skeleton className="h-9 w-32 rounded-xl" />
    </div>
    <NavigationGridSkeleton />
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
      <div className="xl:col-span-2">
        <RecentTableSkeleton />
      </div>
      <div className="enterprise-card p-5">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-4 w-full mb-3" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const RoleDashboardSkeleton: React.FC = () => (
  <div className="animate-fade-in">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <ModuleGridSkeleton />
      </div>
      <InfoPanelSkeleton />
    </div>
  </div>
);

// ─── Recent Projects Table Component ────────────────────────────────────────

interface RecentProjectsTableProps {
  recentProjects: any[];
  hasPermission: (p: string) => boolean;
  className?: string;
}

const RecentProjectsTable: React.FC<RecentProjectsTableProps> = ({
  recentProjects,
  hasPermission,
  className,
}) => (
  <div className={cn("enterprise-card overflow-hidden", className)}>
    <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
      <h2 className="font-bold text-foreground">Recent Projects</h2>
      {hasPermission("project:view") && (
        <Link
          to="/projects"
          className="text-sm text-accent font-semibold hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>Project No</th>
            <th className="hidden sm:table-cell">Customer</th>
            <th className="hidden md:table-cell">Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {recentProjects.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center text-muted-foreground py-12"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-accent/30" />
                <p>No projects yet.</p>
                {hasPermission("project:create") && (
                  <Link to="/projects/new">
                    <Button variant="outline" size="sm" className="mt-3 gap-2">
                      <Plus className="h-4 w-4" />
                      Create First Project
                    </Button>
                  </Link>
                )}
              </td>
            </tr>
          ) : (
            recentProjects.map((project: any) => (
              <tr key={project.id} className="group">
                <td className="font-semibold">
                  <Link
                    to={`/projects/${project.id}`}
                    className="hover:text-accent transition-colors"
                  >
                    {project.projectNo || "N/A"}
                  </Link>
                </td>
                <td className="hidden sm:table-cell">
                  {project.customer?.name || "Unknown"}
                </td>
                <td className="hidden md:table-cell text-muted-foreground">
                  {formatDate(project.date || project.createdAt)}
                </td>
                <td className="font-bold text-primary">
                  {formatCurrency(
                    Number(
                      project.grandTotalWithGst ||
                        project.grand_total_with_gst ||
                        0,
                    ),
                  )}
                </td>
                <td>
                  <span className={getStatusBadge(project.status)}>
                    {project.status.charAt(0).toUpperCase() +
                      project.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      to={`/projects/${project.id}`}
                      className="p-1.5 rounded-lg hover:bg-secondary/30 transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    {hasPermission("project:edit") && (
                      <Link
                        to={`/projects/edit/${project.id}`}
                        className="p-1.5 rounded-lg hover:bg-secondary/30 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

interface AdminDashboardProps {
  stats: DashboardStats | null;
  pendingOtpApprovals: number;
  loading: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  pendingOtpApprovals,
  loading,
}) => {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  const recentProjects = stats?.recentProjects || [];

  // Navigation items
  const allNavigationItems = [
    {
      category: "Main",
      items: [
        {
          label: "Projects",
          description: "View and manage all projects",
          icon: FolderKanban,
          path: "/projects",
          show: hasPermission("project:view"),
        },
        {
          label: "Customers",
          description: "Manage customer database",
          icon: Users,
          path: "/customers",
          show: hasPermission("customer:view"),
        },
        {
          label: "Products",
          description: "Browse quotation catalog",
          icon: Package,
          path: "/products",
          show: hasPermission("product:view"),
        },
      ],
    },
    {
      category: "Create",
      items: [
        {
          label: "New Project",
          description: "Create a new project",
          icon: FilePlus,
          path: "/projects/new",
          show: hasPermission("project:create"),
        },
        {
          label: "Add Customer",
          description: "Register a new customer",
          icon: UserPlus,
          path: "/customers/new",
          show: hasPermission("customer:create"),
        },
      ],
    },
    {
      category: "Administration",
      items: [
        {
          label: "Masters",
          description: "Manage master data & quotations",
          icon: Database,
          path: "/masters",
          show: hasAnyPermission("master:view", "master:manage"),
        },
        {
          label: "Approvals",
          description: "Review OTP & discount approvals",
          icon: Shield,
          path: "/approvals",
          show: hasAnyPermission("approval:view", "approval:manage"),
        },
        {
          label: "User Management",
          description: "Manage users and roles",
          icon: UserCog,
          path: "/users",
          show: hasAnyPermission("user:view", "role:view"),
        },
        {
          label: "Email Logs",
          description: "View sent email history",
          icon: Mail,
          path: "/email-logs",
          show: hasPermission("email_log:view"),
        },
        {
          label: "MIS Reports",
          description: "Analytics and insights",
          icon: BarChart3,
          path: "/reports",
          show: hasPermission("report:view"),
        },
      ],
    },
  ];

  const visibleCategories = allNavigationItems
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.show),
    }))
    .filter((cat) => cat.items.length > 0);

  if (loading) return <AdminDashboardSkeleton />;

  return (
    <div className="animate-fade-in">
      {/* Header — only Analytics button */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/reports">
            <Button className="btn-accent gap-2" size="sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Navigation Grid — 150px cards */}
      <div className="space-y-6 mt-4">
        {visibleCategories.map((category) => (
          <div key={category.category}>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {category.category}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {category.items.map((item) => {
                const cardH = CARD_HEIGHT;
                const rawIconSize = Math.round(cardH * 0.45);
                const iconContainerSize = Math.max(
                  48,
                  Math.min(96, rawIconSize),
                );
                const svgSize = Math.round(iconContainerSize * 0.64);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{ height: `${cardH}px` }}
                    className="enterprise-card p-4 hover:shadow-lg hover:border-accent/30 transition-all duration-200 group cursor-pointer flex items-center"
                  >
                    {/* LEFT ICON */}
                    <div
                      aria-hidden="true"
                      className="rounded-xl bg-accent/10 group-hover:bg-accent group-hover:text-white transition-colors flex items-center justify-center flex-shrink-0"
                      style={{
                        width: `${iconContainerSize}px`,
                        height: `${iconContainerSize}px`,
                        minWidth: `${iconContainerSize}px`,
                      }}
                    >
                      <item.icon
                        style={{
                          width: `${svgSize}px`,
                          height: `${svgSize}px`,
                        }}
                        className="text-accent group-hover:text-white"
                        aria-hidden="true"
                      />
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="flex-1 flex flex-col justify-between ml-4 min-w-0 h-full py-1">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* BUTTON */}
                      <div className="flex justify-end">
                        <span className="text-xs px-3 py-1.5 rounded-md bg-accent/10 group-hover:bg-accent text-accent group-hover:text-white transition-all font-semibold leading-none">
                          Open
                        </span>
                      </div>
                    </div>

                    {/* RIGHT ARROW */}
                    <div className="ml-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          {hasAnyPermission("approval:view", "approval:manage") &&
            pendingOtpApprovals > 0 && (
              <div className="enterprise-card p-5 border-l-4 border-l-accent">
                <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  Pending Approvals
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  You have {pendingOtpApprovals} pending OTP approval
                  {pendingOtpApprovals > 1 ? "s" : ""}.
                </p>
                <Link to="/approvals">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Shield className="h-4 w-4" />
                    Review Approvals
                  </Button>
                </Link>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// ROLE-BASED DASHBOARD (Non-Admin) — Large Cards
// ════════════════════════════════════════════════════════════════════════════

interface RoleDashboardProps {
  modules: NavItem[];
  stats: DashboardStats | null;
  pendingOtpApprovals: number;
  loading: boolean;
}

const RoleDashboard: React.FC<RoleDashboardProps> = ({
  modules,
  stats,
  pendingOtpApprovals,
  loading,
}) => {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  const totalProjects = stats?.totalProjects || 0;
  const activeCustomers = stats?.totalCustomers || 0;

  if (loading) return <RoleDashboardSkeleton />;

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* ─── Left: Module Grid ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Select a module to get started
            </p>
          </div>

          {/* Module Cards Grid */}
          {modules.length === 0 ? (
            <div className="enterprise-card p-14 text-center">
              <Sparkles className="h-14 w-14 text-accent/20 mx-auto mb-4" />
              <h3 className="font-bold text-foreground text-lg mb-2">
                No Modules Available
              </h3>
              <p className="text-sm text-muted-foreground">
                You don't have access to any modules yet.
                <br />
                Please contact your administrator for permissions.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Modules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {modules.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{ height: `${CARD_HEIGHT}px` }}
                    className={cn(
                      "group relative enterprise-card p-7 text-left",
                      "hover:shadow-xl hover:-translate-y-1",
                      "transition-all duration-300 ease-out",
                      "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2",
                    )}
                  >
                    {/* Top accent bar on hover */}
                    <div
                      className={cn(
                        "absolute top-0 left-0 right-0 h-1 bg-accent rounded-t-xl",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      )}
                    />

                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          "transition-all duration-300",
                          "group-hover:scale-110 group-hover:shadow-lg",
                          "bg-accent text-white",
                        )}
                      >
                        <item.icon className="h-6 w-6" />
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-5 w-5 text-muted-foreground/0 group-hover:text-accent",
                          "transition-all duration-300 group-hover:translate-x-1",
                        )}
                      />
                    </div>

                    <h3 className="font-bold text-foreground text-base mb-1 group-hover:text-accent transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: Info Panel ─── */}
        <div className="space-y-4">
          {/* User Card */}
          <div className="enterprise-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-accent/15 rounded-2xl flex items-center justify-center border-2 border-accent/20">
                <span className="text-accent font-bold text-xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">
                  {user?.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email}
                </p>
                <span className="inline-block text-xs bg-accent/10 text-accent px-2.5 py-0.5 rounded-full font-semibold mt-1.5 border border-accent/20">
                  {user?.role?.displayName}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-primary/10 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Modules</span>
                <span className="font-bold text-primary">{modules.length}</span>
              </div>
              {hasPermission("project:view") && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Projects</span>
                  <span className="font-bold text-primary">
                    {totalProjects}
                  </span>
                </div>
              )}
              {hasPermission("customer:view") && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Customers</span>
                  <span className="font-bold text-primary">
                    {activeCustomers}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pending Approvals Alert */}
          {hasAnyPermission("approval:view", "approval:manage") &&
            pendingOtpApprovals > 0 && (
              <div className="enterprise-card p-5 border-l-4 border-l-accent">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  Pending Approvals
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {pendingOtpApprovals} OTP approval
                  {pendingOtpApprovals > 1 ? "s" : ""} waiting for review.
                </p>
                <Link to="/approvals">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Shield className="h-4 w-4" />
                    Review Now
                  </Button>
                </Link>
              </div>
            )}

          {/* Date */}
          <div className="enterprise-card p-6">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Today
            </h3>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const Dashboard: React.FC = () => {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const api = useApi();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingOtpApprovals, setPendingOtpApprovals] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role?.name === "admin";

  // Modules accessible to non-admin users (exclude dashboard from grid)
  const accessibleModules = getVisibleNavItems(
    hasPermission,
    hasAnyPermission,
    ["/dashboard"],
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const dashRes = await api.get("/dashboard/stats");
      if (dashRes.success) {
        setStats(dashRes.data);
      }

      if (hasAnyPermission("approval:view", "approval:manage")) {
        try {
          const otpRes = await api.get("/otp-logs/pending?limit=1");
          if (otpRes.success && otpRes.meta) {
            setPendingOtpApprovals(otpRes.meta.totalItems || 0);
          }
        } catch {
          setPendingOtpApprovals(0);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    }
    setLoading(false);
  };

  if (isAdmin) {
    return (
      <AdminDashboard
        stats={stats}
        pendingOtpApprovals={pendingOtpApprovals}
        loading={loading}
      />
    );
  }

  return (
    <RoleDashboard
      modules={accessibleModules}
      stats={stats}
      pendingOtpApprovals={pendingOtpApprovals}
      loading={loading}
    />
  );
};

export default Dashboard;
