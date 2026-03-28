// src/pages/Customers.tsx
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
  Truck,
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

const PAGE_SIZE = 10;

const Customers: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const { customers, meta, loading, fetchCustomers, deleteCustomer } =
    useCustomers();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [stateFilter, setStateFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

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

  // ────────────────────────────────────────────────────
  //  Ownership check for edit/delete buttons:
  //  - customer:manage_all → can edit/delete ANY customer
  //  - otherwise → only if createdBy matches logged-in user
  // ────────────────────────────────────────────────────
  const canManageAll = hasPermission("customer:manage_all");

  const canModify = useCallback(
    (customer: Customer): boolean => {
      if (canManageAll) return true;
      return customer.createdBy === user?.id;
    },
    [canManageAll, user?.id],
  );

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

  useEffect(() => {
    loadCustomers(1);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadCustomers(1);
  }, [stateFilter, regionFilter]);

  useEffect(() => {
    loadCustomers(currentPage);
  }, [currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      loadCustomers(1, value);
    }, 400);
  };

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
    "Himachal Pradesh", "Punjab", "Uttarakhand", "Uttar Pradesh",
    "Haryana", "Rajasthan", "Andhra Pradesh", "Karnataka",
    "Kerala", "Tamil Nadu", "Telangana", "Bihar",
    "Jharkhand", "Odisha", "West Bengal", "Goa",
    "Gujarat", "Maharashtra", "Madhya Pradesh", "Chhattisgarh",
    "Arunachal Pradesh", "Assam", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Sikkim", "Tripura",
  ];

  const regions = ["North", "South", "East", "West", "Central", "North-East"];

  const clearFilters = () => {
    setSearchTerm("");
    setStateFilter("");
    setRegionFilter("");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || stateFilter || regionFilter;

  const sc = selectedCustomer as any;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-sm font-semibold leading-none">Customers</h1>
          <p className="text-muted-foreground text-xs">
            Manage your customer database
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
              <span className="hidden sm:inline text-white">
                Back to Dashboard
              </span>
            </Button>
          </Link>
          {hasPermission("customer:create") && (
            <Link to="/customers/new">
              <Button className="btn-accent gap-1 h-7 text-xs px-2" size="sm">
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline text-white">
                  Add Customer
                </span>
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
              placeholder="Search by name, mobile, email, or city..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
          <div className="flex gap-1 w-full sm:w-auto">
            <Select
              value={stateFilter || "all"}
              onValueChange={(v) => setStateFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full sm:w-[120px] h-7 text-xs px-2">
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
              <SelectTrigger className="w-full sm:w-[120px] h-7 text-xs px-2">
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

        {(hasActiveFilters || (!loading && totalCount > 0)) && (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 flex-wrap">
              {hasActiveFilters && (
                <>
                  <span className="text-xs text-muted-foreground">
                    Filters:
                  </span>
                  {searchTerm && (
                    <span className="text-xs bg-accent/10 text-accent px-1.5 py-px rounded-full flex items-center gap-0.5">
                      Search: &quot;{searchTerm}&quot;
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          loadCustomers(1, "");
                        }}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {stateFilter && (
                    <span className="text-xs bg-accent/10 text-accent px-1.5 py-px rounded-full flex items-center gap-0.5">
                      State: {stateFilter}
                      <button onClick={() => setStateFilter("")}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {regionFilter && (
                    <span className="text-xs bg-accent/10 text-accent px-1.5 py-px rounded-full flex items-center gap-0.5">
                      Region: {regionFilter}
                      <button onClick={() => setRegionFilter("")}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-destructive hover:underline"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
            {!loading && totalCount > 0 && (
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {totalCount} customer{totalCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer List */}
      {loading ? (
        <TableSkeleton columns={canManageAll ? 6 : 5} rows={PAGE_SIZE} />
      ) : (
        <div className="enterprise-card overflow-hidden mt-1">
          <div className="table-container">
            <table className="enterprise-table w-full">
              <thead>
                <tr>
                  <th className="px-3 py-1.5 text-xs">Customer</th>
                  <th className="hidden md:table-cell px-3 py-1.5 text-xs">
                    Contact
                  </th>
                  <th className="hidden lg:table-cell px-3 py-1.5 text-xs">
                    Location
                  </th>
                  <th className="hidden xl:table-cell px-3 py-1.5 text-xs">
                    GSTIN
                  </th>
                  {canManageAll && (
                    <th className="hidden xl:table-cell px-3 py-1.5 text-xs">
                      Created By
                    </th>
                  )}
                  <th className="px-3 py-1.5 text-xs w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManageAll ? 6 : 5}
                      className="text-center text-muted-foreground py-8 text-sm"
                    >
                      {hasActiveFilters
                        ? "No customers found matching your filters."
                        : "No customers yet. Add your first customer."}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => {
                    const isOwner = canModify(customer);

                    return (
                      <tr key={customer.id} className="hover:bg-muted/50">
                        <td className="px-3 py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground text-sm">
                              {customer.name}
                            </span>
                            {/* Small badge so salesperson knows which are theirs */}
                            {!canManageAll && customer.createdBy === user?.id && (
                              <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1 py-px rounded font-medium">
                                Mine
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-3 py-1">
                          <span className="font-medium text-foreground text-sm">
                            {customer.mobile}{" "}
                          </span>
                          {customer.email && (
                            <span className="font-medium text-foreground text-sm">
                              · {customer.email}
                            </span>
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-3 py-1">
                          <span className="text-sm flex items-center gap-1">
                            {[customer.city, customer.state]
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </span>
                        </td>
                        <td className="hidden xl:table-cell px-3 py-1">
                          {customer.gstin ? (
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                              {customer.gstin}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </td>
                        {canManageAll && (
                          <td className="hidden xl:table-cell px-3 py-1">
                            <span className="text-xs text-muted-foreground">
                              {customer.creator?.name || "—"}
                            </span>
                          </td>
                        )}
                        <td className="px-3 py-1">
                          <div className="flex items-center gap-0.5">
                            {/* VIEW — always visible */}
                            <button
                              onClick={() => setSelectedCustomer(customer)}
                              className="action-btn p-1"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>

                            {/* EDIT — permission + ownership */}
                            {hasPermission("customer:edit") && isOwner && (
                              <button
                                onClick={() =>
                                  navigate(`/customers/edit/${customer.id}`)
                                }
                                className="action-btn p-1"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            )}

                            {/* DELETE — permission + ownership */}
                            {hasPermission("customer:delete") && isOwner && (
                              <button
                                onClick={() =>
                                  handleDelete(customer.id, customer.name)
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && meta && totalPages > 1 && (
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
                    );
                  })()}
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

      {/* ═══════ Customer Detail Modal ═══════ */}
      {selectedCustomer && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="modal-content p-0 max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground leading-none">
                    {selectedCustomer.name}
                  </h2>
                  {selectedCustomer.contactPerson && (
                    <p className="text-xs text-muted-foreground">
                      c/o {selectedCustomer.contactPerson}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {hasPermission("customer:edit") &&
                  canModify(selectedCustomer) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs h-7 px-2"
                      onClick={() => {
                        const id = selectedCustomer.id;
                        setSelectedCustomer(null);
                        navigate(`/customers/edit/${id}`);
                      }}
                    >
                      <Edit className="h-3 w-3" /> Edit
                    </Button>
                  )}
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-4 py-3 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* ── Basic Information ── */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Customer Name
                    </p>
                    <p className="font-medium text-sm">
                      {selectedCustomer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Contact Person
                    </p>
                    <p className="font-medium text-sm">
                      {selectedCustomer.contactPerson || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {selectedCustomer.mobile}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {selectedCustomer.email || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">GSTIN</p>
                    {selectedCustomer.gstin ? (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded inline-block">
                        {selectedCustomer.gstin}
                      </span>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                  {/* Show creator info */}
                  {selectedCustomer.creator && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Created By
                      </p>
                      <p className="font-medium text-sm">
                        {selectedCustomer.creator.name}
                        {selectedCustomer.createdBy === user?.id && (
                          <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1 py-px rounded font-medium">
                            You
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Billing Address ── */}
              <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-md p-3 border border-blue-200/30">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                    Billing Address
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Address Line
                    </p>
                    <p className="font-medium">
                      {selectedCustomer.address || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Near / Landmark
                    </p>
                    <p className="font-medium">{sc?.landmark || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">City</p>
                    <p className="font-medium">
                      {selectedCustomer.city || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">State</p>
                    <p className="font-medium">
                      {selectedCustomer.state || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pincode</p>
                    <p className="font-medium">{sc?.pincode || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Region</p>
                    <p className="font-medium">
                      {selectedCustomer.region || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Delivery Address ── */}
              <div className="bg-green-50/50 dark:bg-green-950/10 rounded-md p-3 border border-green-200/30">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Truck className="h-3.5 w-3.5 text-green-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                    Delivery Address
                  </h3>
                </div>

                {sc?.deliverySameAsBilling !== false ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <p className="text-muted-foreground font-medium">
                      Same as billing address
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Address Line
                      </p>
                      <p className="font-medium">
                        {sc?.deliveryAddress || "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Near / Landmark
                      </p>
                      <p className="font-medium">
                        {sc?.deliveryLandmark || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">City</p>
                      <p className="font-medium">{sc?.deliveryCity || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">State</p>
                      <p className="font-medium">{sc?.deliveryState || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pincode</p>
                      <p className="font-medium">
                        {sc?.deliveryPincode || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-1.5 px-4 py-2 border-t border-border bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>
              {hasPermission("customer:edit") &&
                canModify(selectedCustomer) && (
                  <Button
                    size="sm"
                    className="btn-accent gap-1 h-7 text-xs px-2"
                    onClick={() => {
                      const id = selectedCustomer.id;
                      setSelectedCustomer(null);
                      navigate(`/customers/edit/${id}`);
                    }}
                  >
                    <Edit className="h-3 w-3" /> Edit Customer
                  </Button>
                )}
            </div>
          </div>
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

export default Customers;