import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Package, Check } from "lucide-react";
import { useApi } from "@/hooks/useApi";

interface Quotation {
  id: string;
  name: string;
  partCode: string;
  basePrice: number;
  images?: string[];
}

interface QuotationSearchSelectProps {
  value: string;
  onChange: (quotationId: string) => void;
  placeholder?: string;
  className?: string;
  getImageUrl: (path: string) => string;
  formatCurrency: (amount: number) => string;
}

const QuotationSearchSelect: React.FC<QuotationSearchSelectProps> = ({
  value,
  onChange,
  placeholder = "Search quotation by name or part code...",
  className = "",
  getImageUrl,
  formatCurrency,
}) => {
  const { get } = useApi();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] =
    useState<Quotation | null>(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  /* ------------------ Load Initial Quotations ------------------ */
  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(
        "/quotations?limit=20&sortBy=updatedAt&sortOrder=DESC"
      );
      setQuotations(res.data || []);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  /* ------------------ Search Quotations ------------------ */
  const searchQuotations = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        loadInitial();
        return;
      }

      setLoading(true);
      try {
        const res = await get(
          `/quotations?search=${encodeURIComponent(
            term
          )}&limit=20&sortBy=updatedAt&sortOrder=DESC`
        );
        setQuotations(res.data || []);
      } catch {
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    },
    [get, loadInitial]
  );

  /* ------------------ Load Selected (External Value Change) ------------------ */
  useEffect(() => {
    const loadSelected = async () => {
      if (value && !selectedQuotation) {
        try {
          const res = await get(`/quotations/${value}`);
          if (res.data) setSelectedQuotation(res.data);
        } catch {}
      } else if (!value) {
        setSelectedQuotation(null);
      }
    };
    loadSelected();
  }, [value]);

  /* ------------------ Debounce ------------------ */
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      searchQuotations(term);
    }, 300);
  };

  /* ------------------ Select ------------------ */
  const handleSelect = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    onChange(quotation.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedQuotation(null);
    onChange("");
    setSearchTerm("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadInitial();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  /* ------------------ Outside Click ------------------ */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------------ Skeleton ------------------ */
  const DropdownSkeleton = () => (
    <div className="space-y-1 p-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-24 aspect-[16/9] bg-muted rounded-lg" />
          <div className="flex-1">
            <div className="h-3 bg-muted rounded w-24 mb-2" />
            <div className="h-3 bg-muted rounded w-40" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Closed View */}
      {!isOpen && (
        <div
          onClick={handleOpen}
          className="flex items-center justify-between h-11 w-full rounded-md border border-input bg-background px-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
        >
          {selectedQuotation ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-16 aspect-[16/9] rounded overflow-hidden border bg-muted">
                {selectedQuotation.images?.[0] && (
                  <img
                    src={getImageUrl(selectedQuotation.images[0])}
                    alt={selectedQuotation.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="truncate">
                <p className="font-medium truncate">
                  {selectedQuotation.partCode}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedQuotation.name}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}

          <div className="flex items-center gap-1">
            {selectedQuotation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Search Input */}
      {isOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search quotation..."
            className="h-11 w-full rounded-md border border-accent pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {loading ? (
            <DropdownSkeleton />
          ) : quotations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {searchTerm
                ? `No quotations found for "${searchTerm}"`
                : "No quotations available"}
            </div>
          ) : (
            <div className="py-1">
              {quotations.map((quotation) => (
                <button
                  key={quotation.id}
                  type="button"
                  onClick={() => handleSelect(quotation)}
                  className={`w-full text-left px-3 py-2 flex gap-3 hover:bg-accent/5 ${
                    value === quotation.id ? "bg-accent/10" : ""
                  }`}
                >
                  <div className="w-24 aspect-[16/9] rounded overflow-hidden border bg-muted flex-shrink-0">
                    {quotation.images?.[0] && (
                      <img
                        src={getImageUrl(quotation.images[0])}
                        alt={quotation.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {quotation.partCode}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {quotation.name}
                    </p>
                    <p className="text-xs text-accent font-semibold mt-1">
                      {formatCurrency(quotation.basePrice)}
                    </p>
                  </div>

                  {value === quotation.id && (
                    <Check className="h-4 w-4 text-accent flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuotationSearchSelect;
