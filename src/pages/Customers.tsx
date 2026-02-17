import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomers, Customer } from "@/hooks/useCustomers";
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
import Pagination from "@/components/common/Pagination";

const PAGE_SIZE = 10;

const Customers: React.FC = () => {
  const { hasPermission } = useAuth();
  const { customers, meta, loading, fetchCustomers, deleteCustomer } =
    useCustomers();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Filters
  const [stateFilter, setStateFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  // Confirm dialog
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

  // Debounce ref
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch data
  const loadCustomers = useCallback(
    (page?: number, search?: string) => {
      const p = page ?? currentPage;
      const s = search ?? searchTerm;
      const params: any = {
        page: p,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "DESC",
      };
      if (s) params.search = s;
      if (stateFilter) params.state = stateFilter;
      if (regionFilter) params.region = regionFilter;
      fetchCustomers(params);
    },
    [currentPage, searchTerm, stateFilter, regionFilter, fetchCustomers],
  );

  // Initial load
  useEffect(() => {
    loadCustomers(1);
  }, []);

  // Reload on filter changes
  useEffect(() => {
    setCurrentPage(1);
    loadCustomers(1);
  }, [stateFilter, regionFilter]);

  // Reload on page change
  useEffect(() => {
    loadCustomers(currentPage);
  }, [currentPage]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      loadCustomers(1, value);
    }, 400);
  };

  // Delete with custom confirm
  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Customer",
      description: `Are you sure you want to delete "${name}"? This action cannot be undone and will remove all associated data.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await deleteCustomer(id);
          toast.success("Customer deleted successfully");
          loadCustomers();
        } catch (err: any) {
          toast.error(err?.message || "Failed to delete customer");
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

  const totalPages = meta?.totalPages || 1;
  const totalCount = meta?.totalCount || 0;

  const states = [
    // North
    "Himachal Pradesh",
    "Punjab",
    "Uttarakhand",
    "Uttar Pradesh",
    "Haryana",
    "Rajasthan",

    // South
    "Andhra Pradesh",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Telangana",

    // East
    "Bihar",
    "Jharkhand",
    "Odisha",
    "West Bengal",

    // West
    "Goa",
    "Gujarat",
    "Maharashtra",

    // Central
    "Madhya Pradesh",
    "Chhattisgarh",

    // North-East
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura",
  ];

  const regions = ["North", "South", "East", "West", "Central", "North-East"];

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStateFilter("");
    setRegionFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || stateFilter || regionFilter;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex gap-2">
          <h1 className="page-title">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </Link>
          {hasPermission("customer:create") && (
            <Link to="/customers/new">
              <Button className="btn-accent gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Customer</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="enterprise-card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, mobile, email, or city..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={stateFilter || "all"}
                onValueChange={(v) => setStateFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full sm:w-[150px] h-11">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={regionFilter || "all"}
                onValueChange={(v) => setRegionFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full sm:w-[130px] h-11">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {hasActiveFilters && (
                <>
                  <span className="text-xs text-muted-foreground">
                    Filters:
                  </span>
                  {searchTerm && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                      Search: "{searchTerm}"
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          loadCustomers(1, "");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {stateFilter && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                      State: {stateFilter}
                      <button onClick={() => setStateFilter("")}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {regionFilter && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                      Region: {regionFilter}
                      <button onClick={() => setRegionFilter("")}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-destructive hover:underline ml-1"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
            {!loading && totalCount > 0 && (
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {totalCount} customer{totalCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <TableSkeleton columns={5} rows={PAGE_SIZE} />
      ) : (
        <div className="enterprise-card overflow-hidden mt-4">
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th className="hidden md:table-cell">Contact</th>
                  <th className="hidden lg:table-cell">Location</th>
                  <th className="hidden xl:table-cell">GSTIN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-muted-foreground py-12"
                    >
                      {hasActiveFilters
                        ? "No customers found matching your filters. Try different criteria."
                        : "No customers yet. Add your first customer."}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div>
                          <p className="font-medium text-foreground">
                            {customer.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.contactPerson}
                          </p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {customer.mobile}
                          </p>
                          <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {customer.email || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span>
                            {[customer.city, customer.state]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="hidden xl:table-cell">
                        {customer.gstin ? (
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {customer.gstin}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="action-btn"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {hasPermission("customer:edit") && (
                            <button
                              onClick={() =>
                                navigate(`/customers/edit/${customer.id}`)
                              }
                              className="action-btn"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                          {hasPermission("customer:delete") && (
                            <button
                              onClick={() =>
                                handleDelete(customer.id, customer.name)
                              }
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

          {/* Pagination */}
          {!loading && meta && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              {/* Left: showing info */}
              <div className="text-xs text-muted-foreground hidden sm:block">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * PAGE_SIZE, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalCount}
                </span>{" "}
                customers
              </div>

              {/* Right: page controls */}
              <div className="flex items-center gap-1">
                {/* First */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-0.5 mx-1">
                  {(() => {
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
                    return pages.map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`dots-${idx}`}
                          className="w-8 text-center text-xs text-muted-foreground"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                            currentPage === page
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    );
                  })()}
                </div>

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {selectedCustomer.name}
              </h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Contact Person
                  </p>
                  <p className="font-medium">
                    {selectedCustomer.contactPerson || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selectedCustomer.mobile}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-medium font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
                    {selectedCustomer.gstin || "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{selectedCustomer.address || "—"}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{selectedCustomer.city || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{selectedCustomer.state || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">
                    {selectedCustomer.region || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
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

export default Customers;
