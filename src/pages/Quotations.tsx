import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, FileText, Download, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Quotations: React.FC = () => {
  const { hasPermission } = useAuth();
  const { quotations, customers, deleteQuotation, addQuotation } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredQuotations = quotations.filter(quotation => {
    const customer = customers.find(c => c.id === quotation.customerId);
    const matchesSearch = (
      quotation.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      deleteQuotation(id);
      toast.success('Quotation deleted successfully');
    }
  };

  const handleDuplicate = (quotation: typeof quotations[0]) => {
    const duplicatedQuotation = addQuotation({
      date: new Date(),
      customerId: quotation.customerId,
      salesManager: quotation.salesManager,
      items: quotation.items.map(item => ({ ...item, id: Date.now().toString() + Math.random() })),
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      igst: quotation.igst,
      cgst: quotation.cgst,
      sgst: quotation.sgst,
      grandTotal: quotation.grandTotal,
      grandTotalWithGst: quotation.grandTotalWithGst,
      status: 'draft',
    });
    toast.success(`Quotation duplicated as ${duplicatedQuotation.quotationNo}`);
    navigate(`/quotations/edit/${duplicatedQuotation.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'sent':
        return 'badge-warning';
      case 'expired':
        return 'badge-error';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all quotations
          </p>
        </div>
        {hasPermission('create_quotation') && (
          <Link to="/quotations/new">
            <Button className="btn-accent gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Quotation</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="enterprise-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by quotation number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Quotation No</th>
                <th className="hidden sm:table-cell">Customer</th>
                <th className="hidden md:table-cell">Date</th>
                <th className="hidden lg:table-cell">Items</th>
                <th>Total Value</th>
                <th className="hidden sm:table-cell">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-12">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {searchTerm ? 'No quotations found matching your search.' : 'No quotations yet. Create your first quotation.'}
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quotation) => {
                  const customer = customers.find(c => c.id === quotation.customerId);
                  return (
                    <tr key={quotation.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="font-medium">{quotation.quotationNo}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <div>
                          <p className="font-medium">{customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{customer?.mobile}</p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell text-muted-foreground">{formatDate(quotation.date)}</td>
                      <td className="hidden lg:table-cell">
                        <span className="bg-muted px-2 py-1 rounded text-xs font-medium">{quotation.items.length} items</span>
                      </td>
                      <td className="font-semibold">{formatCurrency(quotation.grandTotalWithGst)}</td>
                      <td className="hidden sm:table-cell">
                        <span className={getStatusBadge(quotation.status)}>
                          {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                        </span>
                      </td>
                        <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/quotations/${quotation.id}`)}
                            className="action-btn"
                            title="View"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => navigate(`/quotations/${quotation.id}/pdf`)}
                            className="action-btn"
                            title="Generate PDF"
                          >
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </button>
                          {hasPermission('create_quotation') && (
                            <button
                              onClick={() => handleDuplicate(quotation)}
                              className="action-btn"
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                          {hasPermission('edit_quotation') && (
                            <button
                              onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                              className="action-btn"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}
                          {hasPermission('create_quotation') && (
                            <button
                              onClick={() => handleDelete(quotation.id)}
                              className="action-btn action-btn-danger"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
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
    </div>
  );
};

export default Quotations;
