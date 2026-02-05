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
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </Link>
          )}
          {hasPermission('create_quotation') && (
            <Link to="/quotations/new">
              <Button className="btn-accent" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Quotation
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="stat-value">{totalQuotations}</p>
          <p className="stat-label">Total Quotations</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-accent/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="stat-value">{formatCurrency(totalValue)}</p>
          <p className="stat-label">Total Quotation Value</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            {pendingOtpApprovals > 0 && (
              <span className="badge-warning">{pendingOtpApprovals} pending</span>
            )}
          </div>
          <p className="stat-value">{pendingOtpApprovals}</p>
          <p className="stat-label">Pending OTP Approvals</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-success/10 rounded-lg">
              <Users className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="stat-value">{activeCustomers}</p>
          <p className="stat-label">Active Customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Quotations */}
        <div className="lg:col-span-2 enterprise-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Quotations</h2>
            <Link to="/quotations" className="text-sm text-accent hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-8">
                      No quotations yet. Create your first quotation.
                    </td>
                  </tr>
                ) : (
                  recentQuotations.map((quotation) => {
                    const customer = customers.find(c => c.id === quotation.customerId);
                    return (
                      <tr key={quotation.id}>
                        <td className="font-medium">{quotation.quotationNo}</td>
                        <td>{customer?.name || 'Unknown'}</td>
                        <td>{formatDate(quotation.date)}</td>
                        <td>{formatCurrency(quotation.grandTotalWithGst)}</td>
                        <td>
                          <span className={
                            quotation.status === 'approved' ? 'badge-success' :
                            quotation.status === 'sent' ? 'badge-warning' :
                            quotation.status === 'expired' ? 'badge-error' :
                            'bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs'
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
          <div className="enterprise-card p-4">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {hasPermission('create_quotation') && (
                <Link to="/quotations/new" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-3" />
                    Create Quotation
                  </Button>
                </Link>
              )}
              {hasPermission('add_customer') && (
                <Link to="/customers/new" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-3" />
                    Add Customer
                  </Button>
                </Link>
              )}
              {hasPermission('edit_masters') && (
                <Link to="/masters" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-3" />
                    Add Product
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Pending Approvals */}
          {hasPermission('approve_otp') && pendingOtpApprovals > 0 && (
            <div className="enterprise-card p-4 border-l-4 border-l-warning">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Pending Approvals
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                You have {pendingOtpApprovals} pending OTP approval{pendingOtpApprovals > 1 ? 's' : ''}.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Review Approvals
              </Button>
            </div>
          )}

          {/* System Info */}
          <div className="enterprise-card p-4">
            <h2 className="font-semibold text-foreground mb-3">Your Access</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{user?.role.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Can Create Quotations</span>
                <span className={hasPermission('create_quotation') ? 'text-success' : 'text-destructive'}>
                  {hasPermission('create_quotation') ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Can Edit Masters</span>
                <span className={hasPermission('edit_masters') ? 'text-success' : 'text-destructive'}>
                  {hasPermission('edit_masters') ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Can Approve OTP</span>
                <span className={hasPermission('approve_otp') ? 'text-success' : 'text-destructive'}>
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
