import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ZoomIn,
  ArrowLeft,
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

// ── Image Carousel Component ──
const ImageCarousel: React.FC<{ images: string[]; name: string }> = ({
  images,
  name,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const hasImages = images && images.length > 0;
  const totalImages = hasImages ? images.length : 0;

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  }, [totalImages]);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  }, [totalImages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") setIsZoomed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  useEffect(() => {
    if (thumbnailRef.current) {
      const activeThumb = thumbnailRef.current.children[
        activeIndex
      ] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeIndex]);

  if (!hasImages) {
    return (
      <div className="w-full aspect-[4/3] bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full aspect-[4/3] bg-muted rounded-xl overflow-hidden group">
        <img
          src={getQuotationImageUrl(images[activeIndex])}
          alt={`${name} - Image ${activeIndex + 1}`}
          className="w-full h-full object-contain cursor-pointer transition-transform duration-300"
          onClick={() => setIsZoomed(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <button
          onClick={() => setIsZoomed(true)}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Zoom image"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        {totalImages > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
              title="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
              title="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        {totalImages > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {activeIndex + 1} / {totalImages}
          </div>
        )}
      </div>
      {totalImages > 1 && (
        <div className="relative">
          <div
            ref={thumbnailRef}
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
            style={{ scrollbarWidth: "thin" }}
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  activeIndex === idx
                    ? "border-primary ring-2 ring-primary/20 scale-105"
                    : "border-transparent hover:border-muted-foreground/30 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={getQuotationImageUrl(img)}
                  alt={`${name} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "";
                  }}
                />
                {activeIndex === idx && (
                  <div className="absolute inset-0 bg-primary/10" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {totalImages > 1 && totalImages <= 10 && (
        <div className="flex items-center justify-center gap-1.5 sm:hidden">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-full transition-all duration-200 ${
                activeIndex === idx
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      )}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>
          {totalImages > 1 && (
            <div className="absolute top-4 left-4 text-white/80 text-sm z-10">
              {activeIndex + 1} / {totalImages}
            </div>
          )}
          {totalImages > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={getQuotationImageUrl(images[activeIndex])}
            alt={`${name} - Full size ${activeIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {totalImages > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                  }}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    activeIndex === idx
                      ? "border-white scale-110"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={getQuotationImageUrl(img)}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Detail Row Component ──
const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  className?: string;
}> = ({ label, value, className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
    <div className="text-sm font-semibold text-foreground">{value}</div>
  </div>
);

// ── Quotation Card Skeleton ──
const QuotationCardSkeleton: React.FC = () => (
  <div className="enterprise-card overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-muted" />
    <div className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-20" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-5 bg-muted rounded w-20 mb-1" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-7 w-7 bg-muted rounded" />
          <div className="h-7 w-7 bg-muted rounded" />
        </div>
      </div>
    </div>
  </div>
);

const QuotationGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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

  useEffect(() => {
    loadQuotations(1);
  }, []);
  useEffect(() => {
    loadQuotations(currentPage);
  }, [currentPage]);
  useEffect(() => {
    setCurrentPage(1);
    loadQuotations(1, searchTerm, statusFilter);
  }, [statusFilter]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      loadQuotations(1, value);
    }, 400);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

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
          if (selectedQuotation?.id === id) setSelectedQuotation(null);
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

  const getDiscountedPrice = (quotation: Quotation) => {
    const base = Number(quotation.basePrice);
    const discount = Number(quotation.defaultDiscount);
    return base - (base * discount) / 100;
  };

  const getGstAmount = (quotation: Quotation) => {
    const discounted = getDiscountedPrice(quotation);
    return (discounted * Number(quotation.gstPercent)) / 100;
  };

  const getFinalPrice = (quotation: Quotation) =>
    getDiscountedPrice(quotation) + getGstAmount(quotation);

  useEffect(() => {
    if (selectedQuotation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedQuotation]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div>
          <h1 className="text-sm font-semibold leading-none">Products</h1>
          <p className="text-muted-foreground text-xs">
            Manage your product catalog
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
          {hasPermission("master:manage") && (
            <Button
              className="btn-accent gap-1 h-7 text-xs px-2"
              size="sm"
              onClick={() => navigate("/masters?tab=quotation&from=product")}
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline text-white">Add Product</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="enterprise-card p-2 mt-1">
        <div className="flex flex-col sm:flex-row items-center gap-1.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or Product Code..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-7 h-7 text-xs"
            />
          </div>
          <div className="flex gap-1 w-full sm:w-auto">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full sm:w-[120px] h-7 text-xs px-2">
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
                      Search: "{searchTerm}"
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          loadQuotations(1, "");
                        }}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {statusFilter && (
                    <span className="text-xs bg-accent/10 text-accent px-1.5 py-px rounded-full flex items-center gap-0.5">
                      Status: {statusFilter}
                      <button onClick={() => setStatusFilter("")}>
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
                {totalCount} Product{totalCount !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quotation Grid */}
      {loading ? (
        <QuotationGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-1">
          {quotations.length === 0 ? (
            <div className="col-span-full enterprise-card p-8 text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {hasActiveFilters
                ? "No quotations found matching your filters. Try different criteria."
                : "No quotations yet. Add your first quotation."}
            </div>
          ) : (
            quotations.map((quotation) => (
              <div
                key={quotation.id}
                className="enterprise-card overflow-hidden group cursor-pointer"
                onClick={() => setSelectedQuotation(quotation)}
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
                  <div
                    className={`w-full h-full flex items-center justify-center absolute inset-0 ${quotation.images?.[0] ? "hidden" : ""}`}
                  >
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <span
                    className={`capitalize absolute top-2 right-2 ${quotation.status === "active" ? "badge-success" : "badge-warning"}`}
                  >
                    {quotation.status}
                  </span>
                  {quotation.images && quotation.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {quotation.images.length}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                        {quotation.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        {quotation.partCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(quotation.basePrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Discount: {quotation.defaultDiscount}%
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQuotation(quotation);
                        }}
                        className="action-btn p-1"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      {hasPermission("quotation:delete") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(quotation.id, quotation.name);
                          }}
                          className="action-btn action-btn-danger p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
        <div className="enterprise-card mt-1">
          <div className="flex items-center justify-between px-3 py-1.5">
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
              <span className="font-medium text-foreground">{totalCount}</span>{" "}
              products
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Detail Modal ── */}
      {selectedQuotation && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedQuotation(null)}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-sm font-bold text-foreground truncate">
                  {selectedQuotation.name}
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedQuotation.partCode}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`capitalize text-xs ${selectedQuotation.status === "active" ? "badge-success" : "badge-warning"}`}
                >
                  {selectedQuotation.status}
                </span>
                <button
                  onClick={() => setSelectedQuotation(null)}
                  className="p-1 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 p-4 lg:border-r border-border">
                  <ImageCarousel
                    images={selectedQuotation.images || []}
                    name={selectedQuotation.name}
                  />
                </div>
                <div className="lg:w-1/2 p-4 space-y-4">
                  <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pricing
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <DetailRow
                        label="Base Price"
                        value={
                          <span className="text-sm">
                            {formatCurrency(selectedQuotation.basePrice)}
                          </span>
                        }
                      />
                      <DetailRow
                        label="Discount"
                        value={`${selectedQuotation.defaultDiscount}%`}
                      />
                      <DetailRow
                        label="GST"
                        value={`${selectedQuotation.gstPercent}%`}
                      />
                      <DetailRow
                        label="After Discount"
                        value={formatCurrency(
                          getDiscountedPrice(selectedQuotation),
                        )}
                      />
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Final Price (incl. GST)
                        </span>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(getFinalPrice(selectedQuotation))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedQuotation.description && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Description
                      </h3>
                      <p className="text-sm text-foreground leading-relaxed">
                        {selectedQuotation.description}
                      </p>
                    </div>
                  )}

                  {(Number(selectedQuotation.length) > 0 ||
                    Number(selectedQuotation.width) > 0 ||
                    Number(selectedQuotation.height) > 0) && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Dimensions
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Number(selectedQuotation.length) > 0 && (
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">
                              Length
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {selectedQuotation.length}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              inches
                            </p>
                          </div>
                        )}
                        {Number(selectedQuotation.width) > 0 && (
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">
                              Width
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {selectedQuotation.width}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              inches
                            </p>
                          </div>
                        )}
                        {Number(selectedQuotation.height) > 0 && (
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">
                              Height
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              {selectedQuotation.height}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              inches
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(selectedQuotation.wood?.name ||
                    selectedQuotation.polish?.name ||
                    selectedQuotation.fabric?.name) && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Materials
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQuotation.wood?.name && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Wood: {selectedQuotation.wood.name}
                          </span>
                        )}
                        {selectedQuotation.polish?.name && (
                          <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Polish: {selectedQuotation.polish.name}
                          </span>
                        )}
                        {selectedQuotation.fabric?.name && (
                          <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Fabric: {selectedQuotation.fabric.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {(selectedQuotation.category?.name ||
                    selectedQuotation.quotationType?.name ||
                    selectedQuotation.quotationModel?.name) && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Classification
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedQuotation.category?.name && (
                          <DetailRow
                            label="Category"
                            value={selectedQuotation.category.name}
                          />
                        )}
                        {selectedQuotation.quotationType?.name && (
                          <DetailRow
                            label="Type"
                            value={selectedQuotation.quotationType.name}
                          />
                        )}
                        {selectedQuotation.quotationModel?.name && (
                          <DetailRow
                            label="Model"
                            value={selectedQuotation.quotationModel.name}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <div className="grid grid-cols-2 gap-2">
                      <DetailRow
                        label="Created"
                        value={new Date(
                          selectedQuotation.createdAt,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      />
                      <DetailRow
                        label="Last Updated"
                        value={new Date(
                          selectedQuotation.updatedAt,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
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

export default Quotations;
