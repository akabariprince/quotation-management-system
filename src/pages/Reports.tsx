import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useReports } from "@/hooks/useReports";
import { useApi } from "@/hooks/useApi";
import { useSalesPersons } from "@/hooks/useSalesPersons";
import {
  FileText,
  Users,
  TrendingUp,
  Download,
  Package,
  Filter,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getStatusBadgeClass,
  getDaysPendingClass,
  generateCSV,
} from "@/utils/reportHelpers";
import { downloadA4PDF } from "@/utils/pdfExport";

/* ─── Utility ─── */
const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(" ");

const COLORS = [
  "#111827",
  "#A16207",
  "#166534",
  "#DC2626",
  "#6B7280",
  "#7C3AED",
  "#0891B2",
];
const TODAY_STR = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const formatDateDisplay = (v: string) => {
  if (!v) return "";
  const d = new Date(v + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ═══════════════════════════════════════════════════════════
   FilterBadge
   ═══════════════════════════════════════════════════════════ */

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium border border-accent/20 animate-in fade-in-0 zoom-in-95 duration-150">
    {label}
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      className="ml-0.5 hover:bg-accent/20 rounded-full p-0.5 transition-colors"
      aria-label={`Remove ${label} filter`}
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

/* ═══════════════════════════════════════════════════════════
   DatePickerInput
   ═══════════════════════════════════════════════════════════ */

interface DatePickerInputProps {
  value: string;
  onChange: (val: string) => void;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  placeholder?: string;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  placeholder = "Pick a date",
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(
    () => new Date(value ? value + "T00:00:00" : Date.now())
  );

  useEffect(() => {
    if (value) setViewDate(new Date(value + "T00:00:00"));
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean; dateStr: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({
      day: d,
      current: false,
      dateStr: `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({
      day: i,
      current: true,
      dateStr: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
    });
  }
  const total = cells.length <= 35 ? 35 : 42;
  const remaining = total - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({
      day: i,
      current: false,
      dateStr: `${ny}-${String(nm + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
    });
  }

  const isDateDisabled = (ds: string) => {
    if (minDate && ds < minDate) return true;
    if (maxDate && ds > maxDate) return true;
    return false;
  };

  const pick = (ds: string) => {
    onChange(ds);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors",
            "hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            disabled && "opacity-50 cursor-not-allowed",
            !value ? "text-muted-foreground" : "text-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-left flex-1">
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <div className="p-3 w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold select-none">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="h-8 flex items-center justify-center text-[11px] font-medium text-muted-foreground uppercase"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const selected = value === cell.dateStr;
              const today = cell.dateStr === TODAY_STR;
              const dis = !cell.current || isDateDisabled(cell.dateStr);
              return (
                <div key={i} className="flex items-center justify-center p-0.5">
                  <button
                    type="button"
                    disabled={dis}
                    onClick={() => !dis && pick(cell.dateStr)}
                    className={cn(
                      "h-8 w-8 rounded-md text-sm flex items-center justify-center transition-colors",
                      !cell.current && "text-muted-foreground/20",
                      cell.current && !selected && !dis && "hover:bg-muted text-foreground",
                      selected && "bg-foreground text-background font-semibold",
                      today && !selected && cell.current && "ring-1 ring-foreground/20 font-medium",
                      dis && cell.current && "text-muted-foreground/25 cursor-not-allowed"
                    )}
                  >
                    {cell.day}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                if (!isDateDisabled(TODAY_STR)) pick(TODAY_STR);
              }}
              className={cn(
                "text-xs font-medium hover:underline",
                isDateDisabled(TODAY_STR)
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-foreground"
              )}
            >
              Today
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ═══════════════════════════════════════════════════════════
   StatCard
   ═══════════════════════════════════════════════════════════ */

interface StatCardProps {
  icon?: React.ElementType;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
  <div className="flex items-center gap-2 p-3 md:p-4 bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
    <p className="text-sm text-muted-foreground font-medium">{label}:</p>
    <p className="text-base md:text-lg font-bold text-foreground tracking-tight">
      {value}
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MiniStatCard
   ═══════════════════════════════════════════════════════════ */

interface MiniStatCardProps {
  value: string | number;
  label: string;
  icon?: React.ElementType;
  className?: string;
  valueClassName?: string;
}

const MiniStatCard: React.FC<MiniStatCardProps> = ({
  value,
  label,
  className = "",
  valueClassName = "",
}) => (
  <div
    className={cn(
      "p-2 md:p-3 flex items-center justify-center gap-2 border border-border bg-card",
      className
    )}
  >
    <p className="text-xs text-muted-foreground font-medium">{label}:</p>
    <p className={cn("text-sm md:text-base font-bold", valueClassName)}>
      {value}
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   CustomerSearchSelect
   ═══════════════════════════════════════════════════════════ */

interface CustomerSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  apiFn: (url: string) => Promise<any>;
  disabled?: boolean;
}

const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  value,
  onChange,
  placeholder = "Search customer…",
  apiFn,
  disabled = false,
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [searching, setSearching] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value || value === "all") {
      setSelectedName("");
      return;
    }
    const found = results.find((c) => c.id === value);
    if (found) {
      setSelectedName(found.name);
      return;
    }
    (async () => {
      try {
        const res = await apiFn(`/customers/${value}`);
        if (res?.data?.name) setSelectedName(res.data.name);
      } catch {
        setSelectedName("");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 300),
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handler = () => updatePosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      const dd = document.getElementById("cust-search-portal");
      if (dd?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const searchCustomers = useCallback(
    async (query: string) => {
      try {
        setSearching(true);
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "10");
        params.set("sortBy", "createdAt");
        params.set("sortOrder", "DESC");
        if (query.trim()) params.set("search", query.trim());
        const res = await apiFn(`/customers?${params.toString()}`);
        let data: any[] = [];
        if (Array.isArray(res?.data)) data = res.data;
        else if (res?.data?.customers) data = res.data.customers;
        else if (res?.data?.rows) data = res.data.rows;
        else if (res?.data?.data) {
          if (Array.isArray(res.data.data)) data = res.data.data;
          else if (res.data.data?.customers) data = res.data.data.customers;
          else if (res.data.data?.rows) data = res.data.data.rows;
        }
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [apiFn]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCustomers(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, isOpen, searchCustomers]);

  const handleFocus = () => {
    setIsOpen(true);
    setSearch("");
    updatePosition();
    searchCustomers("");
  };

  const handleSelect = (id: string, name?: string) => {
    onChange(id);
    setSelectedName(id === "all" ? "" : name || "");
    setSearch("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("all");
    setSelectedName("");
    setSearch("");
    setIsOpen(false);
  };

  const dropdown = isOpen
    ? createPortal(
      <div
        id="cust-search-portal"
        style={{
          position: "absolute",
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          zIndex: 9999,
        }}
        className="bg-popover border border-border rounded-lg shadow-xl max-h-72 overflow-auto animate-in fade-in-0 zoom-in-95 duration-100"
      >
        <button
          type="button"
          onClick={() => handleSelect("all")}
          className={cn(
            "w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors border-b border-border/50",
            value === "all"
              ? "bg-accent/5 text-accent font-medium"
              : "text-muted-foreground"
          )}
        >
          All Customers
        </button>
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/30 font-medium flex items-center justify-between sticky top-0">
          <span>
            {search.trim()
              ? `${results.length} result${results.length !== 1 ? "s" : ""}`
              : "Recent Customers"}
          </span>
          {searching && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        {!searching && results.length === 0 ? (
          <div className="px-3 py-8 text-sm text-muted-foreground text-center">
            {search.trim() ? "No customers found" : "No customers available"}
          </div>
        ) : (
          results.map((c: any) => (
            <button
              type="button"
              key={c.id}
              onClick={() => handleSelect(c.id, c.name)}
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors border-b border-border/10 last:border-0",
                value === c.id ? "bg-accent/10 text-accent" : ""
              )}
            >
              <div className="font-medium truncate">{c.name}</div>
              {(c.mobile || c.city || c.email) && (
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {[c.mobile, c.city, c.email].filter(Boolean).join(" · ")}
                </div>
              )}
            </button>
          ))
        )}
        {searching && results.length > 0 && (
          <div className="px-3 py-2 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}
      </div>,
      document.body
    )
    : null;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : selectedName || ""}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={handleFocus}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              inputRef.current?.blur();
            }
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-8 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {selectedName && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {dropdown}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Main Reports Component
   ═══════════════════════════════════════════════════════════ */

const Reports: React.FC = () => {
  const api = useApi();
  const { salesPersons, fetchSalesPersons } = useSalesPersons();
  const {
    masterReport,
    quotationSummary,
    conversionReport,
    pendingReport,
    salesmanReport,
    customerHistory,
    productReport,
    discountReport,
    loading,
    error,
    fetchMasterReport,
    fetchQuotationSummary,
    fetchConversionReport,
    fetchPendingReport,
    fetchSalesmanReport,
    fetchCustomerHistory,
    fetchProductReport,
    fetchDiscountReport,
  } = useReports();

  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("all");
  const [selectedSalesmanId, setSelectedSalesmanId] = useState("all");
  const [custHistoryCustomerId, setCustHistoryCustomerId] = useState("all");
  const [custHistoryStart, setCustHistoryStart] = useState("");
  const [custHistoryEnd, setCustHistoryEnd] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  /* ─── Derived: date validation ─── */
  const dateIncomplete = (startDate && !endDate) || (!startDate && endDate);
  const custDateIncomplete =
    (custHistoryStart && !custHistoryEnd) ||
    (!custHistoryStart && custHistoryEnd);

  /* ─── Initial Load ─── */
  useEffect(() => {
    const load = async () => {
      await Promise.allSettled([
        fetchMasterReport(),
        fetchQuotationSummary(),
        fetchSalesPersons(),
      ]);
      setInitialLoaded(true);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Tab Data ─── */
  useEffect(() => {
    if (!initialLoaded) return;
    switch (activeTab) {
      case "overview":
        fetchMasterReport();
        break;
      case "quotation-summary":
        fetchQuotationSummary();
        break;
      case "conversion":
        fetchConversionReport();
        break;
      case "pending":
        fetchPendingReport();
        break;
      case "sales-performance":
        fetchSalesmanReport();
        break;
      case "customer-history":
        fetchCustomerHistory({
          customerId:
            custHistoryCustomerId !== "all" ? custHistoryCustomerId : undefined,
          startDate: custHistoryStart || undefined,
          endDate: custHistoryEnd || undefined,
        });
        break;
      case "product":
        fetchProductReport();
        break;
      case "discounts":
        fetchDiscountReport();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, initialLoaded]);

  /* ─── Re-fetch helper ─── */
  const refetchTabWithFilters = useCallback(
    (filters?: any) => {
      switch (activeTab) {
        case "quotation-summary":
          fetchQuotationSummary(filters);
          break;
        case "conversion":
          fetchConversionReport(filters);
          break;
        case "pending":
          fetchPendingReport(filters);
          break;
        case "sales-performance":
          fetchSalesmanReport(filters);
          break;
        case "product":
          fetchProductReport(filters);
          break;
        case "discounts":
          fetchDiscountReport(filters);
          break;
      }
    },
    [
      activeTab,
      fetchQuotationSummary,
      fetchConversionReport,
      fetchPendingReport,
      fetchSalesmanReport,
      fetchProductReport,
      fetchDiscountReport,
    ]
  );

  /* ─── Build filters ─── */
  const buildCurrentFilters = useCallback(() => {
    const filters: any = {};
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    if (statusFilter !== "all") filters.status = statusFilter;
    if (searchText) filters.search = searchText;
    if (selectedCustomerId && selectedCustomerId !== "all")
      filters.customerId = selectedCustomerId;
    if (selectedSalesmanId && selectedSalesmanId !== "all")
      filters.salesPersonId = selectedSalesmanId;
    return filters;
  }, [startDate, endDate, statusFilter, searchText, selectedCustomerId, selectedSalesmanId]);

  const hasActiveFilters =
    (startDate && endDate) ||
    statusFilter !== "all" ||
    searchText ||
    selectedCustomerId !== "all" ||
    selectedSalesmanId !== "all";

  const canApplyFilters = hasActiveFilters && !dateIncomplete && !filtersApplied;

  const applyFilters = useCallback(() => {
    if (dateIncomplete) {
      toast.error("Please select both start and end dates");
      return;
    }
    const filters = buildCurrentFilters();
    setFiltersApplied(true);
    refetchTabWithFilters(filters);
  }, [buildCurrentFilters, refetchTabWithFilters, dateIncomplete]);

  /* ─── Clear filters ─── */
  const clearFilters = useCallback(
    (skipRefetch = false) => {
      setStartDate("");
      setEndDate("");
      setStatusFilter("all");
      setSearchText("");
      setSelectedCustomerId("all");
      setSelectedSalesmanId("all");
      setFiltersApplied(false);
      if (!skipRefetch) {
        refetchTabWithFilters(undefined);
      }
    },
    [refetchTabWithFilters]
  );

  /* ─── Remove single filter ─── */
  const removeFilter = useCallback(
    (filterKey: string) => {
      let newStart = startDate;
      let newEnd = endDate;
      let newStatus = statusFilter;
      let newSearch = searchText;
      let newCustomer = selectedCustomerId;
      let newSalesman = selectedSalesmanId;

      switch (filterKey) {
        case "dateRange":
          newStart = "";
          newEnd = "";
          setStartDate("");
          setEndDate("");
          break;
        case "status":
          newStatus = "all";
          setStatusFilter("all");
          break;
        case "search":
          newSearch = "";
          setSearchText("");
          break;
        case "customer":
          newCustomer = "all";
          setSelectedCustomerId("all");
          break;
        case "salesman":
          newSalesman = "all";
          setSelectedSalesmanId("all");
          break;
      }

      const remaining: any = {};
      if (newStart && newEnd) {
        remaining.startDate = newStart;
        remaining.endDate = newEnd;
      }
      if (newStatus !== "all") remaining.status = newStatus;
      if (newSearch) remaining.search = newSearch;
      if (newCustomer && newCustomer !== "all") remaining.customerId = newCustomer;
      if (newSalesman && newSalesman !== "all") remaining.salesPersonId = newSalesman;

      const hasRemaining = Object.keys(remaining).length > 0;
      if (!hasRemaining) setFiltersApplied(false);

      refetchTabWithFilters(hasRemaining ? remaining : undefined);
    },
    [startDate, endDate, statusFilter, searchText, selectedCustomerId, selectedSalesmanId, refetchTabWithFilters]
  );

  /* ─── Active filter badges ─── */
  const activeFilterBadges = useMemo(() => {
    if (!filtersApplied) return [];
    const badges: { key: string; label: string }[] = [];
    if (startDate && endDate)
      badges.push({
        key: "dateRange",
        label: `${formatDateDisplay(startDate)} – ${formatDateDisplay(endDate)}`,
      });
    if (statusFilter !== "all")
      badges.push({ key: "status", label: `Status: ${statusFilter}` });
    if (searchText)
      badges.push({ key: "search", label: `Search: ${searchText}` });
    if (selectedCustomerId !== "all")
      badges.push({ key: "customer", label: "Customer filter" });
    if (selectedSalesmanId !== "all") {
      const salesman = salesPersons.find((s) => s.id === selectedSalesmanId);
      badges.push({
        key: "salesman",
        label: `Salesman: ${salesman?.name || "Unknown"}`,
      });
    }
    return badges;
  }, [filtersApplied, startDate, endDate, statusFilter, searchText, selectedCustomerId, selectedSalesmanId, salesPersons]);

  /* ─── PDF filter labels for export ─── */
  const pdfFilterLabels = useMemo(() => {
    if (!filtersApplied || activeFilterBadges.length === 0) return undefined;
    return activeFilterBadges.map((b) => b.label);
  }, [filtersApplied, activeFilterBadges]);

  /* ─── Customer history filter state ─── */
  const custHistoryFilterBadges = useMemo(() => {
    const badges: { key: string; label: string }[] = [];
    if (custHistoryCustomerId !== "all")
      badges.push({ key: "customer", label: "Customer selected" });
    if (custHistoryStart && custHistoryEnd)
      badges.push({
        key: "dateRange",
        label: `${formatDateDisplay(custHistoryStart)} – ${formatDateDisplay(custHistoryEnd)}`,
      });
    return badges;
  }, [custHistoryCustomerId, custHistoryStart, custHistoryEnd]);

  const hasCustHistoryFilters =
    custHistoryCustomerId !== "all" ||
    (custHistoryStart && custHistoryEnd);

  const removeCustHistoryFilter = useCallback(
    (filterKey: string) => {
      let newCust = custHistoryCustomerId;
      let newStart = custHistoryStart;
      let newEnd = custHistoryEnd;

      switch (filterKey) {
        case "customer":
          newCust = "all";
          setCustHistoryCustomerId("all");
          break;
        case "dateRange":
          newStart = "";
          newEnd = "";
          setCustHistoryStart("");
          setCustHistoryEnd("");
          break;
      }

      fetchCustomerHistory({
        customerId: newCust !== "all" ? newCust : undefined,
        startDate: newStart || undefined,
        endDate: newEnd || undefined,
      });
    },
    [custHistoryCustomerId, custHistoryStart, custHistoryEnd, fetchCustomerHistory]
  );

  const clearCustHistoryFilters = useCallback(() => {
    setCustHistoryCustomerId("all");
    setCustHistoryStart("");
    setCustHistoryEnd("");
    fetchCustomerHistory();
  }, [fetchCustomerHistory]);

  const handleStartDateChange = useCallback((val: string) => {
    setStartDate(val);
    if (!val) setEndDate("");
    setFiltersApplied(false);
  }, []);

  const handleEndDateChange = useCallback((val: string) => {
    setEndDate(val);
    setFiltersApplied(false);
  }, []);

  const handleCustHistoryStartChange = useCallback((val: string) => {
    setCustHistoryStart(val);
    if (!val) setCustHistoryEnd("");
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ─── PDF export handler ─── */
  const handleExportPDF = useCallback(
    async (elementId: string, title: string, filterLabels?: string[]) => {
      try {
        toast.loading("Generating PDF…", { id: "pdf-gen" });
        await downloadA4PDF(elementId, title, filterLabels);
        toast.success("PDF downloaded successfully", { id: "pdf-gen" });
      } catch (err) {
        toast.error("Failed to generate PDF", { id: "pdf-gen" });
        console.error(err);
      }
    },
    []
  );

  /* ─── Exports ─── */
  const exportQuotationSummary = useCallback(() => {
    if (!quotationSummary?.projects?.length) return toast.error("No data to export");
    generateCSV(
      quotationSummary.projects.map((p) => ({
        "Quote No": p.projectNo,
        Date: formatDate(p.date),
        Customer: p.customer?.name || "-",
        Amount: p.grandTotalWithGst,
        Status: p.status,
        Salesperson: p.salesPerson?.name || "-",
        "Project Name": p.projectName || "-",
      })),
      "quotation_summary"
    );
    toast.success("Exported successfully");
  }, [quotationSummary]);

  const exportConversion = useCallback(() => {
    if (!conversionReport?.data?.length) return toast.error("No data to export");
    generateCSV(
      conversionReport.data.map((r) => ({
        "Quote No": r.quoteNo,
        Customer: r.customer,
        "Quote Amount": r.quoteAmount,
        "Order No": r.orderNo || "-",
        "Order Amount": r.orderAmount || "-",
        Status: r.status,
        Salesperson: r.salesPersonName,
        "Project Name": r.projectName,
      })),
      "conversion_report"
    );
    toast.success("Exported successfully");
  }, [conversionReport]);

  const exportPending = useCallback(() => {
    if (!pendingReport?.data?.length) return toast.error("No data to export");
    generateCSV(
      pendingReport.data.map((r) => ({
        "Quote No": r.quoteNo,
        Customer: r.customer,
        Amount: r.amount,
        "Days Pending": r.daysPending,
        "Follow-up Date": formatDate(r.followUpDate),
        Salesperson: r.salesPersonName,
      })),
      "pending_quotations"
    );
    toast.success("Exported successfully");
  }, [pendingReport]);

  const exportSalesman = useCallback(() => {
    if (!salesmanReport?.data?.length) return toast.error("No data to export");
    generateCSV(
      salesmanReport.data.map((r) => ({
        Salesperson: r.salesPersonName,
        Email: r.salesPersonEmail,
        Quotations: r.totalQuotations,
        Converted: r.converted,
        "Conversion %": r.conversionPercent + "%",
        Revenue: r.totalRevenue,
      })),
      "salesman_performance"
    );
    toast.success("Exported successfully");
  }, [salesmanReport]);

  const exportCustomerHistory = useCallback(() => {
    if (!customerHistory?.quotations?.length) return toast.error("No data to export");
    generateCSV(
      customerHistory.quotations.map((q) => ({
        Date: formatDate(q.date),
        "Quote No": q.quoteNo,
        Amount: q.amount,
        "Discount %": q.discountPercent,
        Status: q.status,
        Salesperson: q.salesPersonName,
      })),
      "customer_history"
    );
    toast.success("Exported successfully");
  }, [customerHistory]);

  const exportProduct = useCallback(() => {
    if (!productReport?.details?.length) return toast.error("No data to export");
    generateCSV(
      productReport.details.map((d: any) => ({
        Date: formatDate(d.project?.date),
        "Quote No": d.project?.projectNo || "-",
        Product: d.quotationName,
        Qty: d.quantity,
        Rate: d.finalPrice,
        Amount: d.totalWithGst,
        Salesperson: d.project?.salesPerson?.name || "-",
      })),
      "product_report"
    );
    toast.success("Exported successfully");
  }, [productReport]);

  const exportDiscount = useCallback(() => {
    if (!discountReport?.items?.length) return toast.error("No data to export");
    generateCSV(
      discountReport.items.map((i: any) => ({
        "Quote No": i.project?.projectNo || "-",
        Product: i.quotationName,
        "Discount %": i.discountPercent,
        "Discount Amt": i.discountAmount,
        Customer: i.project?.customer?.name || "-",
        Salesperson: i.project?.salesPerson?.name || "-",
        Date: formatDate(i.project?.date),
      })),
      "discount_report"
    );
    toast.success("Exported successfully");
  }, [discountReport]);

  /* ─── Loading ─── */
  if (!initialLoaded && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground">Loading reports…</p>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════
     Shared filter badge row
     ═══════════════════════════════════════════════════════ */
  const renderActiveFilterBadges = () => {
    if (!filtersApplied || activeFilterBadges.length === 0) return null;
    return (
      <div className="no-pdf flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Filters:
        </span>
        {activeFilterBadges.map((badge) => (
          <FilterBadge
            key={badge.key}
            label={badge.label}
            onRemove={() => removeFilter(badge.key)}
          />
        ))}
        <button
          type="button"
          onClick={() => clearFilters()}
          className="ml-auto text-xs font-semibold text-destructive hover:opacity-75 transition-opacity"
        >
          Clear All
        </button>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     Shared action row — Apply / Clear / Export buttons
     ═══════════════════════════════════════════════════════ */
  const renderActionRow = (
    exportExcel: () => void,
    exportPDFId: string,
    exportPDFTitle: string,
    hasData: boolean
  ) => (
    <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-border">
      {/* Left: Apply + Clear */}
      <Button
        size="sm"
        className="h-9 gap-1.5"
        onClick={applyFilters}
        disabled={!canApplyFilters}
      >
        <Filter className="h-3.5 w-3.5" />
        Apply Filters
      </Button>
      {filtersApplied && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-destructive hover:text-destructive"
          onClick={() => clearFilters()}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
      {dateIncomplete && (
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          Both start & end dates are required
        </p>
      )}

      {/* Right: Export buttons */}
      <div className="flex gap-2 ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={exportExcel}
          disabled={!hasData}
          className="h-9 gap-1.5"
        >
          <Download className="h-4 w-4" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportPDF(exportPDFId, exportPDFTitle, pdfFilterLabels)}
          disabled={!hasData}
          className="h-9 gap-1.5"
        >
          <FileText className="h-4 w-4" />
          PDF
        </Button>
      </div>
    </div>
  );

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            MIS Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive analytics and business intelligence
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchMasterReport();
            toast.success("Reports refreshed");
          }}
          disabled={loading}
          className="gap-2 h-9"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ── Master Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          value={formatNumber(masterReport?.totalProjects || 0)}
          label="Total Quotations"
          iconColor="text-blue-600"
          iconBg="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          icon={TrendingUp}
          value={formatCurrency(masterReport?.totalRevenue || 0)}
          label="Total Revenue"
          iconColor="text-emerald-600"
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        />
        <StatCard
          icon={Users}
          value={formatNumber(masterReport?.totalCustomers || 0)}
          label="Total Customers"
          iconColor="text-violet-600"
          iconBg="bg-violet-100 dark:bg-violet-900/30"
        />
        <StatCard
          icon={Package}
          value={formatNumber(masterReport?.totalItems || 0)}
          label="Total Items"
          iconColor="text-amber-600"
          iconBg="bg-amber-100 dark:bg-amber-900/30"
        />
      </div>

      {/* ═══════ TABS ═══════ */}
      <Tabs
        value={activeTab}
        className="space-y-6"
        onValueChange={(v) => {
          setActiveTab(v);
          clearFilters(true);
        }}
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex h-10">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="quotation-summary" className="text-xs sm:text-sm">Quotation Summary</TabsTrigger>
            <TabsTrigger value="conversion" className="text-xs sm:text-sm">Conversion</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
            <TabsTrigger value="sales-performance" className="text-xs sm:text-sm">Sales Performance</TabsTrigger>
            <TabsTrigger value="customer-history" className="text-xs sm:text-sm">Customer History</TabsTrigger>
            <TabsTrigger value="product" className="text-xs sm:text-sm">Product</TabsTrigger>
            <TabsTrigger value="discounts" className="text-xs sm:text-sm">Discounts</TabsTrigger>
          </TabsList>
        </div>

        {/* ─────── 1. OVERVIEW ─────── */}
        <TabsContent value="overview" className="space-y-6">
          <div id="report-overview">
            <h2 className="text-lg font-semibold mb-6">Master Report – Hierarchy</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="enterprise-card p-5 md:p-6">
                <h3 className="font-semibold text-foreground mb-4">Status Breakdown</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(masterReport?.statusCounts || []).map((sc: any) => (
                    <div key={sc.status} className="p-4 bg-muted/40 text-center border border-border">
                      <p className="text-2xl font-bold">{sc.count}</p>
                      <p className="text-sm text-muted-foreground capitalize">{sc.status}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatCurrency(Number(sc.value) || 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="enterprise-card p-5 md:p-6">
                <h3 className="font-semibold text-foreground mb-4">Report Hierarchy</h3>
                <div className="space-y-2">
                  {[
                    { name: "Quotation Summary Report", tab: "quotation-summary" },
                    { name: "Conversion Report", tab: "conversion" },
                    { name: "Pending Quotation Report", tab: "pending" },
                    { name: "Salesman Performance Report", tab: "sales-performance" },
                    { name: "Customer History Report", tab: "customer-history" },
                    { name: "Product Report", tab: "product" },
                    { name: "Discount Approval Report", tab: "discounts" },
                  ].map((r) => (
                    <button
                      key={r.tab}
                      onClick={() => {
                        clearFilters(true);
                        setActiveTab(r.tab);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted/50 transition flex items-center justify-between group"
                    >
                      <span className="font-medium text-sm">{r.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─────── 2. QUOTATION SUMMARY ─────── */}
        <TabsContent value="quotation-summary" className="space-y-6">
          {/* Filter Section */}
          <div className="enterprise-card p-4 md:p-5 no-pdf">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date From</label>
                <DatePickerInput
                  value={startDate}
                  onChange={handleStartDateChange}
                  maxDate={endDate || TODAY_STR}
                  placeholder="Start date"
                  disabled={filtersApplied}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date To</label>
                <DatePickerInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate}
                  maxDate={TODAY_STR}
                  disabled={!startDate || filtersApplied}
                  placeholder="End date"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Customer</label>
                <CustomerSearchSelect
                  value={selectedCustomerId}
                  onChange={setSelectedCustomerId}
                  placeholder="Search customer…"
                  apiFn={api.get}
                  disabled={filtersApplied}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={filtersApplied}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Salesman</label>
                <Select value={selectedSalesmanId} onValueChange={setSelectedSalesmanId} disabled={filtersApplied}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="All Salesmen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {salesPersons.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchText}
                    onChange={(e) => { setSearchText(e.target.value); setFiltersApplied(false); }}
                    placeholder="Quote no / project…"
                    className="pl-8 w-full h-9 text-sm"
                    disabled={filtersApplied}
                  />
                </div>
              </div>
            </div>

            {/* Action Row */}
            {renderActionRow(
              exportQuotationSummary,
              "report-quotation-summary",
              "Quotation_Summary",
              !!quotationSummary?.projects?.length
            )}

            {/* Active filter badges */}
            {renderActiveFilterBadges()}
          </div>

          {/* Report Content */}
          <div id="report-quotation-summary" className="space-y-6">
            <h2 className="text-lg font-semibold">
              Quotation Summary
              {loading && <Loader2 className="inline h-4 w-4 animate-spin ml-2 no-pdf" />}
            </h2>

            {/* Summary Cards */}
            {quotationSummary?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStatCard value={formatNumber(quotationSummary.summary.totalQuotations)} label="Total Quotations" />
                <MiniStatCard value={formatCurrency(quotationSummary.summary.totalValue)} label="Total Value" />
                <MiniStatCard value={formatCurrency(quotationSummary.summary.totalDiscount)} label="Total Discount" />
                <MiniStatCard value={formatCurrency(quotationSummary.summary.avgValue)} label="Avg Value" />
              </div>
            )}

            {/* Table */}
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Quotation Details ({quotationSummary?.projects?.length || 0} records)
              </h3>
              <div className="table-container max-h-96">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Quote No</th>
                      <th>Date</th>
                      <th className="hidden sm:table-cell">Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="hidden md:table-cell">Salesperson</th>
                      <th className="hidden lg:table-cell">Project Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!quotationSummary?.projects?.length ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted-foreground py-8">
                          {loading ? "Loading…" : "No quotations found"}
                        </td>
                      </tr>
                    ) : (
                      quotationSummary.projects.map((p) => (
                        <tr key={p.id}>
                          <td className="font-medium">{p.projectNo}</td>
                          <td className="text-muted-foreground">{formatDate(p.date)}</td>
                          <td className="hidden sm:table-cell">{p.customer?.name || "-"}</td>
                          <td className="font-semibold">{formatCurrency(Number(p.grandTotalWithGst))}</td>
                          <td><span className={getStatusBadgeClass(p.status)}>{p.status}</span></td>
                          <td className="hidden md:table-cell text-muted-foreground">{p.salesPerson?.name || "-"}</td>
                          <td className="hidden lg:table-cell text-muted-foreground">{p.projectName || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="enterprise-card p-5 md:p-6">
                <h3 className="font-semibold text-foreground mb-4">Monthly Quotation Value</h3>
                {(quotationSummary?.monthlyChartData?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={quotationSummary!.monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      />
                      <Bar dataKey="value" fill="#A16207" radius={[6, 6, 0, 0]} name="Value" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-16">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "No data available"}
                  </div>
                )}
              </div>
              <div className="enterprise-card p-5 md:p-6">
                <h3 className="font-semibold text-foreground mb-4">Status Distribution</h3>
                {(quotationSummary?.statusDistribution?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={quotationSummary!.statusDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {quotationSummary!.statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-16">No data available</div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─────── 3. CONVERSION REPORT ─────── */}
        <TabsContent value="conversion" className="space-y-6">
          {/* Filter Section */}
          <div className="enterprise-card p-4 md:p-5 no-pdf">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date From</label>
                <DatePickerInput
                  value={startDate}
                  onChange={handleStartDateChange}
                  maxDate={endDate || TODAY_STR}
                  placeholder="Start date"
                  disabled={filtersApplied}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date To</label>
                <DatePickerInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate}
                  maxDate={TODAY_STR}
                  disabled={!startDate || filtersApplied}
                  placeholder="End date"
                />
              </div>
            </div>

            {renderActionRow(
              exportConversion,
              "report-conversion",
              "Conversion_Report",
              !!conversionReport?.data?.length
            )}
            {renderActiveFilterBadges()}
          </div>

          {/* Report Content */}
          <div id="report-conversion" className="space-y-6">
            <h2 className="text-lg font-semibold">
              Quotation vs Order Conversion
              {loading && <Loader2 className="inline h-4 w-4 animate-spin ml-2 no-pdf" />}
            </h2>

            {conversionReport?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStatCard value={conversionReport.summary.totalQuotations} label="Total Quotations" />
                <MiniStatCard
                  value={conversionReport.summary.totalConverted}
                  label="Converted"
                  className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  valueClassName="text-green-700 dark:text-green-400"
                />
                <MiniStatCard
                  value={conversionReport.summary.totalPending}
                  label="Pending"
                  className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  valueClassName="text-amber-700 dark:text-amber-400"
                />
                <MiniStatCard
                  value={`${conversionReport.summary.conversionRate}%`}
                  label="Conversion Rate"
                  className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  valueClassName="text-blue-700 dark:text-blue-400"
                />
              </div>
            )}

            <div className="enterprise-card p-5 md:p-6">
              <div className="table-container max-h-96">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Quote No</th>
                      <th>Customer</th>
                      <th>Quote Amount</th>
                      <th>Order No</th>
                      <th className="hidden sm:table-cell">Order Amount</th>
                      <th>Status</th>
                      <th className="hidden md:table-cell">Salesperson</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!conversionReport?.data?.length ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted-foreground py-8">
                          {loading ? "Loading…" : "No data found"}
                        </td>
                      </tr>
                    ) : (
                      conversionReport.data.map((r) => (
                        <tr key={r.id}>
                          <td className="font-medium">{r.quoteNo}</td>
                          <td>{r.customer}</td>
                          <td>{formatCurrency(r.quoteAmount)}</td>
                          <td className="font-mono text-xs">{r.orderNo || "—"}</td>
                          <td className="hidden sm:table-cell">
                            {r.orderAmount != null ? formatCurrency(r.orderAmount) : "—"}
                          </td>
                          <td><span className={getStatusBadgeClass(r.status)}>{r.status}</span></td>
                          <td className="hidden md:table-cell text-muted-foreground">{r.salesPersonName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─────── 4. PENDING QUOTATIONS ─────── */}
        <TabsContent value="pending" className="space-y-6">
          {/* Filter Section */}
          <div className="enterprise-card p-4 md:p-5 no-pdf">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date From</label>
                <DatePickerInput
                  value={startDate}
                  onChange={handleStartDateChange}
                  maxDate={endDate || TODAY_STR}
                  placeholder="Start date"
                  disabled={filtersApplied}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date To</label>
                <DatePickerInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate}
                  maxDate={TODAY_STR}
                  disabled={!startDate || filtersApplied}
                  placeholder="End date"
                />
              </div>
            </div>

            {renderActionRow(
              exportPending,
              "report-pending",
              "Pending_Quotations",
              !!pendingReport?.data?.length
            )}
            {renderActiveFilterBadges()}
          </div>

          {/* Report Content */}
          <div id="report-pending" className="space-y-6">
            <h2 className="text-lg font-semibold">
              Pending Quotation Pipeline
              {loading && <Loader2 className="inline h-4 w-4 animate-spin ml-2 no-pdf" />}
            </h2>

            {pendingReport?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStatCard value={pendingReport.summary.totalPending} label="Total Pending" />
                <MiniStatCard value={formatCurrency(pendingReport.summary.totalPendingValue)} label="Pending Value" />
                <MiniStatCard value={pendingReport.summary.avgDaysPending} label="Avg Days Pending" />
                <MiniStatCard
                  value={pendingReport.summary.overdueCount}
                  label="Overdue (>7d)"
                  className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  valueClassName="text-red-600 dark:text-red-400"
                />
              </div>
            )}

            <div className="enterprise-card p-5 md:p-6">
              <div className="table-container max-h-96">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Quote No</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Days Pending</th>
                      <th>Follow-up Date</th>
                      <th className="hidden sm:table-cell">Salesperson</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!pendingReport?.data?.length ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted-foreground py-8">
                          {loading ? "Loading…" : "No pending quotations"}
                        </td>
                      </tr>
                    ) : (
                      pendingReport.data.map((r) => (
                        <tr key={r.id}>
                          <td className="font-medium">{r.quoteNo}</td>
                          <td>{r.customer}</td>
                          <td className="font-semibold">{formatCurrency(r.amount)}</td>
                          <td><span className={getDaysPendingClass(r.daysPending)}>{r.daysPending} days</span></td>
                          <td className="text-muted-foreground">{formatDate(r.followUpDate)}</td>
                          <td className="hidden sm:table-cell text-muted-foreground">{r.salesPersonName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─────── 5. SALES PERFORMANCE ─────── */}
        <TabsContent value="sales-performance" className="space-y-6">
          {/* Filter Section */}
          <div className="enterprise-card p-4 md:p-5 no-pdf">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date From</label>
                <DatePickerInput
                  value={startDate}
                  onChange={handleStartDateChange}
                  maxDate={endDate || TODAY_STR}
                  placeholder="Start date"
                  disabled={filtersApplied}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date To</label>
                <DatePickerInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate}
                  maxDate={TODAY_STR}
                  disabled={!startDate || filtersApplied}
                  placeholder="End date"
                />
              </div>
            </div>

            {renderActionRow(
              exportSalesman,
              "report-sales-performance",
              "Sales_Performance",
              !!salesmanReport?.data?.length
            )}
            {renderActiveFilterBadges()}
          </div>

          {/* Report Content */}
          <div id="report-sales-performance" className="space-y-6">
            <h2 className="text-lg font-semibold">
              Salesman Performance Report
              {loading && <Loader2 className="inline h-4 w-4 animate-spin ml-2 no-pdf" />}
            </h2>

            {salesmanReport?.summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MiniStatCard value={salesmanReport.summary.totalSalespeople} label="Active Salespeople" />
                <MiniStatCard value={formatCurrency(salesmanReport.summary.totalRevenue)} label="Total Revenue" />
                <MiniStatCard value={`${salesmanReport.summary.avgConversion}%`} label="Avg Conversion Rate" />
              </div>
            )}

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Sales Performance Table</h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Salesperson</th>
                      <th>Quotations</th>
                      <th>Converted</th>
                      <th>Conversion %</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!salesmanReport?.data?.length ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">
                          {loading ? "Loading…" : "No data available"}
                        </td>
                      </tr>
                    ) : (
                      salesmanReport.data.map((s) => (
                        <tr key={s.salesPersonId}>
                          <td className="font-medium">{s.salesPersonName}</td>
                          <td>{s.totalQuotations}</td>
                          <td>{s.converted}</td>
                          <td>
                            <span className={cn(
                              "font-semibold",
                              s.conversionPercent >= 40 ? "text-green-600" :
                                s.conversionPercent >= 20 ? "text-amber-600" : "text-red-600"
                            )}>
                              {s.conversionPercent}%
                            </span>
                          </td>
                          <td className="font-semibold text-accent">{formatCurrency(s.totalRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Salesperson vs Revenue</h3>
              {(salesmanReport?.data?.length || 0) > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={salesmanReport!.data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="salesPersonName" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    />
                    <Bar dataKey="totalRevenue" fill="#A16207" radius={[0, 6, 6, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-16">No data available</div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─────── 6. CUSTOMER HISTORY ─────── */}
        <TabsContent value="customer-history" className="space-y-6">
          {/* Filter Section */}
          <div className="enterprise-card p-4 md:p-5 no-pdf">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Select Customer</label>
                <CustomerSearchSelect
                  value={custHistoryCustomerId}
                  onChange={setCustHistoryCustomerId}
                  placeholder="Search customer…"
                  apiFn={api.get}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date From</label>
                <DatePickerInput
                  value={custHistoryStart}
                  onChange={handleCustHistoryStartChange}
                  maxDate={custHistoryEnd || TODAY_STR}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date To</label>
                <DatePickerInput
                  value={custHistoryEnd}
                  onChange={setCustHistoryEnd}
                  minDate={custHistoryStart}
                  maxDate={TODAY_STR}
                  disabled={!custHistoryStart}
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-3 pt-4 mt-4 border-t border-border">
              <Button
                size="sm"
                className="h-9 gap-1.5"
                disabled={custDateIncomplete}
                onClick={() =>
                  fetchCustomerHistory({
                    customerId: custHistoryCustomerId !== "all" ? custHistoryCustomerId : undefined,
                    startDate: custHistoryStart || undefined,
                    endDate: custHistoryEnd || undefined,
                  })
                }
              >
                <Search className="h-3.5 w-3.5" />
                View Report
              </Button>
              {hasCustHistoryFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-destructive hover:text-destructive"
                  onClick={clearCustHistoryFilters}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
              {custDateIncomplete && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Both start & end dates are required
                </p>
              )}

              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCustomerHistory}
                  disabled={!customerHistory?.quotations?.length}
                  className="h-9 gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const labels = custHistoryFilterBadges.length > 0 ? custHistoryFilterBadges.map((b) => b.label) : undefined;
                    handleExportPDF("report-customer-history", "Customer_History", labels);
                  }}
                  disabled={!customerHistory}
                  className="h-9 gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>

            {/* Active filter badges */}
            {custHistoryFilterBadges.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filters:</span>
                {custHistoryFilterBadges.map((badge) => (
                  <FilterBadge key={badge.key} label={badge.label} onRemove={() => removeCustHistoryFilter(badge.key)} />
                ))}
                <button
                  type="button"
                  onClick={clearCustHistoryFilters}
                  className="ml-auto text-xs font-semibold text-destructive hover:opacity-75 transition-opacity"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Report Content */}
          <div id="report-customer-history" className="space-y-6">
            <h2 className="text-lg font-semibold">
              Customer History Report
              {loading && <Loader2 className="inline h-4 w-4 animate-spin ml-2 no-pdf" />}
            </h2>

            {/* Customer Profile (when selected) */}
            {customerHistory?.mode === "detail" && customerHistory.profile && (
              <>
                <div className="enterprise-card p-5 md:p-6">
                  <h3 className="font-semibold text-foreground mb-4">Customer Profile</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer Name</p>
                      <p className="font-semibold">{customerHistory.profile.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mobile</p>
                      <p className="font-semibold">{customerHistory.profile.mobile}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">GST</p>
                      <p className="font-semibold">{customerHistory.profile.gstin || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="font-semibold">{customerHistory.profile.address || "-"}</p>
                    </div>
                  </div>
                  {customerHistory.summary && (
                    <div className="grid grid-cols-3 gap-4">
                      <MiniStatCard value={customerHistory.summary.totalQuotations} label="Total Quotations" />
                      <MiniStatCard
                        value={customerHistory.summary.totalOrders}
                        label="Total Orders"
                        className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        valueClassName="text-green-700 dark:text-green-400"
                      />
                      <MiniStatCard value={formatCurrency(customerHistory.summary.totalRevenue)} label="Total Revenue" />
                    </div>
                  )}
                </div>

                {/* Quotation Ledger with Drill-Down */}
                <div className="enterprise-card p-5 md:p-6">
                  <h3 className="font-semibold text-foreground mb-4">Quotation Ledger</h3>
                  <div className="table-container max-h-[500px]">
                    <table className="enterprise-table text-sm">
                      <thead>
                        <tr>
                          <th className="w-8"></th>
                          <th>Date</th>
                          <th>Quote No</th>
                          <th>Amount</th>
                          <th className="hidden sm:table-cell">Discount</th>
                          <th>Status</th>
                          <th className="hidden md:table-cell">Salesperson</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!customerHistory.quotations?.length ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted-foreground py-8">
                              No quotations found
                            </td>
                          </tr>
                        ) : (
                          customerHistory.quotations.map((q) => (
                            <React.Fragment key={q.id}>
                              <tr className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(q.id)}>
                                <td>
                                  {expandedRows.has(q.id)
                                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                </td>
                                <td className="text-muted-foreground">{formatDate(q.date)}</td>
                                <td className="font-medium">{q.quoteNo}</td>
                                <td className="font-semibold">{formatCurrency(q.amount)}</td>
                                <td className="hidden sm:table-cell text-muted-foreground">{q.discountPercent}%</td>
                                <td><span className={getStatusBadgeClass(q.status)}>{q.status}</span></td>
                                <td className="hidden md:table-cell text-muted-foreground">{q.salesPersonName}</td>
                              </tr>
                              {expandedRows.has(q.id) && q.items.length > 0 && (
                                <tr>
                                  <td colSpan={7} className="p-0">
                                    <div className="bg-muted/30 p-4 border-t border-b border-border">
                                      <p className="text-xs font-semibold text-muted-foreground mb-2">Product Details</p>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b border-border">
                                            <th className="text-left py-1 px-2 font-medium">Product</th>
                                            <th className="text-left py-1 px-2 font-medium">Qty</th>
                                            <th className="text-left py-1 px-2 font-medium">Rate</th>
                                            <th className="text-left py-1 px-2 font-medium">Amount</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {q.items.map((item) => (
                                            <tr key={item.id} className="border-b border-border/50">
                                              <td className="py-1 px-2">{item.product}</td>
                                              <td className="py-1 px-2">{item.quantity}</td>
                                              <td className="py-1 px-2">{formatCurrency(item.rate)}</td>
                                              <td className="py-1 px-2 font-semibold">{formatCurrency(item.amount)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Customer List (when no customer selected) */}
            {customerHistory?.mode === "list" && (
              <div className="enterprise-card p-5 md:p-6">
                <h3 className="font-semibold text-foreground mb-4">Select a customer to view history</h3>
                <div className="table-container max-h-96">
                  <table className="enterprise-table text-sm">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th className="hidden sm:table-cell">Mobile</th>
                        <th className="hidden md:table-cell">City</th>
                        <th className="hidden lg:table-cell">GST</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(customerHistory.customers || []).map((c: any) => (
                        <tr key={c.id}>
                          <td className="font-medium">{c.name}</td>
                          <td className="hidden sm:table-cell text-muted-foreground">{c.mobile}</td>
                          <td className="hidden md:table-cell text-muted-foreground">{c.city || "-"}</td>
                          <td className="hidden lg:table-cell text-muted-foreground font-mono text-xs">{c.gstin || "-"}</td>
                          <td>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setCustHistoryCustomerId(c.id);
                                fetchCustomerHistory({ customerId: c.id });
                              }}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!customerHistory && !loading && (
              <div className="enterprise-card p-5 md:p-6 text-center text-muted-foreground py-16">
                Click "View Report" to load customer history
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─────── 7. PRODUCT REPORT ─────── */}
        <TabsContent value="product" className="space-y-6">
          {/* Filter Section */}
          <div className="enterprise-card p-4 md:p-5 no-pdf">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date From</label>
                <DatePickerInput
                  value={startDate}
                  onChange={handleStartDateChange}
                  maxDate={endDate || TODAY_STR}
                  placeholder="Start date"
                  disabled={filtersApplied}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date To</label>
                <DatePickerInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate}
                  maxDate={TODAY_STR}
                  disabled={!startDate || filtersApplied}
                  placeholder="End date"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter} disabled={filtersApplied}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {renderActionRow(
              exportProduct,
              "report-product",
              "Product_Report",
              !!productReport?.details?.length
            )}
            {renderActiveFilterBadges()}
          </div>

          {/* Report Content */}
          <div id="report-product" className="space-y-6">
            <h2 className="text-lg font-semibold">
              Product Report
              {loading && <Loader2 className="inline h-4 w-4 animate-spin ml-2 no-pdf" />}
            </h2>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Product-wise Summary</h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="hidden sm:table-cell">Code</th>
                      <th>Used</th>
                      <th>Total Qty</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!productReport?.summary?.length ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-8">
                          {loading ? "Loading…" : "No data available"}
                        </td>
                      </tr>
                    ) : (
                      productReport.summary.map((p: any, i: number) => (
                        <tr key={i}>
                          <td className="font-medium max-w-[150px] truncate">{p.quotationName}</td>
                          <td className="hidden sm:table-cell font-mono text-xs text-muted-foreground">{p.quotationCode}</td>
                          <td>
                            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs font-medium">{p.timesUsed}x</span>
                          </td>
                          <td>{p.totalQuantity}</td>
                          <td className="font-semibold text-accent">{formatCurrency(Number(p.totalRevenue))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Product Detail Records ({productReport?.details?.length || 0})
              </h3>
              <div className="table-container max-h-96">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Quote No</th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Amount</th>
                      <th className="hidden sm:table-cell">Salesperson</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!productReport?.details?.length ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted-foreground py-8">
                          {loading ? "Loading…" : "No data available"}
                        </td>
                      </tr>
                    ) : (
                      productReport.details.map((d: any) => (
                        <tr key={d.id}>
                          <td className="text-muted-foreground">{formatDate(d.project?.date)}</td>
                          <td className="font-medium">{d.project?.projectNo || "-"}</td>
                          <td className="max-w-[120px] truncate">{d.quotationName}</td>
                          <td>{d.quantity}</td>
                          <td>{formatCurrency(Number(d.finalPrice) || 0)}</td>
                          <td className="font-semibold">{formatCurrency(Number(d.totalWithGst) || 0)}</td>
                          <td className="hidden sm:table-cell text-muted-foreground">{d.project?.salesPerson?.name || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─────── 8. DISCOUNT APPROVAL ─────── */}
        <TabsContent value="discounts" className="space-y-6">
          {/* Filter Section */}
          <div className="enterprise-card p-4 md:p-5 no-pdf">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date From</label>
                <DatePickerInput
                  value={startDate}
                  onChange={handleStartDateChange}
                  maxDate={endDate || TODAY_STR}
                  placeholder="Start date"
                  disabled={filtersApplied}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Date To</label>
                <DatePickerInput
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={startDate}
                  maxDate={TODAY_STR}
                  disabled={!startDate || filtersApplied}
                  placeholder="End date"
                />
              </div>
            </div>

            {renderActionRow(
              exportDiscount,
              "report-discounts",
              "Discount_Report",
              !!discountReport?.items?.length
            )}
            {renderActiveFilterBadges()}
          </div>

          {/* Report Content */}
          <div id="report-discounts" className="space-y-6">
            <h2 className="text-lg font-semibold">
              Discount Approval Report
              {loading && <Loader2 className="inline h-4 w-4 animate-spin ml-2 no-pdf" />}
            </h2>

            {discountReport?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MiniStatCard value={discountReport.summary.totalDiscountedItems} label="Discounted Items" />
                <MiniStatCard value={formatCurrency(discountReport.summary.totalDiscountValue)} label="Total Discount Value" />
                <MiniStatCard value={discountReport.summary.totalOTPRequests} label="OTP Requests" />
                <MiniStatCard
                  value={discountReport.summary.approvedOTPs}
                  label="Approved OTPs"
                  className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  valueClassName="text-green-700 dark:text-green-400"
                />
              </div>
            )}

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Discounted Items</h3>
              <div className="table-container max-h-96">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Quote No</th>
                      <th>Product</th>
                      <th>Discount %</th>
                      <th className="hidden sm:table-cell">Discount Amt</th>
                      <th className="hidden md:table-cell">Customer</th>
                      <th className="hidden lg:table-cell">Salesperson</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!discountReport?.items?.length ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted-foreground py-8">
                          {loading ? "Loading…" : "No discounted items found"}
                        </td>
                      </tr>
                    ) : (
                      discountReport.items.map((item: any) => (
                        <tr key={item.id}>
                          <td className="font-medium">{item.project?.projectNo || "-"}</td>
                          <td className="max-w-[120px] truncate">{item.quotationName}</td>
                          <td className="text-destructive font-medium">{item.discountPercent}%</td>
                          <td className="hidden sm:table-cell text-destructive">-{formatCurrency(Number(item.discountAmount) || 0)}</td>
                          <td className="hidden md:table-cell text-muted-foreground">{item.project?.customer?.name || "-"}</td>
                          <td className="hidden lg:table-cell text-muted-foreground">{item.project?.salesPerson?.name || "-"}</td>
                          <td className="text-muted-foreground">{formatDate(item.project?.date)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {(discountReport?.otpLogs?.length || 0) > 0 && (
              <div className="enterprise-card p-5 md:p-6">
                <h3 className="font-semibold text-foreground mb-4">OTP Approval Logs</h3>
                <div className="table-container max-h-72">
                  <table className="enterprise-table text-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th className="hidden sm:table-cell">Requested By</th>
                        <th className="hidden md:table-cell">Approved By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountReport!.otpLogs.map((log: any) => (
                        <tr key={log.id}>
                          <td className="text-muted-foreground">{formatDate(log.createdAt)}</td>
                          <td>{log.email}</td>
                          <td>
                            <span className={getStatusBadgeClass(
                              log.status === "approved" ? "approved" :
                                log.status === "pending" ? "pending" : "expired"
                            )}>
                              {log.status}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell text-muted-foreground">{log.requestedByName || "-"}</td>
                          <td className="hidden md:table-cell text-muted-foreground">{log.approvedByName || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;