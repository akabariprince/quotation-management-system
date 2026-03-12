import { useState, useCallback } from "react";
import { useApi } from "@/hooks/useApi";

/* ────────── Types ────────── */

export interface MasterReport {
  totalProjects: number;
  totalCustomers: number;
  totalRevenue: number;
  totalItems: number;
  statusCounts: { status: string; count: number; value: number }[];
}

export interface QuotationSummaryProject {
  id: string;
  projectNo: string;
  date: string;
  customerId: string;
  salesPersonId: string | null;
  subtotal: string;
  totalDiscount: string;
  cgst: string;
  sgst: string;
  igst: string;
  grandTotal: string;
  grandTotalWithGst: string;
  projectName: string | null;
  status: string;
  customer?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    mobile?: string;
    email?: string;
  };
  salesPerson?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface QuotationSummaryReport {
  projects: QuotationSummaryProject[];
  monthlyChartData: { month: string; value: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  summary: {
    totalQuotations: number;
    totalValue: number;
    totalDiscount: number;
    avgValue: number;
  };
}

export interface ConversionRow {
  id: string;
  quoteNo: string;
  date: string;
  customer: string;
  customerId: string;
  quoteAmount: number;
  orderNo: string | null;
  orderAmount: number | null;
  status: string;
  projectName: string;
  salesPersonId: string | null;
  salesPersonName: string;
}

export interface ConversionReport {
  data: ConversionRow[];
  summary: {
    totalQuotations: number;
    totalConverted: number;
    totalPending: number;
    totalExpired: number;
    conversionRate: number;
    convertedValue: number;
    pendingValue: number;
    lostValue: number;
  };
}

export interface PendingRow {
  id: string;
  quoteNo: string;
  date: string;
  customer: string;
  customerMobile: string;
  customerEmail: string;
  amount: number;
  daysPending: number;
  followUpDate: string;
  status: string;
  salesPersonId: string | null;
  salesPersonName: string;
  projectName: string;
}

export interface PendingReport {
  data: PendingRow[];
  summary: {
    totalPending: number;
    totalPendingValue: number;
    avgDaysPending: number;
    overdueCount: number;
    draftCount: number;
    sentCount: number;
  };
}

export interface SalesmanRow {
  salesPersonId: string;
  salesPersonName: string;
  salesPersonEmail: string;
  totalQuotations: number;
  converted: number;
  conversionPercent: number;
  totalRevenue: number;
  convertedRevenue: number;
  totalDiscount: number;
}

export interface SalesmanReport {
  data: SalesmanRow[];
  summary: {
    totalSalespeople: number;
    totalRevenue: number;
    avgConversion: number;
  };
}

export interface CustomerHistoryItem {
  id: string;
  product: string;
  code: string;
  quantity: number;
  rate: number;
  amount: number;
  basePrice: number;
  discountPercent: number;
  wood: string | null;
  polish: string | null;
  fabric: string | null;
}

export interface CustomerQuotation {
  id: string;
  date: string;
  quoteNo: string;
  amount: number;
  subtotal: number;
  discount: number;
  discountPercent: string;
  status: string;
  salesPersonId: string | null;
  salesPersonName: string;
  projectName: string | null;
  items: CustomerHistoryItem[];
}

export interface CustomerHistoryReport {
  mode: "list" | "detail";
  customers: any[] | null;
  customerSummaries?: any[];
  profile: {
    id: string;
    name: string;
    mobile: string;
    email: string | null;
    gstin: string | null;
    address: string;
    city: string | null;
    state: string | null;
  } | null;
  summary: {
    totalQuotations: number;
    totalOrders: number;
    totalRevenue: number;
    totalDiscount: number;
  } | null;
  quotations: CustomerQuotation[];
}

export interface ProductSummaryRow {
  quotationId: string;
  quotationName: string;
  quotationCode: string;
  timesUsed: number;
  totalQuantity: number;
  totalRevenue: number;
  avgPrice: number;
  totalDiscount: number;
}

export interface ProductReport {
  summary: ProductSummaryRow[];
  details: any[];
}

export interface DiscountReport {
  items: any[];
  otpLogs: any[];
  summary: {
    totalDiscountedItems: number;
    totalDiscountValue: number;
    totalOTPRequests: number;
    approvedOTPs: number;
    pendingOTPs: number;
  };
}

export interface DetailedReport {
  project: any;
  emailLogs: any[];
  otpLogs: any[];
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  salesPersonId?: string;
  customerId?: string;
  projectName?: string;
  search?: string;
  dateRange?: "daily" | "weekly" | "monthly" | "yearly";
}

/* ────────── Hook ────────── */

export const useReports = () => {
  const { get } = useApi();

  const [masterReport, setMasterReport] =
    useState<MasterReport | null>(null);
  const [quotationSummary, setQuotationSummary] =
    useState<QuotationSummaryReport | null>(null);
  const [conversionReport, setConversionReport] =
    useState<ConversionReport | null>(null);
  const [pendingReport, setPendingReport] =
    useState<PendingReport | null>(null);
  const [salesmanReport, setSalesmanReport] =
    useState<SalesmanReport | null>(null);
  const [customerHistory, setCustomerHistory] =
    useState<CustomerHistoryReport | null>(null);
  const [productReport, setProductReport] =
    useState<ProductReport | null>(null);
  const [discountReport, setDiscountReport] =
    useState<DiscountReport | null>(null);
  const [detailedReport, setDetailedReport] =
    useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Helpers ── */

  const buildQueryString = (params: Record<string, any>): string => {
    const parts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        key !== "dateRange"
      ) {
        parts.push(`${key}=${encodeURIComponent(value)}`);
      }
    });
    return parts.length > 0 ? `?${parts.join("&")}` : "";
  };

  const getDateRangeFromPreset = (
    preset: string
  ): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString().split("T")[0];
    let startDate: string;

    switch (preset) {
      case "daily":
        startDate = endDate;
        break;
      case "weekly": {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split("T")[0];
        break;
      }
      case "monthly": {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        startDate = d.toISOString().split("T")[0];
        break;
      }
      case "yearly": {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        startDate = d.toISOString().split("T")[0];
        break;
      }
      default: {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 6);
        startDate = d.toISOString().split("T")[0];
        break;
      }
    }

    return { startDate, endDate };
  };

  const resolveFilters = (filters?: ReportFilters): Record<string, any> => {
    if (!filters) return {};
    const resolved: Record<string, any> = { ...filters };
    if (filters.dateRange && !filters.startDate && !filters.endDate) {
      const { startDate, endDate } = getDateRangeFromPreset(
        filters.dateRange
      );
      resolved.startDate = startDate;
      resolved.endDate = endDate;
    }
    delete resolved.dateRange;
    return resolved;
  };

  /* ── Fetch Functions ── */

  const fetchMasterReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get("/reports/master");
      const data: MasterReport = res.data;
      setMasterReport(data);
      return data;
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch master report";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchQuotationSummary = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const qs = buildQueryString(resolved);
        const res = await get(`/reports/quotation-summary${qs}`);
        const data: QuotationSummaryReport = res.data;
        setQuotationSummary(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch quotation summary";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchConversionReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const qs = buildQueryString(resolved);
        const res = await get(`/reports/conversion${qs}`);
        const data: ConversionReport = res.data;
        setConversionReport(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch conversion report";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchPendingReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const qs = buildQueryString(resolved);
        const res = await get(`/reports/pending${qs}`);
        const data: PendingReport = res.data;
        setPendingReport(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch pending report";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchSalesmanReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const qs = buildQueryString(resolved);
        const res = await get(`/reports/salesman-performance${qs}`);
        const data: SalesmanReport = res.data;
        setSalesmanReport(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch salesman report";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchCustomerHistory = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const qs = buildQueryString(resolved);
        const res = await get(`/reports/customer-history${qs}`);
        const data: CustomerHistoryReport = res.data;
        setCustomerHistory(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch customer history";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchProductReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const qs = buildQueryString(resolved);
        const res = await get(`/reports/product${qs}`);
        const data: ProductReport = res.data;
        setProductReport(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch product report";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchDiscountReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const qs = buildQueryString(resolved);
        const res = await get(`/reports/discount-approval${qs}`);
        const data: DiscountReport = res.data;
        setDiscountReport(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch discount report";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchDetailedReport = useCallback(
    async (projectId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await get(`/reports/detailed/${projectId}`);
        const data: DetailedReport = res.data;
        setDetailedReport(data);
        return data;
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch detailed report";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  return {
    masterReport,
    quotationSummary,
    conversionReport,
    pendingReport,
    salesmanReport,
    customerHistory,
    productReport,
    discountReport,
    detailedReport,
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
    fetchDetailedReport,
    getDateRangeFromPreset,
  };
};