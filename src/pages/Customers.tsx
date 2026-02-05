import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Phone, Mail, MapPin } from 'lucide-react';
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        {hasPermission('add_customer') && (
          <Link to="/customers/new">
            <Button className="btn-accent">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="enterprise-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="enterprise-card overflow-hidden">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Contact</th>
              <th>Location</th>
              <th>GSTIN</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground py-8">
                  {searchTerm ? 'No customers found matching your search.' : 'No customers yet. Add your first customer.'}
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.contactPerson}</p>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {customer.mobile}
                      </p>
                      <p className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {customer.email}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{customer.city}, {customer.state}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs">{customer.gstin}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {hasPermission('add_customer') && (
                        <>
                          <button
                            onClick={() => navigate(`/customers/edit/${customer.id}`)}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 hover:bg-destructive/10 rounded-md transition-colors"
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">{selectedCustomer.name}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{selectedCustomer.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{selectedCustomer.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GSTIN</p>
                  <p className="font-medium font-mono text-sm">{selectedCustomer.gstin}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{selectedCustomer.address}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{selectedCustomer.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium">{selectedCustomer.state}</p>
                </div>
                <div>
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
