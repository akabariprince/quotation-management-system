// src/pages/CustomerForm.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, MapPin, Truck, Check } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-11 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const states = [
  "Himachal Pradesh", "Punjab", "Uttarakhand", "Uttar Pradesh", "Haryana", "Rajasthan",
  "Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Telangana",
  "Bihar", "Jharkhand", "Odisha", "West Bengal",
  "Goa", "Gujarat", "Maharashtra",
  "Madhya Pradesh", "Chhattisgarh",
  "Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura",
];

const regions = ["North", "South", "East", "West", "Central", "North-East"];

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
    contactPerson: "",
    gstin: "",
    // Billing address
    address: "",
    landmark: "",
    city: "",
    state: "",
    region: "",
    pincode: "",
    // Delivery address
    deliverySameAsBilling: true,
    deliveryAddress: "",
    deliveryLandmark: "",
    deliveryCity: "",
    deliveryState: "",
    deliveryPincode: "",
  });

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
              contactPerson: customer.contactPerson || "",
              gstin: customer.gstin || "",
              address: customer.address || "",
              landmark: (customer as any).landmark || "",
              city: customer.city || "",
              state: customer.state || "",
              region: customer.region || "",
              pincode: (customer as any).pincode || "",
              deliverySameAsBilling:
                (customer as any).deliverySameAsBilling !== false,
              deliveryAddress: (customer as any).deliveryAddress || "",
              deliveryLandmark: (customer as any).deliveryLandmark || "",
              deliveryCity: (customer as any).deliveryCity || "",
              deliveryState: (customer as any).deliveryState || "",
              deliveryPincode: (customer as any).deliveryPincode || "",
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

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeliverySameToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      deliverySameAsBilling: checked,
      ...(checked
        ? {
            deliveryAddress: "",
            deliveryLandmark: "",
            deliveryCity: "",
            deliveryState: "",
            deliveryPincode: "",
          }
        : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.mobile) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.mobile.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid mobile number");
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (formData.gstin && formData.gstin.length !== 15) {
      toast.error("GSTIN must be exactly 15 characters");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email || null,
        contactPerson: formData.contactPerson || null,
        gstin: formData.gstin || null,
        address: formData.address || null,
        landmark: formData.landmark || null,
        city: formData.city || null,
        state: formData.state || null,
        region: formData.region || null,
        pincode: formData.pincode || null,
        deliverySameAsBilling: formData.deliverySameAsBilling,
        deliveryAddress: formData.deliverySameAsBilling
          ? null
          : formData.deliveryAddress || null,
        deliveryLandmark: formData.deliverySameAsBilling
          ? null
          : formData.deliveryLandmark || null,
        deliveryCity: formData.deliverySameAsBilling
          ? null
          : formData.deliveryCity || null,
        deliveryState: formData.deliverySameAsBilling
          ? null
          : formData.deliveryState || null,
        deliveryPincode: formData.deliverySameAsBilling
          ? null
          : formData.deliveryPincode || null,
      };

      if (id) {
        await updateCustomer(id, payload);
        toast.success("Customer updated successfully");
      } else {
        await createCustomer(payload);
        toast.success("Customer added successfully");
      }
      navigate("/customers");
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton />;

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
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* ──── Basic Information ──── */}
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

        {/* ──── Billing Address ──── */}
        <div className="form-section">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Billing Address</h2>
          </div>
          <div className="form-grid">
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="address">Address Line *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Street address, building, flat number"
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="landmark">Near / Landmark</Label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={(e) => handleChange("landmark", e.target.value)}
                placeholder="Near landmark, area"
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
                onValueChange={(v) => handleChange("state", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="411014"
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(v) => handleChange("region", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ──── Delivery Address ──── */}
        <div className="form-section">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">Delivery Address</h2>
          </div>

          {/* Same as billing checkbox */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg border border-border">
            <Checkbox
              id="deliverySameAsBilling"
              checked={formData.deliverySameAsBilling}
              onCheckedChange={(checked) =>
                handleDeliverySameToggle(checked as boolean)
              }
            />
            <Label
              htmlFor="deliverySameAsBilling"
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              <Check className="h-4 w-4 text-success" />
              Delivery address is same as billing address
            </Label>
          </div>

          {!formData.deliverySameAsBilling && (
            <div className="form-grid">
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="deliveryAddress">Address Line</Label>
                <Input
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    handleChange("deliveryAddress", e.target.value)
                  }
                  placeholder="Delivery street address"
                />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="deliveryLandmark">Near / Landmark</Label>
                <Input
                  id="deliveryLandmark"
                  value={formData.deliveryLandmark}
                  onChange={(e) =>
                    handleChange("deliveryLandmark", e.target.value)
                  }
                  placeholder="Near landmark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">City</Label>
                <Input
                  id="deliveryCity"
                  value={formData.deliveryCity}
                  onChange={(e) => handleChange("deliveryCity", e.target.value)}
                  placeholder="Delivery city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryState">State</Label>
                <Select
                  value={formData.deliveryState}
                  onValueChange={(v) => handleChange("deliveryState", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryPincode">Pincode</Label>
                <Input
                  id="deliveryPincode"
                  value={formData.deliveryPincode}
                  onChange={(e) =>
                    handleChange("deliveryPincode", e.target.value)
                  }
                  placeholder="411014"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {formData.deliverySameAsBilling && formData.address && (
            <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">
                Delivery will use billing address:
              </p>
              <p>
                {[
                  formData.address,
                  formData.landmark,
                  formData.city,
                  formData.state,
                  formData.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
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