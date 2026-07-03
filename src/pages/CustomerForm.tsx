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
import { Skeleton } from "@/components/ui/skeleton";
import VerificationField from "@/components/common/VerificationField";

const FormSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <Skeleton className="w-7 h-7 rounded" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-7 w-28 rounded" />
        <Skeleton className="h-7 w-32 rounded" />
      </div>
    </div>
    <div className="max-w-3xl space-y-3">
      <div className="enterprise-card p-3">
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={i >= 5 ? "md:col-span-2 lg:col-span-3" : ""}
            >
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="enterprise-card p-3">
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={i < 2 ? "md:col-span-2 lg:col-span-3" : ""}>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="enterprise-card p-3">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-9 w-full rounded mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={i < 2 ? "md:col-span-2 lg:col-span-3" : ""}>
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20 rounded" />
        <Skeleton className="h-7 w-28 rounded" />
      </div>
    </div>
  </div>
);

const states = [
  "Himachal Pradesh",
  "Punjab",
  "Uttarakhand",
  "Uttar Pradesh",
  "Haryana",
  "Rajasthan",
  "Andhra Pradesh",
  "Karnataka",
  "Kerala",
  "Tamil Nadu",
  "Telangana",
  "Bihar",
  "Jharkhand",
  "Odisha",
  "West Bengal",
  "Goa",
  "Gujarat",
  "Maharashtra",
  "Madhya Pradesh",
  "Chhattisgarh",
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

const normalizeMobile = (mobile: string) => {
  const cleaned = mobile.trim().replace(/\s+/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  const digits = cleaned.replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};

const getLocalMobile = (mobile: string) => {
  const digits = mobile.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length >= 12) {
    return digits.slice(2, 12);
  }
  return digits.slice(0, 10);
};

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const {
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    requestCustomerMobileOTP,
    verifyCustomerMobileOTP,
    requestCustomerEmailOTP,
    verifyCustomerEmailOTP,
  } = useCustomers();

  const requiredPermission = id ? "customer:edit" : "customer:create";

  useEffect(() => {
    if (!hasPermission(requiredPermission)) {
      toast.error("You don't have permission to perform this action");
      navigate("/customers");
    }
  }, [requiredPermission]);

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileOtpLogId, setMobileOtpLogId] = useState<string | null>(null);
  const [verifiedMobileOtpLogId, setVerifiedMobileOtpLogId] = useState<
    string | null
  >(null);
  const [verifiedMobile, setVerifiedMobile] = useState<string | null>(null);
  const [whatsAppVerified, setWhatsAppVerified] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpLogId, setEmailOtpLogId] = useState<string | null>(null);
  const [verifiedEmailOtpLogId, setVerifiedEmailOtpLogId] = useState<
    string | null
  >(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    contactPerson: "",
    gstin: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    region: "",
    pincode: "",
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
              mobile: getLocalMobile(customer.mobile || ""),
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
            setWhatsAppVerified(Boolean(customer.whatsappVerified));
            setVerifiedMobile(customer.whatsappVerifiedMobile || null);
            setEmailVerified(Boolean(customer.emailVerified));
            setVerifiedEmail(customer.emailVerifiedEmail || null);
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
    if (field === "mobile") {
      const digitsOnly = String(value || "")
        .replace(/\D/g, "")
        .slice(0, 10);
      const nextMobile = normalizeMobile(digitsOnly);
      if (verifiedMobile && nextMobile !== verifiedMobile) {
        setWhatsAppVerified(false);
        setVerifiedMobileOtpLogId(null);
      }
      setFormData((prev) => ({ ...prev, [field]: digitsOnly }));
      return;
    }
    if (field === "email") {
      const nextEmail = String(value || "")
        .trim()
        .toLowerCase();
      if (verifiedEmail && nextEmail !== verifiedEmail) {
        setEmailVerified(false);
        setVerifiedEmailOtpLogId(null);
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
      return;
    }
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

  const handleSendMobileOTP = async () => {
    if (formData.mobile.length !== 10) {
      toast.error("Please enter a valid mobile number first");
      return;
    }
    setSendingOtp(true);
    try {
      const response = await requestCustomerMobileOTP(
        normalizeMobile(formData.mobile),
      );
      setMobileOtpLogId(response.otpLogId);
      setWhatsAppVerified(false);
      setVerifiedMobileOtpLogId(null);
      setMobileOtp("");
      toast.success(`WhatsApp OTP sent to ${response.mobile}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send WhatsApp OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyMobileOTP = async () => {
    if (!mobileOtpLogId) {
      toast.error("Request OTP first");
      return;
    }
    if (mobileOtp.trim().length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setVerifyingOtp(true);
    try {
      const response = await verifyCustomerMobileOTP(
        normalizeMobile(formData.mobile),
        mobileOtp,
        mobileOtpLogId,
      );
      setVerifiedMobile(response.verifiedMobile);
      setWhatsAppVerified(true);
      setVerifiedMobileOtpLogId(response.otpLogId);
      setMobileOtpLogId(null);
      setMobileOtp("");
      toast.success("WhatsApp mobile verified");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSendEmailOTP = async () => {
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      toast.error("Please enter a valid email address first");
      return;
    }
    setSendingEmailOtp(true);
    try {
      const response = await requestCustomerEmailOTP(normalizedEmail);
      setEmailOtpLogId(response.otpLogId);
      setEmailVerified(false);
      setVerifiedEmailOtpLogId(null);
      setEmailOtp("");
      toast.success(`Email OTP sent to ${response.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send email OTP");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    const normalizedEmail = formData.email.trim().toLowerCase();
    if (!emailOtpLogId) {
      toast.error("Request OTP first");
      return;
    }
    if (emailOtp.trim().length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setVerifyingEmailOtp(true);
    try {
      const response = await verifyCustomerEmailOTP(
        normalizedEmail,
        emailOtp,
        emailOtpLogId,
      );
      setVerifiedEmail(response.verifiedEmail);
      setEmailVerified(true);
      setVerifiedEmailOtpLogId(response.otpLogId);
      setEmailOtpLogId(null);
      setEmailOtp("");
      toast.success("Email verified");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify email OTP");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const resetMobileFlow = () => {
    setWhatsAppVerified(false);
    setMobileOtpLogId(null);
    setMobileOtp("");
    setVerifiedMobileOtpLogId(null);
  };

  const resetEmailFlow = () => {
    setEmailVerified(false);
    setEmailOtpLogId(null);
    setEmailOtp("");
    setVerifiedEmailOtpLogId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.mobile) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.mobile.length !== 10) {
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
      const normalizedFormMobile = normalizeMobile(formData.mobile);
      const normalizedFormEmail = formData.email.trim().toLowerCase();
      const payload: any = {
        name: formData.name,
        mobile: normalizedFormMobile,
        verificationOtpLogId:
          whatsAppVerified &&
          verifiedMobile === normalizedFormMobile &&
          verifiedMobileOtpLogId
            ? verifiedMobileOtpLogId
            : null,
        emailVerificationOtpLogId:
          emailVerified &&
          verifiedEmail === normalizedFormEmail &&
          verifiedEmailOtpLogId
            ? verifiedEmailOtpLogId
            : null,
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
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/customers")}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold leading-none">
              {id ? "Edit Customer" : "Add New Customer"}
            </h1>
            <p className="text-muted-foreground text-xs">
              {id ? "Update customer information" : "Enter customer details"}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            className="gap-1 h-7 text-xs px-2"
            size="sm"
            onClick={() => navigate("/customers")}
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline text-white">
              Back to Customers
            </span>
          </Button>
          <Button
            variant="outline"
            className="gap-1 h-7 text-xs px-2"
            size="sm"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-3 w-3" />
            <span className="hidden sm:inline text-white">
              Back to Dashboard
            </span>
          </Button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-3 mt-1">
        {/* ──── Basic Information ──── */}
        <div className="enterprise-card p-3">
          <h2 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">
                Customer Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter customer name"
                required
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPerson" className="text-xs">
                Contact Person
              </Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                placeholder="Enter contact person name"
                className="h-8 text-sm"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 gap-3">
              <VerificationField
                label="Mobile Number"
                required
                value={formData.mobile}
                onChange={(value) => handleChange("mobile", value)}
                placeholder="XXXXXXXXXX"
                maxLength={10}
                inputMode="numeric"
                prefix="+91"
                verified={whatsAppVerified}
                verifiedLabel="WhatsApp Verified"
                unverifiedLabel="WhatsApp Not Verified"
                otpLogId={mobileOtpLogId}
                otpValue={mobileOtp}
                onOtpChange={setMobileOtp}
                onSendOtp={handleSendMobileOTP}
                onVerifyOtp={handleVerifyMobileOTP}
                onResetFlow={resetMobileFlow}
                sendingOtp={sendingOtp}
                verifyingOtp={verifyingOtp}
                sendButtonLabel="Send OTP"
                resendButtonLabel="Send Again"
                isValueValid={formData.mobile.length === 10}
              />
              <VerificationField
                label="Email Address"
                value={formData.email}
                onChange={(value) => handleChange("email", value)}
                placeholder="customer@example.com"
                type="email"
                verified={emailVerified}
                verifiedLabel="Email Verified"
                unverifiedLabel="Email Not Verified"
                otpLogId={emailOtpLogId}
                otpValue={emailOtp}
                onOtpChange={setEmailOtp}
                onSendOtp={handleSendEmailOTP}
                onVerifyOtp={handleVerifyEmailOTP}
                onResetFlow={resetEmailFlow}
                sendingOtp={sendingEmailOtp}
                verifyingOtp={verifyingEmailOtp}
                sendButtonLabel="Send OTP"
                resendButtonLabel="Send Again"
                isValueValid={
                  !formData.email ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    formData.email.trim().toLowerCase(),
                  )
                }
              />
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-2">
              <Label htmlFor="gstin" className="text-xs">
                GSTIN
              </Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) =>
                  handleChange("gstin", e.target.value.toUpperCase())
                }
                placeholder="27AAFCS1234M1ZM"
                maxLength={15}
                className="h-8 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* ──── Billing Address ──── */}
        <div className="enterprise-card p-3">
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <h2 className="text-xs font-semibold">Billing Address</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <Label htmlFor="address" className="text-xs">
                Address Line *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Street address, building, flat number"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1 md:col-span-2 lg:col-span-3">
              <Label htmlFor="landmark" className="text-xs">
                Near / Landmark
              </Label>
              <Input
                id="landmark"
                value={formData.landmark}
                onChange={(e) => handleChange("landmark", e.target.value)}
                placeholder="Near landmark, area"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="city" className="text-xs">
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Enter city"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state" className="text-xs">
                State
              </Label>
              <Select
                value={formData.state}
                onValueChange={(v) => handleChange("state", v)}
              >
                <SelectTrigger className="h-8 text-sm">
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
            <div className="space-y-1">
              <Label htmlFor="pincode" className="text-xs">
                Pincode
              </Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="411014"
                maxLength={6}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="region" className="text-xs">
                Region
              </Label>
              <Select
                value={formData.region}
                onValueChange={(v) => handleChange("region", v)}
              >
                <SelectTrigger className="h-8 text-sm">
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
        <div className="enterprise-card p-3">
          <div className="flex items-center gap-1.5 mb-3">
            <Truck className="h-3.5 w-3.5 text-green-600" />
            <h2 className="text-xs font-semibold">Delivery Address</h2>
          </div>

          {/* Same as billing checkbox */}
          <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-md border border-border">
            <Checkbox
              id="deliverySameAsBilling"
              checked={formData.deliverySameAsBilling}
              onCheckedChange={(checked) =>
                handleDeliverySameToggle(checked as boolean)
              }
            />
            <Label
              htmlFor="deliverySameAsBilling"
              className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-3 w-3 text-success" />
              Delivery address is same as billing address
            </Label>
          </div>

          {!formData.deliverySameAsBilling && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <Label htmlFor="deliveryAddress" className="text-xs">
                  Address Line
                </Label>
                <Input
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    handleChange("deliveryAddress", e.target.value)
                  }
                  placeholder="Delivery street address"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3">
                <Label htmlFor="deliveryLandmark" className="text-xs">
                  Near / Landmark
                </Label>
                <Input
                  id="deliveryLandmark"
                  value={formData.deliveryLandmark}
                  onChange={(e) =>
                    handleChange("deliveryLandmark", e.target.value)
                  }
                  placeholder="Near landmark"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deliveryCity" className="text-xs">
                  City
                </Label>
                <Input
                  id="deliveryCity"
                  value={formData.deliveryCity}
                  onChange={(e) => handleChange("deliveryCity", e.target.value)}
                  placeholder="Delivery city"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="deliveryState" className="text-xs">
                  State
                </Label>
                <Select
                  value={formData.deliveryState}
                  onValueChange={(v) => handleChange("deliveryState", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
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
              <div className="space-y-1">
                <Label htmlFor="deliveryPincode" className="text-xs">
                  Pincode
                </Label>
                <Input
                  id="deliveryPincode"
                  value={formData.deliveryPincode}
                  onChange={(e) =>
                    handleChange("deliveryPincode", e.target.value)
                  }
                  placeholder="411014"
                  maxLength={6}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {formData.deliverySameAsBilling && formData.address && (
            <div className="bg-muted/30 rounded-md p-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">
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
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="h-7 text-xs px-3"
            onClick={() => navigate("/customers")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="btn-accent h-7 text-xs px-3"
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-3 w-3 mr-1" />
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
