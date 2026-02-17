import { useState, useCallback } from 'react';
import { useApi } from '@/hooks/useApi';

export interface SalesReportProject {
  id: string;
  projectNo: string;
  date: string;
  salesPersonId: string;  // Changed from salesManager
  status: string;
  subtotal: number;
  totalDiscount: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  grandTotalWithGst: number;
  customer: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
}

export interface SalesReportSummary {
  totalProjects: number;
  totalValue: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  avgOrderValue: number;
}

export interface SalesReportResponse {
  projects: SalesReportProject[];
  summary: SalesReportSummary;
}

export interface QuotationReportItem {
  quotationId: string;
  quotationName: string;
  timesUsed: number;
  totalQuantity: number;
  totalRevenue: number;
}

export interface CustomerReportItem {
  customerId: string;
  totalProjects: number;
  totalValue: number;
  totalDiscount: number;
  customer: {
    id: string;
    name: string;
    city: string;
    state: string;
    mobile: string;
    email: string;
  };
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  salesPersonId?: string;  // Changed from salesManager
  dateRange?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const useReports = () => {
  const { get } = useApi();
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(null);
  const [quotationReport, setQuotationReport] = useState<QuotationReportItem[]>([]);
  const [customerReport, setCustomerReport] = useState<CustomerReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildQueryString = (params: Record<string, any>): string => {
    const queryParts: string[] = [];
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'dateRange') {
        queryParts.push(`${key}=${encodeURIComponent(value)}`);
      }
    });
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  };

  const getDateRangeFromPreset = (
    preset: string
  ): { startDate: string; endDate: string } => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    switch (preset) {
      case 'daily':
        startDate = endDate;
        break;
      case 'weekly': {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      case 'monthly': {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      case 'yearly': {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        startDate = d.toISOString().split('T')[0];
        break;
      }
      default: {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 6);
        startDate = d.toISOString().split('T')[0];
        break;
      }
    }

    return { startDate, endDate };
  };

  const resolveFilters = (filters?: ReportFilters): Record<string, any> => {
    if (!filters) return {};
    const resolved: Record<string, any> = { ...filters };

    // Convert dateRange preset to actual dates
    if (filters.dateRange && !filters.startDate && !filters.endDate) {
      const { startDate, endDate } = getDateRangeFromPreset(filters.dateRange);
      resolved.startDate = startDate;
      resolved.endDate = endDate;
    }

    // Remove dateRange from query params (backend doesn't understand it)
    delete resolved.dateRange;

    return resolved;
  };

  const fetchSalesReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const queryString = buildQueryString(resolved);
        const res = await get(`/reports/sales${queryString}`);
        const data: SalesReportResponse = res.data;
        setSalesReport(data);
        return data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch sales report';
        setError(message);
        setSalesReport(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchQuotationReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const queryString = buildQueryString(resolved);
        const res = await get(`/reports/quotations${queryString}`);
        const data: QuotationReportItem[] = res.data || [];
        setQuotationReport(data);
        return data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch quotation report';
        setError(message);
        setQuotationReport([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchCustomerReport = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const resolved = resolveFilters(filters);
        const queryString = buildQueryString(resolved);
        const res = await get(`/reports/customers${queryString}`);
        const data: CustomerReportItem[] = res.data || [];
        setCustomerReport(data);
        return data;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch customer report';
        setError(message);
        setCustomerReport([]);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [get]
  );

  const fetchAllReports = useCallback(
    async (filters?: ReportFilters) => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          fetchSalesReport(filters),
          fetchQuotationReport(filters),
          fetchCustomerReport(filters),
        ]);
        return {
          sales: results[0].status === 'fulfilled' ? results[0].value : null,
          quotations:
            results[1].status === 'fulfilled' ? results[1].value : [],
          customers:
            results[2].status === 'fulfilled' ? results[2].value : [],
        };
      } finally {
        setLoading(false);
      }
    },
    [fetchSalesReport, fetchQuotationReport, fetchCustomerReport]
  );

  return {
    salesReport,
    quotationReport,
    customerReport,
    loading,
    error,
    fetchSalesReport,
    fetchQuotationReport,
    fetchCustomerReport,
    fetchAllReports,
    getDateRangeFromPreset,
  };
};