import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Users, TrendingUp, Download, Package, Calendar, IndianRupee, Percent, Filter, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Reports: React.FC = () => {
  const { quotations, customers, products, categories, productTypes, productModels, woods, polishes, fabrics, otpLogs } = useData();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  const COLORS = ['#111827', '#A16207', '#6B7280', '#166534', '#92400E', '#7C3AED', '#0891B2'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleExport = (reportName: string) => {
    toast.success(`Exporting ${reportName} - UI simulation only`);
  };

  // ============ QUOTATION DATA ============
  // Monthly quotation value
  const monthlyData = [
    { month: 'Jan', value: 850000, count: 12 },
    { month: 'Feb', value: 1640500, count: 18 },
    { month: 'Mar', value: 920000, count: 15 },
    { month: 'Apr', value: 1100000, count: 20 },
    { month: 'May', value: 780000, count: 10 },
    { month: 'Jun', value: 1450000, count: 22 },
  ];

  // Status distribution
  const statusData = [
    { name: 'Draft', value: quotations.filter(q => q.status === 'draft').length, color: '#6B7280' },
    { name: 'Sent', value: quotations.filter(q => q.status === 'sent').length, color: '#A16207' },
    { name: 'Approved', value: quotations.filter(q => q.status === 'approved').length, color: '#166534' },
    { name: 'Expired', value: quotations.filter(q => q.status === 'expired').length, color: '#DC2626' },
  ].filter(d => d.value > 0);

  // Expired quotations
  const expiredQuotations = quotations.filter(q => q.status === 'expired');

  // ============ CUSTOMER DATA ============
  // Region distribution
  const regionData = [
    { region: 'West', count: customers.filter(c => c.region === 'West').length },
    { region: 'North', count: customers.filter(c => c.region === 'North').length },
    { region: 'South', count: customers.filter(c => c.region === 'South').length },
    { region: 'East', count: customers.filter(c => c.region === 'East').length },
  ];

  // Top 10 customers by quotation value
  const customerQuotationValues = customers.map(customer => {
    const customerQuotations = quotations.filter(q => q.customerId === customer.id);
    const totalValue = customerQuotations.reduce((sum, q) => sum + q.grandTotalWithGst, 0);
    return { ...customer, totalValue, quotationCount: customerQuotations.length };
  }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);

  // New vs repeat customers (simulated)
  const newVsRepeatData = [
    { name: 'New Customers', value: Math.ceil(customers.length * 0.6), color: '#166534' },
    { name: 'Repeat Customers', value: Math.floor(customers.length * 0.4), color: '#A16207' },
  ];

  // ============ PRODUCT DATA ============
  // Category distribution
  const categoryData = categories.map(cat => ({
    name: cat.name,
    products: products.filter(p => p.categoryId === cat.id).length,
  }));

  // Product quotation frequency
  const productFrequency = products.map(product => {
    const frequency = quotations.reduce((count, q) => {
      return count + q.items.filter(item => item.productId === product.id).length;
    }, 0);
    return { name: product.name.substring(0, 20), partCode: product.partCode, frequency, price: product.basePrice };
  }).sort((a, b) => b.frequency - a.frequency).slice(0, 10);

  // High value products
  const highValueProducts = [...products].sort((a, b) => b.basePrice - a.basePrice).slice(0, 10);

  // ============ FINANCIAL DATA ============
  const totalCgst = quotations.reduce((s, q) => s + q.cgst, 0);
  const totalSgst = quotations.reduce((s, q) => s + q.sgst, 0);
  const totalIgst = quotations.reduce((s, q) => s + q.igst, 0);
  const totalDiscount = quotations.reduce((s, q) => s + q.totalDiscount, 0);
  const totalValue = quotations.reduce((sum, q) => sum + q.grandTotalWithGst, 0);

  // Discount approval logs
  const discountLogs = otpLogs.filter(log => log.type === 'discount');

  // GST Monthly breakdown (simulated)
  const gstMonthlyData = [
    { month: 'Jan', cgst: 76500, sgst: 76500, igst: 0 },
    { month: 'Feb', cgst: 147645, sgst: 147645, igst: 0 },
    { month: 'Mar', cgst: 82800, sgst: 82800, igst: 0 },
    { month: 'Apr', cgst: 99000, sgst: 99000, igst: 0 },
    { month: 'May', cgst: 70200, sgst: 70200, igst: 0 },
    { month: 'Jun', cgst: 130500, sgst: 130500, igst: 0 },
  ];

  // ============ MASTER REPORTS ============
  const masterSummary = {
    categories: categories.length,
    productTypes: productTypes.length,
    productModels: productModels.length,
    woods: woods.length,
    polishes: polishes.length,
    fabrics: fabrics.length,
    products: products.length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">MIS Reports</h1>
          <p className="text-muted-foreground mt-1">Comprehensive analytics and business intelligence</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => handleExport('All Reports')}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export All</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="stat-card">
          <FileText className="h-5 w-5 text-accent" />
          <p className="stat-value">{quotations.length}</p>
          <p className="stat-label">Total Quotations</p>
        </div>
        <div className="stat-card">
          <TrendingUp className="h-5 w-5 text-success" />
          <p className="stat-value text-xl md:text-3xl">{formatCurrency(totalValue)}</p>
          <p className="stat-label">Total Value</p>
        </div>
        <div className="stat-card">
          <Users className="h-5 w-5 text-primary" />
          <p className="stat-value">{customers.length}</p>
          <p className="stat-label">Total Customers</p>
        </div>
        <div className="stat-card">
          <Package className="h-5 w-5 text-warning" />
          <p className="stat-value">{products.length}</p>
          <p className="stat-label">Active Products</p>
        </div>
      </div>

      <Tabs defaultValue="quotations" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex">
            <TabsTrigger value="masters">Masters</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
        </div>

        {/* =================== MASTER REPORTS =================== */}
        <TabsContent value="masters" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Master Reports</h2>
            <Button variant="outline" size="sm" onClick={() => handleExport('Master Reports')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>

          {/* Category Master Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Category Master Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{masterSummary.categories}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{masterSummary.productTypes}</p>
                  <p className="text-sm text-muted-foreground">Product Types</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{masterSummary.productModels}</p>
                  <p className="text-sm text-muted-foreground">Product Models</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{masterSummary.products}</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
              </div>
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Material Masters</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{masterSummary.woods}</p>
                  <p className="text-sm text-muted-foreground">Woods</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{masterSummary.polishes}</p>
                  <p className="text-sm text-muted-foreground">Polishes</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-2xl font-bold">{masterSummary.fabrics}</p>
                  <p className="text-sm text-muted-foreground">Fabrics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Master Report */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Product Master Report</h3>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Part Code</th>
                    <th>Product Name</th>
                    <th className="hidden sm:table-cell">Category</th>
                    <th className="hidden md:table-cell">Base Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 10).map(p => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.partCode}</td>
                      <td className="font-medium max-w-[150px] truncate">{p.name}</td>
                      <td className="hidden sm:table-cell text-muted-foreground">
                        {categories.find(c => c.id === p.categoryId)?.name || '-'}
                      </td>
                      <td className="hidden md:table-cell">{formatCurrency(p.basePrice)}</td>
                      <td>
                        <span className={p.status === 'active' ? 'badge-success' : 'badge-warning'}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Access Report */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">User Access Report</h3>
            <div className="table-container">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Add Customer</th>
                    <th>Create Quotation</th>
                    <th className="hidden sm:table-cell">Edit Masters</th>
                    <th className="hidden md:table-cell">Approve OTP</th>
                    <th className="hidden lg:table-cell">View Reports</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Data Entry</td>
                    <td className="text-success">✓</td>
                    <td className="text-success">✓</td>
                    <td className="hidden sm:table-cell text-destructive">✗</td>
                    <td className="hidden md:table-cell text-destructive">✗</td>
                    <td className="hidden lg:table-cell text-destructive">✗</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Creator</td>
                    <td className="text-success">✓</td>
                    <td className="text-success">✓</td>
                    <td className="hidden sm:table-cell text-destructive">✗</td>
                    <td className="hidden md:table-cell text-destructive">✗</td>
                    <td className="hidden lg:table-cell text-destructive">✗</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Master</td>
                    <td className="text-success">✓</td>
                    <td className="text-success">✓</td>
                    <td className="hidden sm:table-cell text-success">✓</td>
                    <td className="hidden md:table-cell text-destructive">✗</td>
                    <td className="hidden lg:table-cell text-destructive">✗</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Admin</td>
                    <td className="text-success">✓</td>
                    <td className="text-success">✓</td>
                    <td className="hidden sm:table-cell text-success">✓</td>
                    <td className="hidden md:table-cell text-success">✓</td>
                    <td className="hidden lg:table-cell text-success">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* =================== QUOTATION REPORTS =================== */}
        <TabsContent value="quotations" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold">Quotation Reports</h2>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
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
              <Button variant="outline" size="sm" onClick={() => handleExport('Quotation Reports')}>
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>

          {/* Quotation Value Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Quotation Value Summary ({dateRange})</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis tickFormatter={(v) => `₹${(v/100000).toFixed(0)}L`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    formatter={(v) => formatCurrency(Number(v))} 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#A16207" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Status-wise Quotation Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={statusData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expired Quotations Report */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Expired Quotations Report</h3>
            {expiredQuotations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No expired quotations found.
              </div>
            ) : (
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Quotation No</th>
                      <th className="hidden sm:table-cell">Customer</th>
                      <th className="hidden md:table-cell">Date</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredQuotations.map(q => {
                      const customer = customers.find(c => c.id === q.customerId);
                      return (
                        <tr key={q.id}>
                          <td className="font-medium">{q.quotationNo}</td>
                          <td className="hidden sm:table-cell">{customer?.name || '-'}</td>
                          <td className="hidden md:table-cell text-muted-foreground">
                            {new Date(q.date).toLocaleDateString('en-IN')}
                          </td>
                          <td>{formatCurrency(q.grandTotalWithGst)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* =================== CUSTOMER REPORTS =================== */}
        <TabsContent value="customers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Customer Reports</h2>
            <Button variant="outline" size="sm" onClick={() => handleExport('Customer Reports')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customers by Region */}
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Region/Location-wise Customer Report</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="region" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#111827" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* New vs Repeat Customers */}
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">New vs Repeat Customers</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={newVsRepeatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {newVsRepeatData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Master Report */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Customer Master Report</h3>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hidden sm:table-cell">Contact</th>
                    <th className="hidden md:table-cell">City</th>
                    <th>Region</th>
                    <th className="hidden lg:table-cell">GSTIN</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.name}</td>
                      <td className="hidden sm:table-cell text-muted-foreground">{c.mobile}</td>
                      <td className="hidden md:table-cell text-muted-foreground">{c.city}</td>
                      <td>
                        <span className="bg-muted px-2 py-0.5 rounded text-xs">{c.region}</span>
                      </td>
                      <td className="hidden lg:table-cell font-mono text-xs">{c.gstin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 10 Customers */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Top 10 Customers by Quotation Value</h3>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer</th>
                    <th className="hidden sm:table-cell">Quotations</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {customerQuotationValues.map((c, index) => (
                    <tr key={c.id}>
                      <td className="font-medium">{index + 1}</td>
                      <td className="font-medium">{c.name}</td>
                      <td className="hidden sm:table-cell">{c.quotationCount}</td>
                      <td className="font-semibold text-accent">{formatCurrency(c.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer-wise Quotation History */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Customer-wise Quotation History</h3>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Quotation No</th>
                    <th className="hidden sm:table-cell">Date</th>
                    <th className="hidden md:table-cell">Status</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.slice(0, 15).map(q => {
                    const customer = customers.find(c => c.id === q.customerId);
                    return (
                      <tr key={q.id}>
                        <td className="font-medium">{customer?.name || '-'}</td>
                        <td>{q.quotationNo}</td>
                        <td className="hidden sm:table-cell text-muted-foreground">
                          {new Date(q.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="hidden md:table-cell">
                          <span className={
                            q.status === 'approved' ? 'badge-success' : 
                            q.status === 'sent' ? 'badge-warning' : 
                            q.status === 'expired' ? 'badge-error' : 'badge-default'
                          }>
                            {q.status}
                          </span>
                        </td>
                        <td>{formatCurrency(q.grandTotalWithGst)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* =================== PRODUCT REPORTS =================== */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Product Reports</h2>
            <Button variant="outline" size="sm" onClick={() => handleExport('Product Reports')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>

          {/* Products by Category */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="products" fill="#A16207" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product-wise Quotation Frequency */}
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Product-wise Quotation Frequency</h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Part Code</th>
                      <th className="hidden sm:table-cell">Product</th>
                      <th>Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productFrequency.map((p, index) => (
                      <tr key={index}>
                        <td className="font-mono text-xs">{p.partCode}</td>
                        <td className="hidden sm:table-cell font-medium max-w-[120px] truncate">{p.name}</td>
                        <td>
                          <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs font-medium">
                            {p.frequency} times
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* High Value Products */}
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">High Value Products</h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Part Code</th>
                      <th className="hidden sm:table-cell">Product</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highValueProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs">{p.partCode}</td>
                        <td className="hidden sm:table-cell font-medium max-w-[120px] truncate">{p.name}</td>
                        <td className="font-semibold text-accent">{formatCurrency(p.basePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Product Master Report */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Product Master Report</h3>
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Part Code</th>
                    <th>Product Name</th>
                    <th className="hidden sm:table-cell">Category</th>
                    <th className="hidden md:table-cell">Type</th>
                    <th>Price</th>
                    <th className="hidden lg:table-cell">GST</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs">{p.partCode}</td>
                      <td className="font-medium max-w-[150px] truncate">{p.name}</td>
                      <td className="hidden sm:table-cell text-muted-foreground">
                        {categories.find(c => c.id === p.categoryId)?.name || '-'}
                      </td>
                      <td className="hidden md:table-cell text-muted-foreground">
                        {productTypes.find(pt => pt.id === p.productTypeId)?.name || '-'}
                      </td>
                      <td>{formatCurrency(p.basePrice)}</td>
                      <td className="hidden lg:table-cell">{p.gstPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* =================== FINANCIAL REPORTS =================== */}
        <TabsContent value="financial" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Financial Reports</h2>
            <Button variant="outline" size="sm" onClick={() => handleExport('Financial Reports')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>

          {/* GST Summary */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-6">GST Summary Report</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalCgst)}</p>
                <p className="text-sm text-muted-foreground mt-2">Total CGST (9%)</p>
              </div>
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalSgst)}</p>
                <p className="text-sm text-muted-foreground mt-2">Total SGST (9%)</p>
              </div>
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalIgst)}</p>
                <p className="text-sm text-muted-foreground mt-2">Total IGST</p>
              </div>
            </div>
            
            {/* GST Monthly Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={gstMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="cgst" stackId="1" stroke="#166534" fill="#166534" fillOpacity={0.6} name="CGST" />
                <Area type="monotone" dataKey="sgst" stackId="1" stroke="#A16207" fill="#A16207" fillOpacity={0.6} name="SGST" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Discount Summary Report */}
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-6">Discount Summary Report (OTP Based)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalDiscount)}</p>
                <p className="text-sm text-muted-foreground mt-2">Total Discount Given</p>
              </div>
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{discountLogs.length}</p>
                <p className="text-sm text-muted-foreground mt-2">OTP Discount Approvals</p>
              </div>
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {totalValue > 0 ? ((totalDiscount / (totalValue + totalDiscount)) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">Avg Discount Rate</p>
              </div>
            </div>

            {/* Discount Log Table */}
            <div className="table-container max-h-72">
              <table className="enterprise-table text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Requested By</th>
                    <th className="hidden sm:table-cell">Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {discountLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted-foreground py-8">
                        No OTP-based discount approvals recorded.
                      </td>
                    </tr>
                  ) : (
                    discountLogs.map(log => (
                      <tr key={log.id}>
                        <td className="text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="font-medium">{log.requestedBy}</td>
                        <td className="hidden sm:table-cell">
                          <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs">
                            Discount Override
                          </span>
                        </td>
                        <td>
                          <span className="badge-success">Approved</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
