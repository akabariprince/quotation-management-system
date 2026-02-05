import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, FileText, Send, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Quotations: React.FC = () => {
  const { hasPermission } = useAuth();
  const { quotations, customers, deleteQuotation } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuotations = quotations.filter(quotation => {
    const customer = customers.find(c => c.id === quotation.customerId);
    return (
      quotation.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'sent':
        return 'badge-warning';
      case 'expired':
        return 'badge-error';
      default:
        return 'bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-medium';
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
            <Button className="btn-accent">
              <Plus className="h-4 w-4 mr-2" />
              Create Quotation
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="enterprise-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by quotation number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="enterprise-card overflow-hidden">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Quotation No</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-8">
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
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{quotation.quotationNo}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{customer?.mobile}</p>
                      </div>
                    </td>
                    <td>{formatDate(quotation.date)}</td>
                    <td>{quotation.items.length} items</td>
                    <td className="font-semibold">{formatCurrency(quotation.grandTotalWithGst)}</td>
                    <td>
                      <span className={getStatusBadge(quotation.status)}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/quotations/${quotation.id}`)}
                          className="p-2 hover:bg-muted rounded-md transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => navigate(`/quotations/${quotation.id}/pdf`)}
                          className="p-2 hover:bg-muted rounded-md transition-colors"
                          title="Generate PDF"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {hasPermission('edit_quotation') && (
                          <button
                            onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                        {hasPermission('create_quotation') && (
                          <button
                            onClick={() => handleDelete(quotation.id)}
                            className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
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
  );
};

export default Quotations;
