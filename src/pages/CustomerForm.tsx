import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Form skeleton
const FormSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="page-header flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-muted rounded-md" />
        <div>
          <div className="h-6 bg-muted rounded w-40 mb-2" />
          <div className="h-4 bg-muted rounded w-52" />
        </div>
      </div>
      <div className="h-10 bg-muted rounded w-36" />
    </div>
    <div className="max-w-3xl">
      <div className="form-section">
        <div className="h-5 bg-muted rounded w-36 mb-4" />
        <div className="form-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`space-y-2 ${i === 4 ? "md:col-span-2 lg:col-span-3" : ""}`}
            >
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-11 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="form-section mt-6">
        <div className="h-5 bg-muted rounded w-40 mb-4" />
        <div className="form-grid">
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-11 bg-muted rounded" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded w-16" />
              <div className="h-11 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <div className="h-10 bg-muted rounded w-24" />
        <div className="h-10 bg-muted rounded w-36" />
      </div>
    </div>
  </div>
);

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const { fetchCustomerById, createCustomer, updateCustomer } = useCustomers();
  const requiredPermission = id ? "customer:edit" : "customer:create";

  useEffect(() => {
    if (!hasPermission(requiredPermission)) {
      toast.error("You don't have permission to perform this action");
      navigate("/customers");
    }
  }, [requiredPermission]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    gstin: "",
    contactPerson: "",
    city: "",
    state: "",
    region: "",
  });

  const states = [
    // North
    "Himachal Pradesh",
    "Punjab",
    "Uttarakhand",
    "Uttar Pradesh",
    "Haryana",
    "Rajasthan",

    // South
    "Andhra Pradesh",
    "Karnataka",
    "Kerala",
    "Tamil Nadu",
    "Telangana",

    // East
    "Bihar",
    "Jharkhand",
    "Odisha",
    "West Bengal",

    // West
    "Goa",
    "Gujarat",
    "Maharashtra",

    // Central
    "Madhya Pradesh",
    "Chhattisgarh",

    // North-East
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura",
  ];

  const regions = ["North", "South", "East", "West", "Central", "North-East"];

  // Load existing customer for edit
  useEffect(() => {
    const loadCustomer = async () => {
      if (id) {
        try {
          const customer = await fetchCustomerById(id);
          if (customer) {
            setFormData({
              name: customer.name || "",
              mobile: customer.mobile || "",
              email: customer.email || "",
              address: customer.address || "",
              gstin: customer.gstin || "",
              contactPerson: customer.contactPerson || "",
              city: customer.city || "",
              state: customer.state || "",
              region: customer.region || "",
            });
          } else {
            toast.error("Customer not found");
            navigate("/customers");
          }
        } catch {
          toast.error("Failed to load customer");
          navigate("/customers");
        }
        setLoading(false);
      }
    };
    loadCustomer();
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.mobile) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Mobile validation
    if (formData.mobile.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // GSTIN validation
    if (formData.gstin && formData.gstin.length !== 15) {
      toast.error("GSTIN must be exactly 15 characters");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        email: formData.email || null,
        address: formData.address || null,
        gstin: formData.gstin || null,
        contactPerson: formData.contactPerson || null,
        city: formData.city || null,
        state: formData.state || null,
        region: formData.region || null,
      };

      if (id) {
        await updateCustomer(id, payload);
        toast.success("Customer updated successfully");
      } else {
        await createCustomer(payload as any);
        toast.success("Customer added successfully");
      }
      navigate("/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/customers")}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">
              {id ? "Edit Customer" : "Add New Customer"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {id ? "Update customer information" : "Enter customer details"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/dashboard")}
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
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                placeholder="+91 XXXXXXXXXX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) =>
                  handleChange("gstin", e.target.value.toUpperCase())
                }
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
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter complete address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleChange("state", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => handleChange("region", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/customers")}
          >
            Cancel
          </Button>
          <Button type="submit" className="btn-accent" disabled={saving}>
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {id ? "Update Customer" : "Add Customer"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
