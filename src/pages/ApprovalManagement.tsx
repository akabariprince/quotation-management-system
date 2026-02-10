import React, { useState } from 'react';
import { Check, X, Clock, FileText, Percent, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OTPModal from '@/components/common/OTPModal';
import { toast } from 'sonner';

const ApprovalManagement: React.FC = () => {
  const { user } = useAuth();
  const { 
    categories, productTypes, productModels, woods, polishes, fabrics, products,
    updateCategory, updateProductType, updateProductModel, updateWood, updatePolish, updateFabric, updateProduct,
    otpLogs, quotations, customers,
    addOTPLog,
  } = useData();

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{id: string; type: string; name: string} | null>(null);

  // Collect all pending masters
  const pendingMasters = [
    ...categories.filter(c => c.status === 'pending').map(c => ({ ...c, type: 'category', typeName: 'Category' })),
    ...productTypes.filter(pt => pt.status === 'pending').map(pt => ({ ...pt, type: 'productType', typeName: 'Product Type' })),
    ...productModels.filter(pm => pm.status === 'pending').map(pm => ({ ...pm, type: 'productModel', typeName: 'Product Model' })),
    ...woods.filter(w => w.status === 'pending').map(w => ({ ...w, type: 'wood', typeName: 'Wood' })),
    ...polishes.filter(p => p.status === 'pending').map(p => ({ ...p, type: 'polish', typeName: 'Polish' })),
    ...fabrics.filter(f => f.status === 'pending').map(f => ({ ...f, type: 'fabric', typeName: 'Fabric' })),
    ...products.filter(p => p.status === 'pending').map(p => ({ ...p, type: 'product', typeName: 'Product' })),
  ];

  // Get discount approval logs
  const discountLogs = otpLogs.filter(log => log.type === 'discount' && log.status === 'approved');

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = (item: any) => {
    setPendingApproval({ id: item.id, type: item.type, name: item.name });
    setShowOTPModal(true);
  };

  const handleOTPVerify = () => {
    if (!pendingApproval) return;

    switch (pendingApproval.type) {
      case 'category':
        updateCategory(pendingApproval.id, { status: 'active' });
        break;
      case 'productType':
        updateProductType(pendingApproval.id, { status: 'active' });
        break;
      case 'productModel':
        updateProductModel(pendingApproval.id, { status: 'active' });
        break;
      case 'wood':
        updateWood(pendingApproval.id, { status: 'active' });
        break;
      case 'polish':
        updatePolish(pendingApproval.id, { status: 'active' });
        break;
      case 'fabric':
        updateFabric(pendingApproval.id, { status: 'active' });
        break;
      case 'product':
        updateProduct(pendingApproval.id, { status: 'active' });
        break;
    }

    addOTPLog({
      type: 'master_activation',
      entityId: pendingApproval.id,
      entityType: pendingApproval.type,
      requestedBy: 'system',
      approvedBy: user?.email,
      otp: '123456',
      status: 'approved',
      approvedAt: new Date(),
    });

    toast.success(`${pendingApproval.name} approved and activated`);
    setShowOTPModal(false);
    setPendingApproval(null);
  };

  const handleReject = (item: any) => {
    if (!confirm(`Are you sure you want to reject "${item.name}"?`)) return;

    // In a real app, you might delete or mark as rejected
    switch (item.type) {
      case 'category':
        updateCategory(item.id, { status: 'pending' }); // Keep as pending for demo
        break;
      // Add other cases as needed
    }
    toast.success(`${item.name} rejected`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve pending masters and discount requests
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <Clock className="h-5 w-5 text-warning" />
          <p className="stat-value">{pendingMasters.length}</p>
          <p className="stat-label">Pending Approvals</p>
        </div>
        <div className="stat-card">
          <Check className="h-5 w-5 text-success" />
          <p className="stat-value">{otpLogs.filter(l => l.type === 'master_activation' && l.status === 'approved').length}</p>
          <p className="stat-label">Masters Approved</p>
        </div>
        <div className="stat-card">
          <Percent className="h-5 w-5 text-accent" />
          <p className="stat-value">{discountLogs.length}</p>
          <p className="stat-label">Discount Approvals</p>
        </div>
        <div className="stat-card">
          <Shield className="h-5 w-5 text-primary" />
          <p className="stat-value">{otpLogs.length}</p>
          <p className="stat-label">Total OTP Requests</p>
        </div>
      </div>

      <Tabs defaultValue="masters" className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="masters">
              Master Approval Queue
              {pendingMasters.length > 0 && (
                <span className="ml-2 bg-warning/20 text-warning px-2 py-0.5 rounded-full text-xs">
                  {pendingMasters.length}
                </span>
              )}
            </TabsTrigger>
            {/* <TabsTrigger value="discounts">Discount Approval Log</TabsTrigger> */}
          </TabsList>
        </div>

        {/* Master Approval Queue */}
        <TabsContent value="masters" className="space-y-4">
          <div className="enterprise-card overflow-hidden">
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Master Type</th>
                    <th>Name</th>
                    <th className="hidden sm:table-cell">Created At</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMasters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-12">
                        <Check className="h-8 w-8 mx-auto mb-2 text-success opacity-50" />
                        No pending approvals. All masters are up to date!
                      </td>
                    </tr>
                  ) : (
                    pendingMasters.map((item) => (
                      <tr key={`${item.type}-${item.id}`}>
                        <td>
                          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                            {item.typeName}
                          </span>
                        </td>
                        <td className="font-medium">{item.name}</td>
                        <td className="hidden sm:table-cell text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </td>
                        <td>
                          <span className="badge-warning">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-8 bg-success hover:bg-success/90 text-success-foreground"
                              onClick={() => handleApprove(item)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(item)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Discount Approval Log */}
        {/* <TabsContent value="discounts" className="space-y-4">
          <div className="enterprise-card overflow-hidden">
            <div className="table-container">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Quotation No</th>
                    <th className="hidden sm:table-cell">Customer</th>
                    <th>Requested By</th>
                    <th className="hidden md:table-cell">Approved By</th>
                    <th className="hidden lg:table-cell">Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {discountLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted-foreground py-12">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No discount approvals recorded yet.
                      </td>
                    </tr>
                  ) : (
                    discountLogs.map((log) => {
                      const quotation = quotations.find(q => q.items.some(item => item.id === log.entityId));
                      const customer = quotation ? customers.find(c => c.id === quotation.customerId) : null;
                      
                      return (
                        <tr key={log.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-accent" />
                              <span className="font-medium">{quotation?.quotationNo || '-'}</span>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell">{customer?.name || '-'}</td>
                          <td className="text-muted-foreground">{log.requestedBy}</td>
                          <td className="hidden md:table-cell text-muted-foreground">
                            {log.approvedBy || user?.email}
                          </td>
                          <td className="hidden lg:table-cell text-muted-foreground">
                            {log.approvedAt ? formatDate(log.approvedAt) : '-'}
                          </td>
                          <td>
                            <span className="badge-success">
                              <Check className="h-3 w-3" /> Approved
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
        </TabsContent>
      </Tabs> */}

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setPendingApproval(null);
        }}
        onVerify={handleOTPVerify}
        title={`Approve ${pendingApproval?.name || 'Master'}`}
        description="Enter OTP to approve and activate this master"
        type="master_activation"
      />
    </div>
  );
};

export default ApprovalManagement;
