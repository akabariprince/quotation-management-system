import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useData } from '@/contexts/DataContext';
import { FileText, Users, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Reports: React.FC = () => {
  const { quotations, customers, products, categories } = useData();

  const COLORS = ['#111827', '#A16207', '#6B7280', '#166534', '#92400E'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Quotation value by month
  const monthlyData = [
    { month: 'Jan', value: 850000 },
    { month: 'Feb', value: 1640500 },
    { month: 'Mar', value: 0 },
  ];

  // Status distribution
  const statusData = [
    { name: 'Draft', value: quotations.filter(q => q.status === 'draft').length },
    { name: 'Sent', value: quotations.filter(q => q.status === 'sent').length },
    { name: 'Approved', value: quotations.filter(q => q.status === 'approved').length },
    { name: 'Expired', value: quotations.filter(q => q.status === 'expired').length },
  ].filter(d => d.value > 0);

  // Category distribution
  const categoryData = categories.map(cat => ({
    name: cat.name,
    products: products.filter(p => p.categoryId === cat.id).length,
  }));

  // Customer by region
  const regionData = [
    { region: 'West', count: customers.filter(c => c.region === 'West').length },
    { region: 'North', count: customers.filter(c => c.region === 'North').length },
    { region: 'South', count: customers.filter(c => c.region === 'South').length },
    { region: 'East', count: customers.filter(c => c.region === 'East').length },
  ];

  const totalValue = quotations.reduce((sum, q) => sum + q.grandTotalWithGst, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">MIS Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics and business intelligence</p>
        </div>
        <Button variant="outline" className="gap-2">
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
          <FileText className="h-5 w-5 text-warning" />
          <p className="stat-value">{products.length}</p>
          <p className="stat-label">Active Products</p>
        </div>
      </div>

      <Tabs defaultValue="quotations" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex">
            <TabsTrigger value="quotations">Quotation Reports</TabsTrigger>
            <TabsTrigger value="customers">Customer Reports</TabsTrigger>
            <TabsTrigger value="products">Product Reports</TabsTrigger>
            <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="quotations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Monthly Quotation Value</h3>
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
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#A16207" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Quotation Status Distribution</h3>
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
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Customers by Region</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="region" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="#111827" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="enterprise-card p-5 md:p-6">
              <h3 className="font-semibold text-foreground mb-4">Customer Master Report</h3>
              <div className="table-container max-h-72">
                <table className="enterprise-table text-sm">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th className="hidden sm:table-cell">City</th>
                      <th>Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td className="font-medium">{c.name}</td>
                        <td className="hidden sm:table-cell text-muted-foreground">{c.city}</td>
                        <td>
                          <span className="bg-muted px-2 py-0.5 rounded text-xs">{c.region}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-4">Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="products" fill="#A16207" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="enterprise-card p-5 md:p-6">
            <h3 className="font-semibold text-foreground mb-6">GST Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(quotations.reduce((s, q) => s + q.cgst, 0))}</p>
                <p className="text-sm text-muted-foreground mt-2">Total CGST</p>
              </div>
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(quotations.reduce((s, q) => s + q.sgst, 0))}</p>
                <p className="text-sm text-muted-foreground mt-2">Total SGST</p>
              </div>
              <div className="p-5 bg-muted/50 rounded-xl text-center border border-border">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(quotations.reduce((s, q) => s + q.igst, 0))}</p>
                <p className="text-sm text-muted-foreground mt-2">Total IGST</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
