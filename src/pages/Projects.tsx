// src/pages/Projects.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Download,
  Copy,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import TableSkeleton from "@/components/common/TableSkeleton";

const PAGE_SIZE = 10;

const Projects: React.FC = () => {
  const { hasPermission } = useAuth();
  const {
    projects,
    meta,
    loading,
    fetchProjects,
    deleteProject,
    duplicateProject,
  } = useProjects();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    loading: false,
  });

  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const loadProjects = useCallback(
    (page?: number, search?: string, status?: string) => {
      const p = page ?? currentPage;
      const s = search ?? searchTerm;
      const st = status ?? statusFilter;
      const params: any = {
        page: p,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "DESC",
      };
      if (s) params.search = s;
      if (st && st !== "all") params.status = st;
      fetchProjects(params);
    },
    [currentPage, searchTerm, statusFilter, fetchProjects],
  );

  useEffect(() => {
    loadProjects(1);
  }, []);
  useEffect(() => {
    loadProjects(currentPage);
  }, [currentPage]);
  useEffect(() => {
    setCurrentPage(1);
    loadProjects(1, searchTerm, statusFilter);
  }, [statusFilter]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      loadProjects(1, value);
    }, 400);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handleDelete = (id: string, projectNo: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Project",
      description: `Are you sure you want to delete project "${projectNo}"? This action cannot be undone and all associated items will be removed.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await deleteProject(id);
          toast.success("Project deleted successfully");
          loadProjects();
        } catch (err: any) {
          toast.error(err?.message || "Failed to delete project");
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

  const handleDuplicate = async (projectId: string) => {
    try {
      const duplicated = await duplicateProject(projectId);
      toast.success(`Project duplicated as ${duplicated.projectNo}`);
      navigate(`/projects/edit/${duplicated.id}`);
    } catch {
      toast.error("Failed to duplicate project");
    }
  };

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

  const totalPages = meta?.totalPages || 1;
  const totalCount = meta?.totalCount || 0;
  const hasActiveFilters = searchTerm || statusFilter !== "all";

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-sm font-semibold leading-none">Projects</h1>
          <p className="text-muted-foreground text-xs">
            Manage and track all projects
          </p>
        </div>
        <div className="flex gap-1">
          <Link to="/dashboard">
            <Button
              variant="outline"
              className="gap-1 h-7 text-xs px-2"
              size="sm"
            >
              <ArrowLeft className="h-3 w-3" />
              <span className="hidden sm:inline text-white">Back to Dashboard</span>
            </Button>
          </Link>
          {hasPermission("project:create") && (
            <Link to="/projects/new">
              <Button className="btn-accent gap-1 h-7 text-xs px-2" size="sm">
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline text-white">Add Project</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="enterprise-card p-2 mt-1">
        <div className="flex flex-col sm:flex-row items-center gap-1.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by project number, project name, or customer..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[120px] h-7 text-xs px-2">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!loading && totalCount > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {totalCount} project{totalCount !== 1 ? "s" : ""} found
          </div>
        )}
      </div>

      {/* Projects Table */}
      {loading ? (
        <TableSkeleton columns={7} rows={PAGE_SIZE} />
      ) : (
        <div className="enterprise-card overflow-hidden mt-1">
          <div className="table-container">
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  <th className="px-3 py-1.5 text-xs">Project No</th>
                  <th className="hidden lg:table-cell px-3 py-1.5 text-xs">
                    Project Name
                  </th>
                  <th className="hidden sm:table-cell px-3 py-1.5 text-xs">
                    Customer
                  </th>
                  <th className="hidden md:table-cell px-3 py-1.5 text-xs">
                    Date
                  </th>
                  <th className="px-3 py-1.5 text-xs">Total Value</th>
                  <th className="hidden sm:table-cell px-3 py-1.5 text-xs">
                    Status
                  </th>
                  <th className="px-3 py-1.5 text-xs w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-muted-foreground py-8 text-sm"
                    >
                      <FileText className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      {hasActiveFilters
                        ? "No projects found matching your filters."
                        : "No projects yet. Create your first project."}
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr key={project.id} className="hover:bg-muted/50">
                      <td className="px-3 py-1">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          <span className="font-medium text-sm">
                            {project.projectNo}
                          </span>
                        </div>
                        {(project as any).projectName && (
                          <span className="text-xs text-muted-foreground block truncate lg:hidden">
                            {(project as any).projectName}
                          </span>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-1">
                        {(project as any).projectName ? (
                          <span className="text-sm font-medium truncate block max-w-[200px]">
                            {(project as any).projectName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-3 py-1">
                        <span className="font-medium text-sm">
                          {project.customer?.name || "Unknown"}
                        </span>
                        {project.customer?.mobile && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            · {project.customer.mobile}
                          </span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-3 py-1 text-muted-foreground text-sm">
                        {formatDate(project.date)}
                      </td>
                      <td className="px-3 py-1 font-semibold text-sm">
                        {formatCurrency(project.grandTotalWithGst)}
                      </td>
                      <td className="hidden sm:table-cell px-3 py-1">
                        <span className={getStatusBadge(project.status)}>
                          {project.status.charAt(0).toUpperCase() +
                            project.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-1">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => navigate(`/projects/${project.id}`)}
                            className="action-btn p-1"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/projects/${project.id}/pdf`)
                            }
                            className="action-btn p-1"
                            title="Generate PDF"
                          >
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          {hasPermission("project:create") && (
                            <button
                              onClick={() => handleDuplicate(project.id)}
                              className="action-btn p-1"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                          {hasPermission("project:edit") && (
                            <button
                              onClick={() =>
                                navigate(`/projects/edit/${project.id}`)
                              }
                              className="action-btn p-1"
                              title="Edit"
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                          {hasPermission("project:delete") && (
                            <button
                              onClick={() =>
                                handleDelete(project.id, project.projectNo)
                              }
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

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-border">
              <div className="text-xs text-muted-foreground hidden sm:block">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * PAGE_SIZE, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalCount}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-px mx-0.5">
                  {getPageNumbers().map((page, idx) =>
                    page === "..." ? (
                      <span
                        key={`dots-${idx}`}
                        className="w-6 text-center text-xs text-muted-foreground"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                          currentPage === page
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="danger"
        loading={confirmDialog.loading}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Projects;
