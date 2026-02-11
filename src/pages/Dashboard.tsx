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
  Clock,
  LayoutDashboard,
  Package,
  Database,
  Shield,
  Mail,
  UserCog,
  BarChart3,
  FilePlus,
  UserPlus,
  Eye,
  Edit,
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

  // All navigation items with permission checks
  const allNavigationItems = [
    {
      category: 'Main',
      items: [
        {
          label: 'Quotations',
          description: 'View and manage all quotations',
          icon: FileText,
          path: '/quotations',
          show: true,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        },
        {
          label: 'Customers',
          description: 'Manage customer database',
          icon: Users,
          path: '/customers',
          show: true,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
        },
        {
          label: 'Products',
          description: 'Browse product catalog',
          icon: Package,
          path: '/products',
          show: true,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        },
      ],
    },
    {
      category: 'Create',
      items: [
        {
          label: 'New Quotation',
          description: 'Create a new quotation',
          icon: FilePlus,
          path: '/quotations/new',
          show: hasPermission('create_quotation'),
          color: 'text-accent',
          bgColor: 'bg-accent/10',
        },
        {
          label: 'Add Customer',
          description: 'Register a new customer',
          icon: UserPlus,
          path: '/customers/new',
          show: hasPermission('add_customer'),
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        },
      ],
    },
    {
      category: 'Administration',
      items: [
        {
          label: 'Masters',
          description: 'Manage master data & products',
          icon: Database,
          path: '/masters',
          show: hasPermission('edit_masters') || user?.role === 'admin',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        },
        {
          label: 'Approvals',
          description: 'Review OTP & discount approvals',
          icon: Shield,
          path: '/approvals',
          show: user?.role === 'admin',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
        },
        {
          label: 'User Management',
          description: 'Manage users and roles',
          icon: UserCog,
          path: '/users',
          show: user?.role === 'admin',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
        },
        {
          label: 'Email Logs',
          description: 'View sent email history',
          icon: Mail,
          path: '/email-logs',
          show: user?.role === 'admin',
          color: 'text-pink-600',
          bgColor: 'bg-pink-50 dark:bg-pink-950/30',
        },
        {
          label: 'MIS Reports',
          description: 'Analytics and insights',
          icon: BarChart3,
          path: '/reports',
          show: hasPermission('view_reports') || user?.role === 'admin',
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
        },
      ],
    },
  ];

  // Filter categories that have visible items
  const visibleCategories = allNavigationItems
    .map(category => ({
      ...category,
      items: category.items.filter(item => item.show),
    }))
    .filter(category => category.items.length > 0);

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
        <Link to="/quotations" className="stat-card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="stat-value">{totalQuotations}</p>
          <p className="stat-label">Total Projects</p>
        </Link>

        <Link to="/quotations" className="stat-card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-accent/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <p className="stat-value text-2xl lg:text-3xl">{formatCurrency(totalValue)}</p>
          <p className="stat-label">Total Quotation Value</p>
        </Link>

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
          {user?.role === 'admin' && pendingOtpApprovals > 0 && (
            <Link to="/approvals" className="text-xs text-accent hover:underline mt-1 inline-block">
              Review now →
            </Link>
          )}
        </div>

        <Link to="/customers" className="stat-card hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-success/10 rounded-lg">
              <Users className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="stat-value">{activeCustomers}</p>
          <p className="stat-label">Active Customers</p>
        </Link>
      </div>

      {/* Navigation Grid - All Pages Permission Based */}
      <div className="space-y-6">
        {visibleCategories.map((category) => (
          <div key={category.category}>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {category.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="enterprise-card p-4 hover:shadow-md hover:border-accent/30 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg ${item.bgColor} group-hover:scale-110 transition-transform`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Quotations */}
        <div className="xl:col-span-2 enterprise-card overflow-hidden">
          <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Projects</h2>
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
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {recentQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-12">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No quotations yet.</p>
                      {hasPermission('create_quotation') && (
                        <Link to="/quotations/new">
                          <Button variant="outline" size="sm" className="mt-3 gap-2">
                            <Plus className="h-4 w-4" />
                            Create First Quotation
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  recentQuotations.map((quotation) => {
                    const customer = customers.find(c => c.id === quotation.customerId);
                    return (
                      <tr key={quotation.id} className="group">
                        <td className="font-medium">
                          <Link to={`/quotations/${quotation.id}`} className="hover:text-accent transition-colors">
                            {quotation.quotationNo}
                          </Link>
                        </td>
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
                        <td>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              to={`/quotations/${quotation.id}`}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Link>
                            {hasPermission('create_quotation') && (
                              <Link
                                to={`/quotations/edit/${quotation.id}`}
                                className="p-1 rounded hover:bg-muted transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Link>
                            )}
                          </div>
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
          {/* <div className="enterprise-card p-5">
            <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {hasPermission('create_quotation') && (
                <Link to="/quotations/new" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <FilePlus className="h-4 w-4 text-accent" />
                    Create Quotation
                  </Button>
                </Link>
              )}
              {hasPermission('add_customer') && (
                <Link to="/customers/new" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <UserPlus className="h-4 w-4 text-emerald-600" />
                    Add Customer
                  </Button>
                </Link>
              )}
              {(hasPermission('edit_masters') || user?.role === 'admin') && (
                <Link to="/masters" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <Database className="h-4 w-4 text-orange-600" />
                    Manage Masters
                  </Button>
                </Link>
              )}
              <Link to="/products" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <Package className="h-4 w-4 text-purple-600" />
                  View Products
                </Button>
              </Link>
              {(hasPermission('view_reports') || user?.role === 'admin') && (
                <Link to="/reports" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 h-11">
                    <BarChart3 className="h-4 w-4 text-cyan-600" />
                    View Reports
                  </Button>
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link to="/users" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 h-11">
                      <UserCog className="h-4 w-4 text-indigo-600" />
                      Manage Users
                    </Button>
                  </Link>
                  <Link to="/email-logs" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 h-11">
                      <Mail className="h-4 w-4 text-pink-600" />
                      Email Logs
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div> */}

          {/* Pending Approvals */}
          {/* {user?.role === 'admin' && pendingOtpApprovals > 0 && (
            <div className="enterprise-card p-5 border-l-4 border-l-warning">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                Pending Approvals
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                You have {pendingOtpApprovals} pending OTP approval{pendingOtpApprovals > 1 ? 's' : ''}.
              </p>
              <Link to="/approvals">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Shield className="h-4 w-4" />
                  Review Approvals
                </Button>
              </Link>
            </div>
          )} */}

          {/* System Info */}
          <div className="enterprise-card p-5">
            <h2 className="font-semibold text-foreground mb-4">Your Access</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium capitalize bg-muted px-2.5 py-1 rounded-md">{user?.role.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Create Projects</span>
                <span className={`text-sm font-medium ${hasPermission('create_quotation') ? 'text-success' : 'text-destructive'}`}>
                  {hasPermission('create_quotation') ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Add Customers</span>
                <span className={`text-sm font-medium ${hasPermission('add_customer') ? 'text-success' : 'text-destructive'}`}>
                  {hasPermission('add_customer') ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Edit Masters</span>
                <span className={`text-sm font-medium ${hasPermission('edit_masters') ? 'text-success' : 'text-destructive'}`}>
                  {hasPermission('edit_masters') ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">View Reports</span>
                <span className={`text-sm font-medium ${hasPermission('view_reports') || user?.role === 'admin' ? 'text-success' : 'text-destructive'}`}>
                  {hasPermission('view_reports') || user?.role === 'admin' ? 'Yes' : 'No'}
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