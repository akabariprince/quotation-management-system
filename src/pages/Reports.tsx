import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import { useReports } from "@/hooks/useReports";
import { useCategories } from "@/hooks/useCategories";
import { useQuotations, Quotation } from "@/hooks/useQuotations";
import { useCustomers } from "@/hooks/useCustomers";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "sonner";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getStatusBadgeClass,
  generateCSV,
  aggregateByMonth,
  aggregateByStatus,
  groupByRegion,
} from "@/utils/reportHelpers";

const COLORS = [
  "#111827",
  "#A16207",
  "#6B7280",
  "#166534",
  "#92400E",
  "#7C3AED",
  "#0891B2",
];

const Reports: React.FC = () => {
  const { user } = useAuth();

  const {
    salesReport,
    quotationReport,
    customerReport,
    loading: reportsLoading,
    error,
    fetchSalesReport,
    fetchQuotationReport,
    fetchCustomerReport,
    fetchAllReports,
  } = useReports();

  const { categories, fetchAllCategories } = useCategories();
  const {
    quotations,
    loading: quotationsLoading,
    fetchAllQuotations,
  } = useQuotations();
  const {
    customers,
    loading: customersLoading,
    fetchCustomers,
  } = useCustomers();

  const [dateRange, setDateRange] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("quotations");
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [allQuotations, setAllQuotations] = useState<Quotation[]>([]);

  const loading = reportsLoading || quotationsLoading || customersLoading;

  // ============ INITIAL LOAD ============
  useEffect(() => {
    const loadInitialData = async () => {
      const [, , , allQ] = await Promise.allSettled([
        fetchAllReports({ dateRange: "monthly" }),
        fetchAllCategories(),
        fetchCustomers({ limit: 10000 }),
        fetchAllQuotations(),
      ]);
      if (allQ.status === "fulfilled") {
        setAllQuotations(allQ.value || []);
      }
      setInitialLoaded(true);
    };
    loadInitialData();
  }, []);

  // ============ FILTER-BASED REFETCH ============
  useEffect(() => {
    if (!initialLoaded) return;

    const filters: any = {};

    // Use custom dates if provided, otherwise use preset
    if (customStartDate && customEndDate) {
      filters.startDate = customStartDate;
      filters.endDate = customEndDate;
    } else {
      filters.dateRange = dateRange;
    }

    if (statusFilter !== "all") filters.status = statusFilter;

    switch (activeTab) {
      case "quotations":
      case "financial":
        fetchSalesReport(filters);
        break;
      case "customers":
        fetchCustomerReport(filters);
        break;
      case "products":
        fetchQuotationReport(filters);
        break;
    }
  }, [
    dateRange,
    statusFilter,
    customStartDate,
    customEndDate,
    activeTab,
    initialLoaded,
  ]);

  // ============ DERIVED DATA ============

  const monthlyChartData = useMemo(() => {
    if (!salesReport?.projects) return [];
    return aggregateByMonth(
      salesReport.projects.map((p) => ({
        date: p.date,
        value: Number(p.grandTotalWithGst) || 0,
      })),
    );
  }, [salesReport]);

  const statusDistribution = useMemo(() => {
    if (!salesReport?.projects) return [];
    return aggregateByStatus(salesReport.projects);
  }, [salesReport]);

  const expiredProjects = useMemo(() => {
    if (!salesReport?.projects) return [];
    return salesReport.projects.filter((p) => p.status === "expired");
  }, [salesReport]);

  const topCustomers = useMemo(() => {
    if (!customerReport) return [];
    return [...customerReport]
      .sort((a, b) => Number(b.totalValue) - Number(a.totalValue))
      .slice(0, 10);
  }, [customerReport]);

  const regionData = useMemo(() => {
    if (!customerReport) return [];
    const stateData = customerReport
      .filter((c) => c.customer)
      .map((c) => ({ state: c.customer.state, city: c.customer.city }));
    return groupByRegion(stateData);
  }, [customerReport]);

  const quotationFrequency = useMemo(() => {
    if (!quotationReport) return [];
    return [...quotationReport]
      .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
      .slice(0, 10);
  }, [quotationReport]);

  const categoryDistribution = useMemo(() => {
    if (!categories.length || !allQuotations.length) return [];
    return categories
      .map((cat) => ({
        name: cat.name,
        quotations: allQuotations.filter((q) => q.categoryId === cat.id).length,
      }))
      .filter((c) => c.quotations > 0);
  }, [categories, allQuotations]);

  const highValueQuotations = useMemo(() => {
    if (!allQuotations.length) return [];
    return [...allQuotations]
      .sort((a, b) => (Number(b.basePrice) || 0) - (Number(a.basePrice) || 0))
      .slice(0, 10);
  }, [allQuotations]);

  // Use ACTUAL GST fields from backend instead of estimating
  const financialSummary = useMemo(() => {
    if (!salesReport?.summary) {
      return {
        totalValue: 0,
        totalDiscount: 0,
        avgOrderValue: 0,
        totalProjects: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        discountRate: 0,
      };
    }
    const s = salesReport.summary;
    return {
      totalValue: s.totalValue,
      totalDiscount: s.totalDiscount,
      avgOrderValue: s.avgOrderValue,
      totalProjects: s.totalProjects,
      totalCgst: s.totalCgst || 0,
      totalSgst: s.totalSgst || 0,
      totalIgst: s.totalIgst || 0,
      discountRate:
        s.totalValue > 0
          ? (s.totalDiscount / (s.totalValue + s.totalDiscount)) * 100
          : 0,
    };
  }, [salesReport]);

  // GST monthly from actual project fields
  const gstMonthlyData = useMemo(() => {
    if (!salesReport?.projects) return [];
    const monthMap: Record<
      string,
      { cgst: number; sgst: number; igst: number }
    > = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    salesReport.projects.forEach((p) => {
      const date = new Date(p.date);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { cgst: 0, sgst: 0, igst: 0 };
      monthMap[key].cgst += Number(p.cgst) || 0;
      monthMap[key].sgst += Number(p.sgst) || 0;
      monthMap[key].igst += Number(p.igst) || 0;
    });

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [, monthIndex] = key.split("-");
        return {
          month: monthNames[parseInt(monthIndex)],
          cgst: Math.round(val.cgst),
          sgst: Math.round(val.sgst),
          igst: Math.round(val.igst),
        };
      });
  }, [salesReport]);

  const masterSummary = useMemo(
    () => ({
      categories: categories.length,
      quotations: allQuotations.length,
      customers: customers.length,
      totalProjects: salesReport?.summary?.totalProjects || 0,
    }),
    [categories, allQuotations, customers, salesReport],
  );

  // ============ EXPORT HANDLERS ============

  const handleExportSales = useCallback(() => {
    if (!salesReport?.projects?.length) {
      toast.error("No data to export");
      return;
    }
    const exportData = salesReport.projects.map((p) => ({
      "Project No": p.projectNo,
      Date: formatDate(p.date),
      Customer: p.customer?.name || "-",
      City: p.customer?.city || "-",
      State: p.customer?.state || "-",
      Status: p.status,
      Subtotal: p.subtotal,
      Discount: p.totalDiscount,
      CGST: p.cgst,
      SGST: p.sgst,
      IGST: p.igst,
      "Grand Total": p.grandTotal,
      "Grand Total (GST)": p.grandTotalWithGst,
    }));
    generateCSV(exportData, "sales_report");
    toast.success("Sales report exported successfully");
  }, [salesReport]);

  const handleExportCustomers = useCallback(() => {
    if (!customerReport?.length) {
      toast.error("No data to export");
      return;
    }
    const exportData = customerReport.map((c) => ({
      Customer: c.customer?.name || "-",
      City: c.customer?.city || "-",
      State: c.customer?.state || "-",
      Mobile: c.customer?.mobile || "-",
      Email: c.customer?.email || "-",
      "Total Projects": c.totalProjects,
      "Total Value": c.totalValue,
    }));
    generateCSV(exportData, "customer_report");
    toast.success("Customer report exported successfully");
  }, [customerReport]);

  const handleExportQuotations = useCallback(() => {
    if (!quotationReport?.length) {
      toast.error("No data to export");
      return;
    }
    const exportData = quotationReport.map((q) => ({
      "Quotation ID": q.quotationId,
      "Quotation Name": q.quotationName,
      "Times Used": q.timesUsed,
      "Total Quantity": q.totalQuantity,
      "Total Revenue": q.totalRevenue,
    }));
    generateCSV(exportData, "quotation_usage_report");
    toast.success("Quotation report exported successfully");
  }, [quotationReport]);

  const handleExportQuotationMaster = useCallback(() => {
    if (!allQuotations.length) {
      toast.error("No data to export");
      return;
    }
    const exportData = allQuotations.map((q) => ({
      "Part Code": q.partCode,
      Name: q.name,
      Category:
        q.category?.name ||
        categories.find((c) => c.id === q.categoryId)?.name ||
        "-",
      Type: q.quotationType?.name || "-",
      Model: q.quotationModel?.name || "-",
      "Base Price": q.basePrice,
      "GST %": q.gstPercent,
      "Default Discount": q.defaultDiscount,
      Status: q.status,
    }));
    generateCSV(exportData, "quotation_master_report");
    toast.success("Quotation master exported successfully");
  }, [allQuotations, categories]);

  const handleExportAll = useCallback(() => {
    handleExportSales();
    handleExportCustomers();
    handleExportQuotations();
    handleExportQuotationMaster();
  }, [
    handleExportSales,
    handleExportCustomers,
    handleExportQuotations,
    handleExportQuotationMaster,
  ]);

  const handleRefresh = useCallback(() => {
    const filters: any = {};
    if (customStartDate && customEndDate) {
      filters.startDate = customStartDate;
      filters.endDate = customEndDate;
    } else {
      filters.dateRange = dateRange;
    }
    if (statusFilter !== "all") filters.status = statusFilter;

    fetchAllReports(filters);
    fetchAllQuotations().then((data) => setAllQuotations(data || []));
    toast.success("Reports refreshed");
  }, [
    dateRange,
    statusFilter,
    customStartDate,
    customEndDate,
    fetchAllReports,
    fetchAllQuotations,
  ]);

  // ============ LOADING STATE ============
  if (!initialLoaded && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">MIS Reports</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics and business intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportAll}
            disabled={loading}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export All</span>
          </Button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="stat-card">
          <FileText className="h-5 w-5 text-accent" />
          <p className="stat-value">
            {formatNumber(financialSummary.totalProjects)}
          </p>
          <p className="stat-label">Total Projects</p>
        </div>
        <div className="stat-card">
          <TrendingUp className="h-5 w-5 text-success" />
          <p className="stat-value text-xl md:text-3xl">
            {formatCurrency(financialSummary.totalValue)}
          </p>
          <p className="stat-label">Total Value</p>
        </div>
        <div className="stat-card">
          <Users className="h-5 w-5 text-primary" />
          <p className="stat-value">{formatNumber(masterSummary.customers)}</p>
          <p className="stat-label">Total Customers</p>
        </div>
        <div className="stat-card">
          <Package className="h-5 w-5 text-warning" />
          <p className="stat-value">{formatNumber(masterSummary.quotations)}</p>
          <p className="stat-label">Active Quotations</p>
        </div>
      </div>

      {/* GLOBAL FILTERS */}
      <div className="enterprise-card p-4 mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filters:
          </span>

          <Select
            value={dateRange}
            onValueChange={(v: any) => {
              setDateRange(v);
              setCustomStartDate("");
              setCustomEndDate("");
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-36 text-sm"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-36 text-sm"
            />
          </div>

          {(customStartDate || customEndDate || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCustomStartDate("");
                setCustomEndDate("");
                setStatusFilter("all");
                setDateRange("monthly");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* TABS */}
      <Tabs
        defaultValue="quotations"
        className="space-y-6 mt-4"
        onValueChange={setActiveTab}
      >
        <div className="overflow-x-auto">
          <TabsList className="inline-flex">
            <TabsTrigger value="masters">Masters</TabsTrigger>
            <TabsTrigger value="quotations">Sales / Projects</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Quotations</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
        </div>

        {/* ======== MASTER REPORTS ======== */}
        <TabsContent value="masters" className="space-y-6">
          <h2 className="text-lg font-semibold">Master Reports</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Summary Overview
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Categories", value: masterSummary.categories },
                  { label: "Quotations", value: masterSummary.quotations },
                  { label: "Customers", value: masterSummary.customers },
                  {
                    label: "Total Projects",
                    value: masterSummary.totalProjects,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 bg-muted/50 rounded-lg text-center"
                  >
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Quotations by Category
              </h3>
              {categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryDistribution}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="quotations"
                      fill="#A16207"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  No category data available
                </div>
              )}
            </div>
          </div>

          {/* Quotation Master Table */}
          <div className="enterprise-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Quotation Master ({allQuotations.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportQuotationMaster}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Part Code</th>
                    <th>Name</th>
                    <th className="hidden sm:table-cell">Category</th>
                    <th className="hidden md:table-cell">Base Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allQuotations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        No quotations found
                      </td>
                    </tr>
                  ) : (
                    allQuotations.slice(0, 20).map((q) => (
                      <tr key={q.id}>
                        <td className="font-mono text-xs">{q.partCode}</td>
                        <td className="font-medium max-w-[150px] truncate">
                          {q.name}
                        </td>
                        <td className="hidden sm:table-cell text-muted-foreground">
                          {q.category?.name ||
                            categories.find((c) => c.id === q.categoryId)
                              ?.name ||
                            "-"}
                        </td>
                        <td className="hidden md:table-cell">
                          {formatCurrency(Number(q.basePrice) || 0)}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(q.status)}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Access Report */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">
              User Access Report
            </h3>
            <div className="table-container">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Add Customer</th>
                    <th>Create Project</th>
                    <th className="hidden sm:table-cell">Edit Masters</th>
                    <th className="hidden md:table-cell">Approve OTP</th>
                    <th className="hidden lg:table-cell">View Reports</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      role: "Data Entry",
                      perms: [true, true, false, false, false],
                    },
                    {
                      role: "Creator",
                      perms: [true, true, false, false, false],
                    },
                    { role: "Master", perms: [true, true, true, false, false] },
                    { role: "Admin", perms: [true, true, true, true, true] },
                  ].map((r) => (
                    <tr key={r.role}>
                      <td className="font-medium">{r.role}</td>
                      {r.perms.map((p, i) => (
                        <td
                          key={i}
                          className={`${i >= 2 ? (i === 2 ? "hidden sm:table-cell" : i === 3 ? "hidden md:table-cell" : "hidden lg:table-cell") : ""} ${p ? "text-success" : "text-destructive"}`}
                        >
                          {p ? "✓" : "✗"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ======== SALES / PROJECTS ======== */}
        <TabsContent value="quotations" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold">
              Sales / Project Reports
              {reportsLoading && (
                <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSales}
              disabled={!salesReport?.projects?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {salesReport?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Projects",
                  value: salesReport.summary.totalProjects,
                  format: false,
                },
                {
                  label: "Total Value",
                  value: salesReport.summary.totalValue,
                  format: true,
                },
                {
                  label: "Total Discount",
                  value: salesReport.summary.totalDiscount,
                  format: true,
                },
                {
                  label: "Avg Order Value",
                  value: salesReport.summary.avgOrderValue,
                  format: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 bg-muted/50 rounded-lg text-center border border-border"
                >
                  <p className="text-xl font-bold">
                    {item.format ? formatCurrency(item.value) : item.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Project Value Summary ({dateRange})
              </h3>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#A16207"
                      radius={[6, 6, 0, 0]}
                      name="Value"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  {reportsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (
                    "No data available for selected period"
                  )}
                </div>
              )}
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Status-wise Distribution
              </h3>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Projects Table */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Project Details ({salesReport?.projects?.length || 0} records)
            </h3>
            <div className="table-container max-h-96">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Project No</th>
                    <th className="hidden sm:table-cell">Customer</th>
                    <th className="hidden md:table-cell">Date</th>
                    <th>Status</th>
                    <th>Discount</th>
                    <th>Value (GST)</th>
                  </tr>
                </thead>
                <tbody>
                  {!salesReport?.projects?.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        {reportsLoading
                          ? "Loading..."
                          : "No projects found for selected filters"}
                      </td>
                    </tr>
                  ) : (
                    salesReport.projects.map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.projectNo}</td>
                        <td className="hidden sm:table-cell">
                          {p.customer?.name || "-"}
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {formatDate(p.date)}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(p.status)}>
                            {p.status}
                          </span>
                        </td>
                        <td className="text-muted-foreground">
                          {Number(p.totalDiscount) > 0
                            ? formatCurrency(Number(p.totalDiscount))
                            : "-"}
                        </td>
                        <td className="font-semibold">
                          {formatCurrency(Number(p.grandTotalWithGst))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {expiredProjects.length > 0 && (
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Expired Projects ({expiredProjects.length})
              </h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Project No</th>
                      <th className="hidden sm:table-cell">Customer</th>
                      <th className="hidden md:table-cell">Date</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredProjects.map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.projectNo}</td>
                        <td className="hidden sm:table-cell">
                          {p.customer?.name || "-"}
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {formatDate(p.date)}
                        </td>
                        <td>{formatCurrency(Number(p.grandTotalWithGst))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ======== CUSTOMER REPORTS ======== */}
        <TabsContent value="customers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Customer Reports
              {reportsLoading && (
                <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCustomers}
              disabled={!customerReport?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Region-wise Distribution
              </h3>
              {regionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis
                      dataKey="region"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#111827" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  No regional data available
                </div>
              )}
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Top Customers by Value
              </h3>
              {topCustomers.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topCustomers.slice(0, 5).map((c) => ({
                        name: c.customer?.name || "Unknown",
                        value: Number(c.totalValue) || 0,
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {topCustomers.slice(0, 5).map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatCurrency(v)}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-16">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Top 10 Table */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Top 10 Customers by Value
            </h3>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th className="hidden sm:table-cell">City</th>
                    <th className="hidden md:table-cell">State</th>
                    <th>Projects</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        {reportsLoading ? "Loading..." : "No data available"}
                      </td>
                    </tr>
                  ) : (
                    topCustomers.map((c, index) => (
                      <tr key={c.customerId}>
                        <td className="font-medium">{index + 1}</td>
                        <td className="font-medium">
                          {c.customer?.name || "-"}
                        </td>
                        <td className="hidden sm:table-cell text-muted-foreground">
                          {c.customer?.city || "-"}
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {c.customer?.state || "-"}
                        </td>
                        <td>{c.totalProjects}</td>
                        <td className="font-semibold text-accent">
                          {formatCurrency(Number(c.totalValue))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Customer List */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Customer-wise Summary ({customerReport.length})
            </h3>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden sm:table-cell">Mobile</th>
                    <th className="hidden md:table-cell">Email</th>
                    <th className="hidden lg:table-cell">City</th>
                    <th>Projects</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {customerReport.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        {reportsLoading ? "Loading..." : "No data found"}
                      </td>
                    </tr>
                  ) : (
                    customerReport.map((c) => (
                      <tr key={c.customerId}>
                        <td className="font-medium">
                          {c.customer?.name || "-"}
                        </td>
                        <td className="hidden sm:table-cell text-muted-foreground">
                          {c.customer?.mobile || "-"}
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {c.customer?.email || "-"}
                        </td>
                        <td className="hidden lg:table-cell text-muted-foreground">
                          {c.customer?.city || "-"}
                        </td>
                        <td>{c.totalProjects}</td>
                        <td className="font-semibold">
                          {formatCurrency(Number(c.totalValue))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ======== QUOTATION REPORTS ======== */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Quotation Reports
              {reportsLoading && (
                <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportQuotations}
              disabled={!quotationReport?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Quotations by Category
            </h3>
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryDistribution}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="quotations"
                    fill="#A16207"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                No data available
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Quotation-wise Revenue
              </h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Quotation</th>
                      <th className="hidden sm:table-cell">Name</th>
                      <th>Used</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotationFrequency.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          {reportsLoading ? "Loading..." : "No data available"}
                        </td>
                      </tr>
                    ) : (
                      quotationFrequency.map((q, index) => (
                        <tr key={index}>
                          <td className="font-mono text-xs">
                            {q.quotationId?.substring(0, 8)}...
                          </td>
                          <td className="hidden sm:table-cell font-medium max-w-[120px] truncate">
                            {q.quotationName}
                          </td>
                          <td>
                            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs font-medium">
                              {q.timesUsed}x
                            </span>
                          </td>
                          <td className="font-semibold text-accent">
                            {formatCurrency(Number(q.totalRevenue))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">
                High Value Quotations
              </h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Part Code</th>
                      <th className="hidden sm:table-cell">Name</th>
                      <th>Base Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highValueQuotations.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center text-muted-foreground py-8"
                        >
                          No quotations found
                        </td>
                      </tr>
                    ) : (
                      highValueQuotations.map((q) => (
                        <tr key={q.id}>
                          <td className="font-mono text-xs">{q.partCode}</td>
                          <td className="hidden sm:table-cell font-medium max-w-[120px] truncate">
                            {q.name}
                          </td>
                          <td className="font-semibold text-accent">
                            {formatCurrency(Number(q.basePrice) || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Full Quotation Master */}
          <div className="enterprise-card p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Quotation Master ({allQuotations.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportQuotationMaster}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Part Code</th>
                    <th>Name</th>
                    <th className="hidden sm:table-cell">Category</th>
                    <th className="hidden md:table-cell">Type</th>
                    <th>Price</th>
                    <th className="hidden lg:table-cell">GST</th>
                  </tr>
                </thead>
                <tbody>
                  {allQuotations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-muted-foreground py-8"
                      >
                        No quotations found
                      </td>
                    </tr>
                  ) : (
                    allQuotations.map((q) => (
                      <tr key={q.id}>
                        <td className="font-mono text-xs">{q.partCode}</td>
                        <td className="font-medium max-w-[150px] truncate">
                          {q.name}
                        </td>
                        <td className="hidden sm:table-cell text-muted-foreground">
                          {q.category?.name ||
                            categories.find((c) => c.id === q.categoryId)
                              ?.name ||
                            "-"}
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {q.quotationType?.name || "-"}
                        </td>
                        <td>{formatCurrency(Number(q.basePrice) || 0)}</td>
                        <td className="hidden lg:table-cell">
                          {q.gstPercent || 18}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ======== FINANCIAL REPORTS ======== */}
        <TabsContent value="financial" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Financial Reports
              {reportsLoading && (
                <Loader2 className="inline h-4 w-4 animate-spin ml-2" />
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSales}
              disabled={!salesReport?.projects?.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* GST Summary - using ACTUAL fields */}
          {/* <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-6">
              GST Summary Report
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 md:gap-6 mb-6">
              {[
                { label: "Total CGST", value: financialSummary.totalCgst },
                { label: "Total SGST", value: financialSummary.totalSgst },
                { label: "Total IGST", value: financialSummary.totalIgst },
                {
                  label: "Total GST",
                  value:
                    financialSummary.totalCgst +
                    financialSummary.totalSgst +
                    financialSummary.totalIgst,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-5 bg-muted/50 rounded-xl text-center border border-border"
                >
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {formatCurrency(item.value)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            {gstMonthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={gstMonthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cgst"
                    stackId="1"
                    stroke="#166534"
                    fill="#166534"
                    fillOpacity={0.6}
                    name="CGST"
                  />
                  <Area
                    type="monotone"
                    dataKey="sgst"
                    stackId="1"
                    stroke="#A16207"
                    fill="#A16207"
                    fillOpacity={0.6}
                    name="SGST"
                  />
                  <Area
                    type="monotone"
                    dataKey="igst"
                    stackId="1"
                    stroke="#0891B2"
                    fill="#0891B2"
                    fillOpacity={0.6}
                    name="IGST"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                No GST data available
              </div>
            )}
          </div> */}

          {/* Discount Summary */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-6">
              Discount Summary Report
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
              {[
                {
                  label: "Total Discount",
                  value: formatCurrency(financialSummary.totalDiscount),
                },
                {
                  label: "Avg Discount Rate",
                  value: `${financialSummary.discountRate.toFixed(1)}%`,
                },
                {
                  label: "Avg Order Value",
                  value: formatCurrency(financialSummary.avgOrderValue),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-5 bg-muted/50 rounded-xl text-center border border-border"
                >
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    {item.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <h4 className="font-medium text-foreground mb-3">
              Projects with Discounts
            </h4>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Project No</th>
                    <th className="hidden sm:table-cell">Customer</th>
                    <th className="hidden md:table-cell">Date</th>
                    <th>Discount</th>
                    <th>Final Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const discounted =
                      salesReport?.projects?.filter(
                        (p) => Number(p.totalDiscount) > 0,
                      ) || [];
                    if (!salesReport?.projects?.length) {
                      return (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            {reportsLoading
                              ? "Loading..."
                              : "No data available"}
                          </td>
                        </tr>
                      );
                    }
                    if (discounted.length === 0) {
                      return (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            No projects with discounts found
                          </td>
                        </tr>
                      );
                    }
                    return discounted.slice(0, 15).map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium">{p.projectNo}</td>
                        <td className="hidden sm:table-cell">
                          {p.customer?.name || "-"}
                        </td>
                        <td className="hidden md:table-cell text-muted-foreground">
                          {formatDate(p.date)}
                        </td>
                        <td className="text-destructive font-medium">
                          -{formatCurrency(Number(p.totalDiscount))}
                        </td>
                        <td className="font-semibold">
                          {formatCurrency(Number(p.grandTotalWithGst))}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Revenue Trend
            </h3>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#A16207"
                    strokeWidth={3}
                    dot={{ fill: "#A16207", r: 5 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-16">
                No revenue data available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
