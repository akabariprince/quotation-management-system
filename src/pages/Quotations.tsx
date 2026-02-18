import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Eye,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useQuotations,
  Quotation,
  getQuotationImageUrl,
} from "@/hooks/useQuotations";
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

const PAGE_SIZE = 12;

// ── Quotation Card Skeleton ──
const QuotationCardSkeleton: React.FC = () => (
  <div className="enterprise-card overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-20" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-5 bg-muted rounded w-20 mb-1" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
    </div>
  </div>
);

const QuotationGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
      <QuotationCardSkeleton key={i} />
    ))}
  </div>
);

const Quotations: React.FC = () => {
  const { hasPermission } = useAuth();
  const { quotations, meta, loading, fetchQuotations, deleteQuotation } =
    useQuotations();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );

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
  const loadQuotations = useCallback(
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
      if (st) params.status = st;
      fetchQuotations(params);
    },
    [currentPage, searchTerm, statusFilter, fetchQuotations],
  );

  // Initial load
  useEffect(() => {
    loadQuotations(1);
  }, []);

  // Reload on page change
  useEffect(() => {
    loadQuotations(currentPage);
  }, [currentPage]);

  // Reload on status filter change
  useEffect(() => {
    setCurrentPage(1);
    loadQuotations(1, searchTerm, statusFilter);
  }, [statusFilter]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      loadQuotations(1, value);
    }, 400);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Custom delete handler
  const handleDelete = (id: string, quotationName: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Quotation",
      description: `Are you sure you want to delete "${quotationName}"? This action cannot be undone and will remove all associated images.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await deleteQuotation(id);
          toast.success("Quotation deleted successfully");
          // Close modal if the deleted quotation was being viewed
          if (selectedQuotation?.id === id) {
            setSelectedQuotation(null);
          }
          loadQuotations();
        } catch (err: any) {
          toast.error(err?.message || "Failed to delete quotation");
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

  const getCategoryName = (quotation: Quotation) => {
    return quotation.category?.name || "—";
  };

  const getQuotationTypeName = (quotation: Quotation) => {
    return quotation.quotationType?.name || "—";
  };

  const totalPages = meta?.totalPages || 1;
  const totalCount = meta?.totalCount || 0;
  const hasActiveFilters = searchTerm || statusFilter;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setCurrentPage(1);
  };

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your product catalog
          </p>
        </div>
        {hasPermission("master:manage") && (
          <Button
            className="btn-accent gap-2"
            onClick={() => navigate("/masters?tab=quotation")}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
          </Button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="enterprise-card p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or part code..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter || "all"}
                onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-full sm:w-[140px] h-11">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters & count */}
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
                          loadQuotations(1, "");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                      Status: {statusFilter}
                      <button onClick={() => setStatusFilter("")}>
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
                {totalCount} Products{totalCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quotation Grid */}
      {loading ? (
        <QuotationGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
          {quotations.length === 0 ? (
            <div className="col-span-full enterprise-card p-12 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
              {hasActiveFilters
                ? "No quotations found matching your filters. Try different criteria."
                : "No quotations yet. Add your first quotation."}
            </div>
          ) : (
            quotations.map((quotation) => (
              <div
                key={quotation.id}
                className="enterprise-card overflow-hidden group"
              >
                <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                  {quotation.images?.[0] ? (
                    <img
                      src={getQuotationImageUrl(quotation.images[0])}
                      alt={quotation.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          e.target as HTMLImageElement
                        ).nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}

                  {/* Fallback icon */}
                  <div
                    className={`w-full h-full flex items-center justify-center absolute inset-0 ${
                      quotation.images?.[0] ? "hidden" : ""
                    }`}
                  >
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>

                  <span
                    className={`capitalize absolute top-3 right-3 ${
                      quotation.status === "active"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                  >
                    {quotation.status}
                  </span>

                  {quotation.images && quotation.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      +{quotation.images.length - 1}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {quotation.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {quotation.partCode}
                      </p>
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                    <span className="bg-muted px-2 py-0.5 rounded">
                      {getCategoryName(quotation)}
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded">
                      {getQuotationTypeName(quotation)}
                    </span>
                  </div> */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(quotation.basePrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Discount: {quotation.defaultDiscount}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedQuotation(quotation)}
                        className="action-btn"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {hasPermission("quotation:delete") && (
                        <button
                          onClick={() =>
                            handleDelete(quotation.id, quotation.name)
                          }
                          className="action-btn action-btn-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="enterprise-card">
          <div className="flex items-center justify-between px-4 py-3">
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
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              quotations
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-0.5 mx-1">
                {getPageNumbers().map((page, idx) =>
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
                )}
              </div>
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
        </div>
      )}

      {/* Quotation Detail Modal */}
      {selectedQuotation && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedQuotation(null)}
        >
          <div
            className="modal-content max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {selectedQuotation.name}
              </h2>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Image gallery */}
              {/* Image gallery */}
              <div className="sm:w-1/3 space-y-2">
                {selectedQuotation.images?.[0] ? (
                  <div className="w-full aspect-[16/9] rounded-xl overflow-hidden">
                    <img
                      src={getQuotationImageUrl(selectedQuotation.images[0])}
                      alt={selectedQuotation.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted rounded-xl flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Additional images (keep square for thumbnails) */}
                {selectedQuotation.images &&
                  selectedQuotation.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedQuotation.images.slice(1).map((img, idx) => (
                        <img
                          key={idx}
                          src={getQuotationImageUrl(img)}
                          alt={`${selectedQuotation.name} ${idx + 2}`}
                          className="w-16 h-16 object-cover rounded-lg border border-border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ))}
                    </div>
                  )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-muted-foreground font-mono text-sm mb-2">
                    {selectedQuotation.partCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuotation.description ||
                      "No description available"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="font-semibold text-lg">
                      {formatCurrency(selectedQuotation.basePrice)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Default Discount
                    </p>
                    <p className="font-semibold text-lg">
                      {selectedQuotation.defaultDiscount}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">GST</p>
                    <p className="font-semibold">
                      {selectedQuotation.gstPercent}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <span
                      className={
                        selectedQuotation.status === "active"
                          ? "badge-success"
                          : "badge-warning"
                      }
                    >
                      {selectedQuotation.status}
                    </span>
                  </div>
                </div>

                {/* Category & Type */}
                {/* <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    Classification
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuotation.category?.name && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                        {selectedQuotation.category.name}
                      </span>
                    )}
                    {selectedQuotation.quotationType?.name && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {selectedQuotation.quotationType.name}
                      </span>
                    )}
                    {selectedQuotation.quotationModel?.name && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {selectedQuotation.quotationModel.name}
                      </span>
                    )}
                  </div>
                </div> */}

                {/* Materials */}
                {(selectedQuotation.wood?.name ||
                  selectedQuotation.polish?.name ||
                  selectedQuotation.fabric?.name) && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">
                      Materials
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuotation.wood?.name && (
                        <span className="text-xs bg-amber-500/10 text-amber-700 px-2 py-1 rounded">
                          Wood: {selectedQuotation.wood.name}
                        </span>
                      )}
                      {selectedQuotation.polish?.name && (
                        <span className="text-xs bg-blue-500/10 text-blue-700 px-2 py-1 rounded">
                          Polish: {selectedQuotation.polish.name}
                        </span>
                      )}
                      {selectedQuotation.fabric?.name && (
                        <span className="text-xs bg-purple-500/10 text-purple-700 px-2 py-1 rounded">
                          Fabric: {selectedQuotation.fabric.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Dimensions */}
                {(selectedQuotation.length > 0 ||
                  selectedQuotation.width > 0 ||
                  selectedQuotation.height > 0) && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">
                      Dimensions
                    </p>
                    <div className="flex gap-4 text-sm">
                      {selectedQuotation.length > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">
                          L: {selectedQuotation.length}mm
                        </span>
                      )}
                      {selectedQuotation.width > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">
                          W: {selectedQuotation.width}mm
                        </span>
                      )}
                      {selectedQuotation.height > 0 && (
                        <span className="bg-muted px-2 py-1 rounded">
                          H: {selectedQuotation.height}mm
                        </span>
                      )}
                    </div>
                  </div>
                )}
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

export default Quotations;
