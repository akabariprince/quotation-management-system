import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  DollarSign, 
  AlertCircle, 
  Users, 
  Plus,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { quotations, customers, otpLogs } = useData();

  // Calculate stats
  const totalQuotations = quotations.length;
  const totalValue = quotations.reduce((sum, q) => sum + q.grandTotalWithGst, 0);
  const pendingOtpApprovals = otpLogs.filter(log => log.status === 'pending').length;
  const activeCustomers = customers.length;

  // Recent quotations
  const recentQuotations = [...quotations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}
          </p>
        </div>
        <div className="flex gap-3">
          {hasPermission('add_customer') && (
            <Link to="/customers/new">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Customer</span>
              </Button>
            </Link>
          )}
          {hasPermission('create_quotation') && (
            <Link to="/quotations/new">
              <Button className="btn-accent gap-2" size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Quotation</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="stat-value">{totalQuotations}</p>
          <p className="stat-label">Total Quotations</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-accent/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="stat-value text-2xl lg:text-3xl">{formatCurrency(totalValue)}</p>
          <p className="stat-label">Total Quotation Value</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-warning/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            {pendingOtpApprovals > 0 && (
              <span className="badge-warning">{pendingOtpApprovals}</span>
            )}
          </div>
          <p className="stat-value">{pendingOtpApprovals}</p>
          <p className="stat-label">Pending OTP Approvals</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-success/10 rounded-lg">
              <Users className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="stat-value">{activeCustomers}</p>
          <p className="stat-label">Active Customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Quotations */}
        <div className="xl:col-span-2 enterprise-card overflow-hidden">
          <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Quotations</h2>
            <Link to="/quotations" className="text-sm text-accent hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th className="hidden sm:table-cell">Customer</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-12">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No quotations yet. Create your first quotation.
                    </td>
                  </tr>
                ) : (
                  recentQuotations.map((quotation) => {
                    const customer = customers.find(c => c.id === quotation.customerId);
                    return (
                      <tr key={quotation.id}>
                        <td className="font-medium">{quotation.quotationNo}</td>
                        <td className="hidden sm:table-cell">{customer?.name || 'Unknown'}</td>
                        <td className="hidden md:table-cell text-muted-foreground">{formatDate(quotation.date)}</td>
                        <td className="font-semibold">{formatCurrency(quotation.grandTotalWithGst)}</td>
                        <td>
                          <span className={
                            quotation.status === 'approved' ? 'badge-success' :
                            quotation.status === 'sent' ? 'badge-warning' :
                            quotation.status === 'expired' ? 'badge-error' :
                            'badge-default'
                          }>
                            {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="enterprise-card p-5">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {hasPermission('create_quotation') && (
                <Link to="/quotations/new" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Create Quotation
                  </Button>
                </Link>
              )}
              {hasPermission('add_customer') && (
                <Link to="/customers/new" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Add Customer
                  </Button>
                </Link>
              )}
              {hasPermission('edit_masters') && (
                <Link to="/masters" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    Add Product
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Pending Approvals */}
          {hasPermission('approve_otp') && pendingOtpApprovals > 0 && (
            <div className="enterprise-card p-5 border-l-4 border-l-warning">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Pending Approvals
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                You have {pendingOtpApprovals} pending OTP approval{pendingOtpApprovals > 1 ? 's' : ''}.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Review Approvals
              </Button>
            </div>
          )}

          {/* System Info */}
          <div className="enterprise-card p-5">
            <h2 className="font-semibold text-foreground mb-4">Your Access</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium capitalize bg-muted px-2.5 py-1 rounded-md">{user?.role.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Create Quotations</span>
                <span className={`text-sm font-medium ${hasPermission('create_quotation') ? 'text-success' : 'text-destructive'}`}>
                  {hasPermission('create_quotation') ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Edit Masters</span>
                <span className={`text-sm font-medium ${hasPermission('edit_masters') ? 'text-success' : 'text-destructive'}`}>
                  {hasPermission('edit_masters') ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Approve OTP</span>
                <span className={`text-sm font-medium ${hasPermission('approve_otp') ? 'text-success' : 'text-destructive'}`}>
                  {hasPermission('approve_otp') ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
