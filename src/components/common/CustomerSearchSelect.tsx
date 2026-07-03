import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Check, ShieldCheck, ShieldX } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { Customer } from "@/hooks/useCustomers";

interface CustomerSearchSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  value,
  onChange,
  placeholder = "Search customer by name or mobile...",
  className = "",
  disabled = false,
}) => {
  const { get } = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const loadInitialCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(
        "/customers?limit=20&sortBy=updatedAt&sortOrder=DESC"
      );
      setCustomers(res.data || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const searchCustomers = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        loadInitialCustomers();
        return;
      }
      setLoading(true);
      try {
        const res = await get(
          `/customers?search=${encodeURIComponent(term)}&limit=20&sortBy=updatedAt&sortOrder=DESC`
        );
        setCustomers(res.data || []);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    },
    [get, loadInitialCustomers]
  );

  useEffect(() => {
    const loadSelectedCustomer = async () => {
      if (value && !selectedCustomer) {
        try {
          const res = await get(`/customers/${value}`);
          if (res.data) {
            setSelectedCustomer(res.data);
          }
        } catch {
          // silent
        }
      } else if (!value) {
        setSelectedCustomer(null);
      }
    };
    loadSelectedCustomer();
  }, [value]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchCustomers(term);
    }, 300);
  };

  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    onChange(customer.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    onChange("");
    setSearchTerm("");
  };

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    loadInitialCustomers();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

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

  const DropdownSkeleton = () => (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-3 py-2 animate-pulse">
          <div className="h-3.5 bg-muted  w-3/4" />
        </div>
      ))}
    </div>
  );

  const txtStyle: React.CSSProperties = {
    fontSize: "var(--text-sm)",
    fontWeight: 400,
    textTransform: "none",
    letterSpacing: "-0.006em",
    fontFamily: "var(--font-sans)",
    color: "#323232",
  };

  /* Build single-line label: "Name · Mobile · City" */
  const customerLabel = (c: Customer) => {
    let label = c.name;
    if (c.mobile) label += ` · ${c.mobile}`;
    if (c.city) label += ` · ${c.city}`;
    return label;
  };

  const renderBadge = (
    verified: boolean | undefined,
    verifiedShort: string,
    notVerifiedShort: string
  ) => (
    <span
      className={`inline-flex items-center gap-1  px-1.5 py-px text-[10px] font-medium ${
        verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      {verified ? (
        <ShieldCheck className="h-2.5 w-2.5" />
      ) : (
        <ShieldX className="h-2.5 w-2.5" />
      )}
      {verified ? verifiedShort : notVerifiedShort}
    </span>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Trigger ── */}
      {!isOpen && (
        <div
          onClick={disabled ? undefined : handleOpen}
          className={`flex items-center justify-between h-8 w-full border border-input bg-background px-3 ${disabled ? "cursor-not-allowed opacity-60 bg-muted/30" : "cursor-pointer"}`}
          style={txtStyle}
        >
          {selectedCustomer ? (
            <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
              <span className="truncate" style={txtStyle}>
                {customerLabel(selectedCustomer)}
              </span>
              {/* <div className="flex flex-wrap items-center gap-1">
                {renderBadge(
                  selectedCustomer.emailVerified,
                  "Email Verified",
                  "Email Not Verified"
                )}
                {renderBadge(
                  selectedCustomer.whatsappVerified,
                  "WA Verified",
                  "WA Not Verified"
                )}
              </div> */}
            </div>
          ) : (
            <span
              className="truncate flex-1"
              style={{ ...txtStyle, opacity: 0.5 }}
            >
              {placeholder}
            </span>
          )}
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {selectedCustomer && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-0.5"
                style={txtStyle}
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* ── Search input ── */}
      {isOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Type to search customers..."
            className="flex h-8 w-full border border-accent bg-background pl-10 pr-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={txtStyle}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                setSearchTerm("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setSearchTerm("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            style={txtStyle}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute z-[99999] w-full mt-1 bg-popover border border-border shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <DropdownSkeleton />
          ) : customers.length === 0 ? (
            <div className="px-3 py-4 text-center" style={{ ...txtStyle, opacity: 0.5 }}>
              {searchTerm
                ? `No customers found for "${searchTerm}"`
                : "No customers available"}
            </div>
          ) : (
            customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelect(customer)}
                className="w-full text-left px-3 py-2 flex items-center gap-2 bg-white"
                style={txtStyle}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate" style={txtStyle}>
                    {customerLabel(customer)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {renderBadge(
                      customer.emailVerified,
                      "Email Verified",
                      "Email Not Verified"
                    )}
                    {renderBadge(
                      customer.whatsappVerified,
                      "WA Verified",
                      "WA Not Verified"
                    )}
                  </div>
                </div>
                {value === customer.id && (
                  <Check className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchSelect;
