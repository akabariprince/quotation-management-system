import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, MapPin, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Customer } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Customers: React.FC = () => {
  const { hasPermission } = useAuth();
  const { customers, deleteCustomer } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(id);
      toast.success('Customer deleted successfully');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex gap-2">
          <h1 className="page-title">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>

        <div className="flex gap-2">
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
          </Link>

          {hasPermission('add_customer') && (
            <Link to="/customers/new">
              <Button className="btn-accent gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Customer</span>
              </Button>
            </Link>
          )}
        </div>
      </div>



      {/* Search */}
      <div className="enterprise-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="enterprise-card overflow-hidden">
        <div className="table-container">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th className="hidden md:table-cell">Contact</th>
                <th className="hidden lg:table-cell">Location</th>
                <th className="hidden xl:table-cell">GSTIN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-12">
                    {searchTerm ? 'No customers found matching your search.' : 'No customers yet. Add your first customer.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.contactPerson}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          {customer.mobile}
                        </p>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {customer.email}
                        </p>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span>{customer.city}, {customer.state}</span>
                      </div>
                    </td>
                    <td className="hidden xl:table-cell">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{customer.gstin}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="action-btn"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {hasPermission('add_customer') && (
                          <>
                            <button
                              onClick={() => navigate(`/customers/edit/${customer.id}`)}
                              className="action-btn"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="action-btn action-btn-danger"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">{selectedCustomer.name}</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{selectedCustomer.contactPerson}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selectedCustomer.mobile}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-medium font-mono text-sm bg-muted px-2 py-1 rounded inline-block">{selectedCustomer.gstin}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{selectedCustomer.address}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{selectedCustomer.city}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{selectedCustomer.state}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{selectedCustomer.region}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
