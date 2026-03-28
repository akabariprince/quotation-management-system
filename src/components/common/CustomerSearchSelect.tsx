import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, User, Phone, MapPin, Check } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { Customer } from "@/hooks/useCustomers";
import clsx from "clsx";

interface CustomerSearchSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomerSearchSelect: React.FC<CustomerSearchSelectProps> = ({
  value,
  onChange,
  placeholder = "Search customer by name or mobile...",
  className = "",
}) => {
  const { get } = useApi();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Load initial customers (most recent 20)
  const loadInitialCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(
        "/customers?limit=20&sortBy=updatedAt&sortOrder=DESC",
      );
      setCustomers(res.data || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  // Search customers dynamically
  const searchCustomers = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        loadInitialCustomers();
        return;
      }
      setLoading(true);
      try {
        const res = await get(
          `/customers?search=${encodeURIComponent(term)}&limit=20&sortBy=updatedAt&sortOrder=DESC`,
        );
        setCustomers(res.data || []);
      } catch {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    },
    [get, loadInitialCustomers],
  );

  // Load selected customer details when value changes externally
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

  // Handle search with debounce
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchCustomers(term);
    }, 300);
  };

  // Handle customer selection
  const handleSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    onChange(customer.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Handle clear
  const handleClear = () => {
    setSelectedCustomer(null);
    onChange("");
    setSearchTerm("");
  };

  // Handle open
  const handleOpen = () => {
    setIsOpen(true);
    loadInitialCustomers();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Close on outside click
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

  // Skeleton for dropdown
  const DropdownSkeleton = () => (
    <div className="space-y-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 animate-pulse"
        >
          <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-3.5 bg-muted rounded w-28 mb-1" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Display selected customer or trigger */}
      {!isOpen && (
        <div
          onClick={handleOpen}
          className="flex items-center justify-between h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-foreground font-bold font-semibold text-xs">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium truncate">
                {selectedCustomer.name}
              </span>
              <span className="text-muted-foreground text-xs">
                - {selectedCustomer.mobile}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1">
            {selectedCustomer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-0.5 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Search input when open */}
      {isOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Type to search customers..."
            className="flex h-11 w-full rounded-md border border-accent bg-background px-3 py-2 pl-10 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[99999]  w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <DropdownSkeleton />
          ) : customers.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {searchTerm
                ? `No customers found for "${searchTerm}"`
                : "No customers available"}
            </div>
          ) : (
            <div className="py-1">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className={`w-full text-left px-3 py-2.5 flex items-center gap-3 bg-white ${
                    value === customer.id ? "" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8  ${
                      value === customer.id ? "bg-accent/10" : "bg-accent/10"
                    } rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-foreground font-bold font-semibold text-xs">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {customer.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.mobile}
                      </span>
                      {customer.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.city}
                        </span>
                      )}
                    </div>
                  </div>
                  {value === customer.id && (
                    <Check className="h-4 w-4 text-foreground font-bold flex-shrink-0" />
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

export default CustomerSearchSelect;
