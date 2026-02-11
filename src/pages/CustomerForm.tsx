import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { customers, addCustomer, updateCustomer } = useData();

  const existingCustomer = id ? customers.find(c => c.id === id) : null;

  const [formData, setFormData] = useState({
    name: existingCustomer?.name || '',
    mobile: existingCustomer?.mobile || '',
    email: existingCustomer?.email || '',
    address: existingCustomer?.address || '',
    gstin: existingCustomer?.gstin || '',
    contactPerson: existingCustomer?.contactPerson || '',
    city: existingCustomer?.city || '',
    state: existingCustomer?.state || '',
    region: existingCustomer?.region || '',
  });

  const states = [
    'Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi',
    'Haryana', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Kerala'
  ];

  const regions = ['North', 'South', 'East', 'West', 'Central'];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.mobile || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (existingCustomer) {
      updateCustomer(existingCustomer.id, formData);
      toast.success('Customer updated successfully');
    } else {
      addCustomer(formData);
      toast.success('Customer added successfully');
    }
    
    navigate('/customers');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
<div className="page-header flex items-center justify-between">
  <div className="flex items-center gap-4">
    <button
      onClick={() => navigate('/customers')}
      className="p-2 hover:bg-muted rounded-md transition-colors"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
    <div>
      <h1 className="page-title">
        {existingCustomer ? 'Edit Customer' : 'Add New Customer'}
      </h1>
      <p className="text-muted-foreground mt-1">
        {existingCustomer
          ? 'Update customer information'
          : 'Enter customer details'}
      </p>
    </div>
  </div>

  {/* Added button only */}
  <Button
    variant="outline"
    className="gap-2"
    onClick={() => navigate('/dashboard')}
  >
    <ArrowLeft className="h-4 w-4" />
    <span className="hidden sm:inline">Back to Dashboard</span>
  </Button>
</div>



      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="form-section">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="form-grid">
            <div className="space-y-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                placeholder="+91 XXXXX XXXXX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                placeholder="27AAFCS1234M1ZM"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        <div className="form-section mt-6">
          <h2 className="text-lg font-semibold mb-4">Address Information</h2>
          <div className="form-grid">
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Enter complete address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={formData.state} onValueChange={(value) => handleChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={(value) => handleChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
            Cancel
          </Button>
          <Button type="submit" className="btn-accent">
            <Save className="h-4 w-4 mr-2" />
            {existingCustomer ? 'Update Customer' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
