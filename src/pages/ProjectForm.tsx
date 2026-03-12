import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Save,
  Send,
  Package,
  Calculator,
  ChevronRight,
  Loader2,
  Mail,
  X,
  Eye,
  MapPin,
  Truck,
  Edit,
  Check,
  Pencil,
  FolderOpen,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, ProjectDetail } from "@/hooks/useProjects";
import { useCustomers } from "@/hooks/useCustomers";
import { Quotation, useQuotations } from "@/hooks/useQuotations";
import { useMaterials } from "@/hooks/useMaterials";
import { useSalesPersons } from "@/hooks/useSalesPersons";
import { useCategories } from "@/hooks/useCategories";
import { useCategoryNos } from "@/hooks/useCategoryNos";
import { useQuotationTypes } from "@/hooks/useQuotationTypes";
import { useVariants } from "@/hooks/useVariants";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OTPModal from "@/components/common/OTPModal";
import QuotationCard from "@/components/project/QuotationCard";
import CustomerSearchSelect from "@/components/common/CustomerSearchSelect";
import { toast } from "sonner";
import { getImageUrl } from "@/utils/reportHelpers";
// import QuotationSearchSelect from "@/components/common/QuotationSearchSelect"; // Replaced with 4-field filter

/* ── Interfaces ── */
interface ProjectItemLocal {
  id: string;
  quotationId: string;
  quotationCode: string;
  quotationName: string;
  description: string | null;
  images: string[];
  woodId: string | null;
  woodName: string | null;
  polishId: string | null;
  polishName: string | null;
  fabricId: string | null;
  fabricName: string | null;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  quantity: number;
  total: number;
  gstPercent: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalWithGst: number;
  notes: string[];
  itemNumber: number;
  uniqueNumber: string;
  length: number;
  width: number;
  specialNote: string;
}

interface DeliveryAddressData {
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

/* ── Helpers ── */
const resolveSelectValue = (val: string): string | undefined =>
  val === "none" || val === "" ? undefined : val;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const generateQuotationUniqueNumber = (
  projectNo: string,
  itemIndex: number,
): string => {
  const prefix =
    projectNo
      .replace(/[^A-Z0-9]/gi, "")
      .slice(0, 4)
      .toUpperCase() || "PJ";
  const num = String(itemIndex + 1).padStart(4, "0");
  return `${prefix}Q${num}`;
};

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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getQuotationImageUrl = (imagePath: string) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
    return imagePath;
  return `${API_BASE_URL}/${imagePath}`;
};

/* ── Form Page Skeleton ── */
const FormPageSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="page-header mb-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 bg-muted rounded-md" />
        <div>
          <div className="h-6 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-32" />
        </div>
      </div>
      <div className="h-10 bg-muted rounded w-36" />
    </div>
    <div className="max-w-3xl space-y-6">
      <div className="form-section">
        <div className="h-5 bg-muted rounded w-32 mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
      <div className="form-section">
        <div className="h-5 bg-muted rounded w-40 mb-4" />
        <div className="form-grid">
          <div className="space-y-2 lg:col-span-2">
            <div className="h-4 bg-muted rounded w-36" />
            <div className="h-11 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-11 bg-muted rounded" />
          </div>
        </div>
      </div>
      <div className="h-10 bg-muted rounded w-28" />
    </div>
  </div>
);

/* ── Inline Editable Project Name (unchanged) ── */
interface InlineProjectNameProps {
  value: string;
  onChange: (value: string) => void;
  projectNo: string;
}

const InlineProjectName: React.FC<InlineProjectNameProps> = ({
  value,
  onChange,
  projectNo,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onChange(editValue.trim());
    setIsEditing(false);
    if (editValue.trim() && editValue.trim() !== value)
      toast.success("Project name updated");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-lg px-4 py-2.5 mt-2 mb-4">
      <div className="flex items-center gap-2 flex-shrink-0">
        <FolderOpen className="h-4 w-4 text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Project Name
        </span>
      </div>
      <div className="h-4 w-px bg-border flex-shrink-0" />
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            placeholder="Enter project name..."
            className="h-8 text-sm font-medium border-accent/50 focus-visible:ring-accent/30 flex-1"
          />
          <button
            onClick={handleSave}
            className="p-1.5 bg-accent/10 hover:bg-accent/20 rounded-md transition-colors flex-shrink-0"
            title="Save"
          >
            <Check className="h-3.5 w-3.5 text-accent" />
          </button>
          <button
            onClick={() => {
              setEditValue(value);
              setIsEditing(false);
            }}
            className="p-1.5 hover:bg-muted rounded-md transition-colors flex-shrink-0"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {value ? (
            <span className="text-sm font-semibold truncate flex-1">
              {value}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic truncate flex-1">
              No project name
            </span>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 hover:bg-muted rounded-md transition-colors flex-shrink-0 group"
            title="Edit project name"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
          </button>
        </div>
      )}
      <div className="h-4 w-px bg-border flex-shrink-0 hidden sm:block" />
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          No:
        </span>
        <span className="text-xs font-bold font-mono text-primary">
          {projectNo}
        </span>
      </div>
    </div>
  );
};

/* ── Email Send Modal (unchanged) ── */
interface EmailSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  customer: any;
  salesPerson: any;
  grandTotal: number;
  items: ProjectItemLocal[];
}

const EmailSendModal: React.FC<EmailSendModalProps> = ({
  isOpen,
  onClose,
  project,
  customer,
  salesPerson,
  grandTotal,
  items,
}) => {
  const api = useApi();
  const navigate = useNavigate();
  const [toEmail, setToEmail] = useState(customer?.email || "");
  const [ccEmail, setCcEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setToEmail(customer?.email || "");
      setCcEmail("");
      setSubject(
        `Quotation ${project.projectNo || project.quotationNo || ""} - Ecstatics Spaces India`,
      );
      setMessage(
        `Dear ${customer?.name || "Customer"},\n\nPlease find the project quotation for your review. The total value is ${formatCurrency(grandTotal)} (including GST).\n\nFor any queries, please feel free to contact us.\n\nBest Regards,\n${salesPerson?.name || ""}\nEcstatics Spaces India Pvt. Ltd.`,
      );
      setSending(false);
      setSent(false);
    }
  }, [isOpen, project]);

  const handleSendEmail = async () => {
    if (!toEmail.trim()) {
      toast.error("Please enter a recipient email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      const res = await api.post(`/projects/${project.id}/send-email`, {
        to: toEmail.trim(),
        cc: ccEmail.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        type: "sent",
      });
      if (res.success) {
        setSent(true);
        toast.success(`Email sent successfully to ${toEmail}`);
      } else toast.error(res.message || "Failed to send email");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    onClose();
    if (sent) navigate("/projects");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-card shadow-2xl w-full max-w-2xl p-6 animate-scale-in mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/10 rounded-lg">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {sent ? "Email Sent!" : "Send Project Email"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {project.projectNo || project.quotationNo}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-semibold text-success mb-2">
              Email Sent Successfully!
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              The project quotation has been sent to <strong>{toEmail}</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/projects")}
                className="gap-2"
              >
                Go to Projects
              </Button>
              <Button
                onClick={() => navigate(`/projects/${project.id}/pdf`)}
                className="btn-accent gap-2"
              >
                <Eye className="h-4 w-4" /> View PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">To *</Label>
              <Input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="customer@email.com"
                className="h-11"
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">CC (optional)</Label>
              <Input
                type="email"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="cc@email.com"
                className="h-11"
                disabled={sending}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11"
                disabled={sending}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Project</span>
                <span className="font-semibold font-mono">
                  {project.projectNo || project.quotationNo}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{customer?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{items.length} quotation(s)</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="text-muted-foreground font-semibold">
                  Grand Total (incl. GST)
                </span>
                <span className="font-bold text-accent">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] text-sm"
                disabled={sending}
              />
            </div>
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11"
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => navigate(`/projects/${project.id}/pdf`)}
                variant="outline"
                className="gap-2 h-11"
                disabled={sending}
              >
                <Eye className="h-4 w-4" /> Preview PDF
              </Button>
              <Button
                onClick={handleSendEmail}
                className="flex-1 btn-accent gap-2 h-11"
                disabled={sending || !toEmail.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Delivery Address Editor (unchanged) ── */
interface DeliveryAddressEditorProps {
  deliverySameAsBilling: boolean;
  onToggleSame: (checked: boolean) => void;
  deliveryAddr: DeliveryAddressData;
  onChangeField: (field: keyof DeliveryAddressData, value: string) => void;
  billingAddress: string;
}

const DeliveryAddressEditor: React.FC<DeliveryAddressEditorProps> = ({
  deliverySameAsBilling,
  onToggleSame,
  deliveryAddr,
  onChangeField,
  billingAddress,
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
      <Checkbox
        id="deliverySame"
        checked={deliverySameAsBilling}
        onCheckedChange={(v) => onToggleSame(v as boolean)}
      />
      <Label
        htmlFor="deliverySame"
        className="text-sm font-medium cursor-pointer flex items-center gap-2"
      >
        <Check className="h-4 w-4 text-success" /> Delivery address same as
        billing
      </Label>
    </div>
    {deliverySameAsBilling && billingAddress && (
      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <span className="font-medium text-foreground">
          Using billing address:{" "}
        </span>
        {billingAddress}
      </p>
    )}
    {!deliverySameAsBilling && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Address Line</Label>
          <Input
            value={deliveryAddr.address}
            onChange={(e) => onChangeField("address", e.target.value)}
            placeholder="Delivery street address"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Near / Landmark</Label>
          <Input
            value={deliveryAddr.landmark}
            onChange={(e) => onChangeField("landmark", e.target.value)}
            placeholder="Near landmark"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">City</Label>
          <Input
            value={deliveryAddr.city}
            onChange={(e) => onChangeField("city", e.target.value)}
            placeholder="City"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">State</Label>
          <Select
            value={deliveryAddr.state}
            onValueChange={(v) => onChangeField("state", v)}
          >
            <SelectTrigger className="h-9 text-sm">
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
          <Label className="text-xs">Pincode</Label>
          <Input
            value={deliveryAddr.pincode}
            onChange={(e) => onChangeField("pincode", e.target.value)}
            placeholder="411014"
            maxLength={6}
            className="h-9 text-sm"
          />
        </div>
      </div>
    )}
  </div>
);

/* ══════════════════════════════════════════════════════════════ */
/*                   Main ProjectForm Component                  */
/* ══════════════════════════════════════════════════════════════ */

const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, hasPermission } = useAuth();
  const requiredPermission = id ? "project:edit" : "project:create";

  useEffect(() => {
    if (!hasPermission(requiredPermission)) {
      toast.error("You don't have permission to perform this action");
      navigate("/projects");
    }
  }, [requiredPermission]);

  const {
    fetchProjectById,
    getNextProjectNumber,
    createProject,
    updateProject,
  } = useProjects();
  const { customers, fetchCustomers } = useCustomers();
  const { findByPartCodeFilters } = useQuotations();
  const { woods, polishes, fabrics } = useMaterials();
  const { salesPersons } = useSalesPersons();

  // ── Load master data for filter dropdowns ──
  const { categories: allCategories, fetchCategories: fetchAllCats } =
    useCategories();
  const { categoryNos: allCategoryNos, fetchCategoryNos: fetchAllCatNos } =
    useCategoryNos();
  const {
    quotationTypes: allQuotationTypes,
    fetchQuotationTypes: fetchAllTypes,
  } = useQuotationTypes();
  const { variants: allVariants, fetchVariants: fetchAllVariants } =
    useVariants();

  useEffect(() => {
    fetchAllCats({ limit: 1000 });
    fetchAllCatNos({ limit: 1000 });
    fetchAllTypes({ limit: 1000 });
    fetchAllVariants({ limit: 1000 });
    fetchCustomers({ limit: 20, sortBy: "updatedAt", sortOrder: "DESC" });
  }, []);

  /* ── State ── */
  const [existingProject, setExistingProject] = useState<ProjectDetail | null>(
    null,
  );
  const [projectNo, setProjectNo] = useState("");
  const [projectName, setProjectName] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [customerId, setCustomerId] = useState("");
  const [salesPersonId, setSalesPersonId] = useState("");
  const [items, setItems] = useState<ProjectItemLocal[]>([]);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );

  // Delivery address
  const [deliverySameAsBilling, setDeliverySameAsBilling] = useState(true);
  const [deliveryAddr, setDeliveryAddr] = useState<DeliveryAddressData>({
    address: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [showDeliveryEditor, setShowDeliveryEditor] = useState(false);

  // OTP
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingDiscountEdit, setPendingDiscountEdit] = useState<{
    itemId: string;
    newDiscount: number;
  } | null>(null);
  const pendingItem = pendingDiscountEdit
    ? items.find((i) => i.id === pendingDiscountEdit.itemId)
    : null;

  // Email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [savedProject, setSavedProject] = useState<any>(null);

  // ── Quotation add — 4-field filter (NEW) ──
  const [filterCategory, setFilterCategory] = useState("");
  const [filterCategoryNo, setFilterCategoryNo] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterVariant, setFilterVariant] = useState("");
  const [matchedQuotation, setMatchedQuotation] = useState<Quotation | null>(
    null,
  );
  const [matchLoading, setMatchLoading] = useState(false);
  const [newlyAddedItemId, setNewlyAddedItemId] = useState<string | null>(null);

  // Loading
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Filtered dropdown options ──
  const activeCats = allCategories.filter((c) => c.status === "active");
  const filteredCatNos = allCategoryNos.filter(
    (cn) => cn.categoryId === filterCategory && cn.status === "active",
  );
  const filteredTypes = allQuotationTypes.filter(
    (qt) => qt.categoryId === filterCategory && qt.status === "active",
  );
  const activeVariants = allVariants.filter((v) => v.status === "active");

  // ── Reset dependent filters on category change ──
  useEffect(() => {
    setFilterCategoryNo("");
    setFilterType("");
    setMatchedQuotation(null);
  }, [filterCategory]);

  useEffect(() => {
    setMatchedQuotation(null);
  }, [filterCategoryNo, filterType, filterVariant]);

  // ── Search for matching quotation when all 4 are filled ──
  useEffect(() => {
    if (filterCategory && filterCategoryNo && filterType && filterVariant) {
      const search = async () => {
        setMatchLoading(true);
        const result = await findByPartCodeFilters({
          categoryId: filterCategory,
          categoryNoId: filterCategoryNo,
          quotationTypeId: filterType,
          variantId: filterVariant,
        });
        setMatchedQuotation(result);
        setMatchLoading(false);
      };
      search();
    }
  }, [
    filterCategory,
    filterCategoryNo,
    filterType,
    filterVariant,
    findByPartCodeFilters,
  ]);

  /* ── Load existing project or generate next number ── */
  useEffect(() => {
    const init = async () => {
      if (id) {
        const p = await fetchProjectById(id);
        if (p) {
          setExistingProject(p);
          setProjectNo(p.projectNo);
          setProjectName((p as any).projectName || "");
          setCustomerId(p.customerId);
          setSalesPersonId(p.salesPersonId || "");
          const pAny = p as any;
          if (pAny.deliveryAddress) {
            setDeliverySameAsBilling(false);
            setDeliveryAddr({
              address: pAny.deliveryAddress || "",
              landmark: pAny.deliveryLandmark || "",
              city: pAny.deliveryCity || "",
              state: pAny.deliveryState || "",
              pincode: pAny.deliveryPincode || "",
            });
          } else {
            setDeliverySameAsBilling(true);
          }
          setItems(
            (p.items || []).map((item: any, i: number) =>
              recalculateItem({
                ...item,
                quotationId: item.quotationId,
                quotationCode: item.quotationCode,
                quotationName: item.quotationName,
                basePrice: Number(item.basePrice) || 0,
                discountPercent: Number(item.discountPercent) || 0,
                discountAmount: Number(item.discountAmount) || 0,
                finalPrice: Number(item.finalPrice) || 0,
                quantity: Number(item.quantity) || 1,
                total: Number(item.total) || 0,
                gstPercent: Number(item.gstPercent) || 18,
                igst: Number(item.igst) || 0,
                cgst: Number(item.cgst) || 0,
                sgst: Number(item.sgst) || 0,
                totalWithGst: Number(item.totalWithGst) || 0,
                images: item.images || [],
                notes: item.notes || [],
                itemNumber: i + 1,
                uniqueNumber: generateQuotationUniqueNumber(p.projectNo, i),
                length: item.quotation?.length,
                width: item.quotation?.width,
                specialNote: item.specialNote || "",
              }),
            ),
          );
          setStep(2);
        }
      } else {
        const nextNo = await getNextProjectNumber();
        setProjectNo(nextNo);
        if (user?.id) setSalesPersonId(user.id);
      }
      setPageLoading(false);
    };
    init();
  }, [id]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedSalesPerson = salesPersons.find(
    (sp) => sp.id === salesPersonId,
  );

  /* ── Populate delivery address from customer ── */
  useEffect(() => {
    if (selectedCustomer && !existingProject) {
      const cust = selectedCustomer as any;
      if (cust.deliverySameAsBilling === false && cust.deliveryAddress) {
        setDeliverySameAsBilling(false);
        setDeliveryAddr({
          address: cust.deliveryAddress || "",
          landmark: cust.deliveryLandmark || "",
          city: cust.deliveryCity || "",
          state: cust.deliveryState || "",
          pincode: cust.deliveryPincode || "",
        });
      } else {
        setDeliverySameAsBilling(true);
        setDeliveryAddr({
          address: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
        });
      }
    }
  }, [customerId, selectedCustomer]);

  const billingAddressString = selectedCustomer
    ? [
      selectedCustomer.address,
      (selectedCustomer as any).landmark,
      selectedCustomer.city,
      selectedCustomer.state,
      (selectedCustomer as any).pincode,
    ]
      .filter(Boolean)
      .join(", ")
    : "";

  /* ── Recalculate Item ── */
  const recalculateItem = (item: ProjectItemLocal): ProjectItemLocal => {
    const basePrice = Number(item.basePrice) || 0;
    const quantity = Number(item.quantity) || 1;
    const gstPercent = Number(item.gstPercent) || 18;
    const discountPercent = Number(item.discountPercent) || 0;
    const amount = basePrice * quantity;
    const gstAmount = (amount * gstPercent) / 100;
    const discountAmount = (amount * discountPercent) / 100;
    const grandTotalItem = amount + gstAmount - discountAmount;
    return {
      ...item,
      basePrice,
      quantity,
      gstPercent,
      discountPercent,
      total: amount,
      discountAmount,
      finalPrice: basePrice,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      totalWithGst: grandTotalItem,
    };
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    if (field === "quantity" && !hasPermission("quantity:edit")) {
      toast.error("No permission to edit quantity");
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return recalculateItem({ ...item, [field]: value });
      }),
    );
  };

  const updateItemMaterial = (
    itemId: string,
    materialType: "wood" | "polish" | "fabric",
    rawValue: string,
  ) => {
    const materialId = resolveSelectValue(rawValue);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (materialType === "wood") {
          return {
            ...item,
            woodId: materialId || null,
            woodName: materialId
              ? woods.find((w) => w.id === materialId)?.name || null
              : null,
          };
        } else if (materialType === "polish") {
          return {
            ...item,
            polishId: materialId || null,
            polishName: materialId
              ? polishes.find((p) => p.id === materialId)?.name || null
              : null,
          };
        } else {
          return {
            ...item,
            fabricId: materialId || null,
            fabricName: materialId
              ? fabrics.find((f) => f.id === materialId)?.name || null
              : null,
          };
        }
      }),
    );
    toast.success(
      `${materialType.charAt(0).toUpperCase() + materialType.slice(1)} updated`,
    );
  };

  const discountRange = {
    min: Number((user as any)?.role?.discountMin) || 0,
    max: Number((user as any)?.role?.discountMax) || 100,
  };

  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    if (!hasPermission("discount:edit")) {
      toast.error("No permission to edit discount");
      return;
    }
    const clamped = Math.max(
      discountRange.min,
      Math.min(discountRange.max, newDiscount),
    );
    if (newDiscount !== clamped) {
      toast.warning(
        `Discount must be between ${discountRange.min}% and ${discountRange.max}%`,
      );
    }
    if (user?.role?.name !== "admin") {
      setPendingDiscountEdit({ itemId, newDiscount: clamped });
      setShowOTPModal(true);
    } else {
      updateItem(itemId, "discountPercent", clamped);
    }
  };

  const handleOTPVerify = (otp: string, otpLogId: string) => {
    if (pendingDiscountEdit) {
      updateItem(
        pendingDiscountEdit.itemId,
        "discountPercent",
        pendingDiscountEdit.newDiscount,
      );
      toast.success("Discount updated successfully");
    }
    setShowOTPModal(false);
    setPendingDiscountEdit(null);
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.id !== itemId);
      return filtered.map((item, i) => ({
        ...item,
        itemNumber: i + 1,
        uniqueNumber: generateQuotationUniqueNumber(projectNo, i),
      }));
    });
    toast.success("Quotation removed");
  };

  // ── Add matched quotation to cart (NEW) ──
  const handleAddMatchedQuotation = () => {
    if (!matchedQuotation) {
      toast.error("No matching product found");
      return;
    }

    if (items.find((item) => item.quotationId === matchedQuotation.id)) {
      toast.error("Quotation already added. Update quantity instead.");
      return;
    }

    const quotation = matchedQuotation;
    const quantity = 1;
    const amount = quotation.basePrice * quantity;
    const gstAmount = (amount * quotation.gstPercent) / 100;
    const subtotalWithGst = amount + gstAmount;
    const discountPercent = quotation.defaultDiscount || 0;
    const discountAmount = (amount * discountPercent) / 100;
    const grandTotalItem = subtotalWithGst - discountAmount;

    const newIndex = items.length;
    const newItem: ProjectItemLocal = {
      id: Date.now().toString(),
      quotationId: quotation.id,
      quotationCode: quotation.partCode,
      quotationName: quotation.name,
      description: quotation.description,
      images: quotation.images || [],
      woodId: null,
      woodName: null,
      polishId: null,
      polishName: null,
      fabricId: null,
      fabricName: null,
      basePrice: quotation.basePrice,
      discountPercent,
      discountAmount,
      finalPrice: quotation.basePrice,
      quantity,
      total: amount,
      gstPercent: quotation.gstPercent,
      igst: 0,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      totalWithGst: grandTotalItem,
      notes: quotation.description
        ? quotation.description.split(".").filter(Boolean)
        : [],
      itemNumber: newIndex + 1,
      uniqueNumber: generateQuotationUniqueNumber(projectNo, newIndex),
      length: quotation.length,
      width: quotation.width,
      specialNote: "",
    };

    setItems((prev) => [...prev, newItem]);
    setNewlyAddedItemId(newItem.id);

    // Reset filters
    setFilterCategory("");
    setFilterCategoryNo("");
    setFilterType("");
    setFilterVariant("");
    setMatchedQuotation(null);

    toast.success("Quotation added to project");
  };

  useEffect(() => {
    if (newlyAddedItemId) {
      const timer = setTimeout(() => {
        scrollToItem(newlyAddedItemId);
        setNewlyAddedItemId(null);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [newlyAddedItemId, items]);

  const scrollToItem = useCallback((itemId: string) => {
    setHighlightedItemId(itemId);
    const el = itemRefs.current.get(itemId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedItemId(null), 2500);
  }, []);

  /* ── Totals ── */
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalGst = items.reduce(
    (sum, item) => sum + item.cgst + item.sgst + item.igst,
    0,
  );
  const totalCgst = items.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgst, 0);
  const totalIgst = items.reduce((sum, item) => sum + item.igst, 0);
  const subtotal = totalAmount + totalGst;
  const totalDiscount = items.reduce(
    (sum, item) => sum + item.discountAmount,
    0,
  );
  const grandTotal = subtotal - totalDiscount;

  /* ── Build Payload ── */
  const buildPayload = (status: "draft" | "sent") => ({
    date: new Date().toISOString().split("T")[0],
    customerId,
    projectName: projectName || null,
    salesPersonId: salesPersonId || null,
    deliveryAddress: deliverySameAsBilling
      ? null
      : deliveryAddr.address || null,
    deliveryLandmark: deliverySameAsBilling
      ? null
      : deliveryAddr.landmark || null,
    deliveryCity: deliverySameAsBilling ? null : deliveryAddr.city || null,
    deliveryState: deliverySameAsBilling ? null : deliveryAddr.state || null,
    deliveryPincode: deliverySameAsBilling
      ? null
      : deliveryAddr.pincode || null,
    subtotal: Number(totalAmount) || 0,
    totalDiscount: Number(totalDiscount) || 0,
    igst: Number(totalIgst) || 0,
    cgst: Number(totalCgst) || 0,
    sgst: Number(totalSgst) || 0,
    grandTotal: Number(totalAmount) || 0,
    grandTotalWithGst: Number(grandTotal) || 0,
    status,
    items: items.map((item) => ({
      quotationId: item.quotationId,
      quotationCode: item.quotationCode,
      quotationName: item.quotationName,
      description: item.description,
      images: item.images || [],
      woodId: item.woodId || null,
      woodName: item.woodName || null,
      polishId: item.polishId || null,
      polishName: item.polishName || null,
      fabricId: item.fabricId || null,
      fabricName: item.fabricName || null,
      basePrice: Number(item.basePrice) || 0,
      discountPercent: Number(item.discountPercent) || 0,
      discountAmount: Number(item.discountAmount) || 0,
      finalPrice: Number(item.finalPrice) || 0,
      quantity: Number(item.quantity) || 1,
      total: Number(item.total) || 0,
      gstPercent: Number(item.gstPercent) || 18,
      igst: Number(item.igst) || 0,
      cgst: Number(item.cgst) || 0,
      sgst: Number(item.sgst) || 0,
      totalWithGst: Number(item.totalWithGst) || 0,
      notes: item.notes || [],
      specialNote: item.specialNote || null,
    })),
  });

  /* ── Save ── */
  const handleSave = async (sendEmail: boolean = false) => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one quotation");
      return;
    }
    setSaving(true);
    try {
      const status = sendEmail ? "sent" : "draft";
      const payload = buildPayload(status as "draft" | "sent");
      let saved;
      if (existingProject) {
        saved = await updateProject(existingProject.id, payload);
        toast.success("Project updated");
      } else {
        saved = await createProject(payload);
        toast.success("Project created");
      }
      if (sendEmail) {
        setSavedProject(saved);
        setShowEmailModal(true);
      } else {
        navigate("/projects");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }
    setStep(2);
  };

  if (pageLoading) return <FormPageSkeleton />;

  return (
    <div className="space-y-0 animate-fade-in">
      {/* Header */}
      <div className="page-header mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              step === 2 && !existingProject
                ? setStep(1)
                : navigate("/projects")
            }
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-row gap-2">
            <h1 className="page-title">
              {existingProject
                ? `Edit ${existingProject.projectNo}`
                : "Create Project"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {existingProject
                ? "Update project details"
                : `New Project: ${projectNo}`}
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

      {/* ===== STEP 1 ===== */}
      {step === 1 && (
        <div className="space-y-6 max-w-3xl">
          {/* Company Details */}
          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Company Details</h2>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-semibold">Ecstatics Spaces India Pvt. Ltd.</p>
              <p className="text-muted-foreground">
                3120, Ganga Trueno, Airport Road, Viman Nagar, Pune
              </p>
              <p className="text-muted-foreground">GST No: 27AAFCE9942B1ZM</p>
              <p className="text-muted-foreground">
                (+91) 7066466060 | info@esipl.in
              </p>
            </div>
          </div>

          {/* Project Name */}
          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Project Details</h2>
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name (e.g., Living Room Furniture, Office Setup)"
                className="h-11"
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="rounded-lg border bg-card overflow-visible p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Customer Information</h2>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => navigate("/customers/new")}
              >
                <Plus className="h-3.5 w-3.5" /> Add New Customer
              </Button>
            </div>
            <div className="form-grid">
              <div className="space-y-2 lg:col-span-2">
                <Label>Search & Select Customer *</Label>
                <CustomerSearchSelect
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder="Search customer by name or mobile..."
                />
              </div>
              <div className="space-y-2">
                <Label>Sales Manager</Label>
                <Select
                  value={
                    existingProject
                      ? salesPersonId
                      : user?.id && salesPersons.some((sp) => sp.id === user.id)
                        ? user.id
                        : salesPersonId
                  }
                  onValueChange={setSalesPersonId}
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales person" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesPersons.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Details + Addresses */}
            {selectedCustomer && (
              <div className="mt-4 space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Customer Details
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() =>
                        navigate(`/customers/edit/${selectedCustomer.id}`)
                      }
                    >
                      <Edit className="h-3 w-3" /> Edit Customer
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <p className="font-medium">{selectedCustomer.mobile}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">GSTIN</p>
                      <p className="font-medium font-mono">
                        {selectedCustomer.gstin || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-lg p-4 text-sm border border-blue-200/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                      Billing Address
                    </span>
                  </div>
                  <p className="font-medium">
                    {billingAddressString || "No billing address on file"}
                  </p>
                </div>

                {/* Delivery Address */}
                <div className="bg-green-50/50 dark:bg-green-950/10 rounded-lg p-4 text-sm border border-green-200/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">
                        Delivery Address
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => setShowDeliveryEditor(!showDeliveryEditor)}
                    >
                      <Edit className="h-3 w-3" />
                      {showDeliveryEditor
                        ? "Close"
                        : deliverySameAsBilling
                          ? "Add Different Address"
                          : "Edit"}
                    </Button>
                  </div>
                  {!showDeliveryEditor && (
                    <p className="font-medium">
                      {deliverySameAsBilling
                        ? "Same as billing address"
                        : [
                          deliveryAddr.address,
                          deliveryAddr.landmark,
                          deliveryAddr.city,
                          deliveryAddr.state,
                          deliveryAddr.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Not specified"}
                    </p>
                  )}
                  {showDeliveryEditor && (
                    <DeliveryAddressEditor
                      deliverySameAsBilling={deliverySameAsBilling}
                      onToggleSame={(checked) => {
                        setDeliverySameAsBilling(checked);
                        if (checked)
                          setDeliveryAddr({
                            address: "",
                            landmark: "",
                            city: "",
                            state: "",
                            pincode: "",
                          });
                      }}
                      deliveryAddr={deliveryAddr}
                      onChangeField={(field, value) =>
                        setDeliveryAddr((prev) => ({ ...prev, [field]: value }))
                      }
                      billingAddress={billingAddressString}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleNextStep}
            className="btn-accent gap-2"
            disabled={!customerId}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ===== STEP 2 ===== */}
      {step === 2 && (
        <>
          {/* Sticky Customer Info Bar */}
          <div className="sticky top-0 z-30 bg-card border border-border shadow-sm mt-4 mb-0">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-5 min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Customer
                  </p>
                  <p className="font-semibold text-sm truncate">
                    {selectedCustomer?.name}
                  </p>
                </div>
                <div className="hidden sm:block min-w-0 border-l border-border pl-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Contact
                  </p>
                  <p className="text-sm truncate">{selectedCustomer?.mobile}</p>
                </div>
                <div className="hidden md:block min-w-0 border-l border-border pl-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    GSTIN
                  </p>
                  <p className="text-sm font-mono truncate">
                    {selectedCustomer?.gstin || "—"}
                  </p>
                </div>
                <div className="hidden lg:block min-w-0 border-l border-border pl-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Sales Manager
                  </p>
                  <p className="text-sm truncate">
                    {selectedSalesPerson?.name || "—"}
                  </p>
                </div>
                <div className="hidden xl:block min-w-0 border-l border-border pl-5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Delivery
                  </p>
                  <p className="text-sm truncate">
                    {deliverySameAsBilling
                      ? "Same as billing"
                      : deliveryAddr.city || deliveryAddr.address || "Custom"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Inline Editable Project Name Bar ── */}
          <InlineProjectName
            value={projectName}
            onChange={setProjectName}
            projectNo={projectNo}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Quotation List */}
            <div className="lg:col-span-3 space-y-5">
              {/* ══ NEW: 4-Field Filter Add Quotation Bar ══ */}
              <div className="sticky top-[60px] z-20 bg-card border border-border shadow-sm mb-6">
                <div className="px-4 py-3 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-accent" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Add Product by Code
                    </span>
                  </div>

                  {/* 4 Filter Dropdowns */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Category */}
                    <Select
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeCats.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Category No */}
                    <Select
                      value={filterCategoryNo}
                      onValueChange={setFilterCategoryNo}
                      disabled={!filterCategory}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="No" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCatNos.map((cn) => (
                          <SelectItem key={cn.id} value={cn.id}>
                            {cn.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Type */}
                    <Select
                      value={filterType}
                      onValueChange={setFilterType}
                      disabled={!filterCategory}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTypes.map((qt) => (
                          <SelectItem key={qt.id} value={qt.id}>
                            {qt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Variant */}
                    <Select
                      value={filterVariant}
                      onValueChange={setFilterVariant}
                      disabled={!filterCategory}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeVariants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Match Result + Add Button */}
                  {filterCategory &&
                    filterCategoryNo &&
                    filterType &&
                    filterVariant && (
                      <div className="flex items-center gap-3 pt-1">
                        {matchLoading ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Searching...
                          </div>
                        ) : matchedQuotation ? (
                          <>
                            <div className="flex items-center gap-3 flex-1 min-w-0 bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
                              {matchedQuotation.images?.[0] && (
                                <div className="w-12 aspect-[16/9] rounded overflow-hidden border bg-muted flex-shrink-0">
                                  <img
                                    src={getQuotationImageUrl(
                                      matchedQuotation.images[0],
                                    )}
                                    alt={matchedQuotation.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold font-mono text-accent truncate">
                                  {matchedQuotation.partCode}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {matchedQuotation.name}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-accent flex-shrink-0">
                                {formatCurrency(matchedQuotation.basePrice)}
                              </span>
                            </div>
                            <Button
                              onClick={handleAddMatchedQuotation}
                              className="btn-accent gap-2 flex-shrink-0 h-10"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="hidden sm:inline">Add Cart</span>
                            </Button>
                          </>
                        ) : (
                          <div className="flex-1 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2 text-center">
                            No matching product found for this combination
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="border border-dashed border-border p-14 text-center">
                  <Package className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-1">
                    No quotations added
                  </h3>
                  <p className="text-muted-foreground text-sm mb-5">
                    Use the filter dropdowns above to find and add products to
                    your project
                  </p>
                </div>
              ) : (
                items.map((item, index) => (
                  <QuotationCard
                    key={item.id}
                    ref={(el) => {
                      if (el) itemRefs.current.set(item.id, el);
                      else itemRefs.current.delete(item.id);
                    }}
                    item={item}
                    index={index}
                    isHighlighted={highlightedItemId === item.id}
                    onUpdateItem={updateItem}
                    onUpdateMaterial={updateItemMaterial}
                    onRemoveItem={removeItem}
                    onDiscountChange={handleDiscountChange}
                    salesManager={selectedSalesPerson?.name}
                    discountRange={discountRange}
                  />
                ))
              )}
            </div>

            {/* Right Summary Panel */}
            <div className="lg:col-span-1">
              <div className="form-section sticky top-[62px]">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Calculator className="h-4 w-4" /> Summary
                </h2>

                {items.length > 0 && (
                  <div className="space-y-0.5 mb-4 max-h-52 overflow-y-auto border border-border">
                    {items.map((item, i) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToItem(item.id)}
                        className={`w-full text-left px-2.5 py-2 transition-all text-xs flex items-center gap-2 border-b border-border/50 last:border-b-0 ${highlightedItemId === item.id
                            ? "bg-primary/10 border-l-2 border-l-primary"
                            : "hover:bg-muted/60"
                          }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {item.itemNumber || i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[11px] leading-tight">
                            {item.quotationName}
                          </p>
                          <p className="text-muted-foreground font-mono text-[9px]">
                            {item.uniqueNumber || item.quotationCode}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold tabular-nums text-accent flex-shrink-0">
                          {formatCurrency(item.totalWithGst || 0)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Add quotations to see summary
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">
                        Amount ({items.length}{" "}
                        {items.length === 1 ? "item" : "items"})
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="space-y-1 border-b border-border pb-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST</span>
                        <span className="tabular-nums">
                          {formatCurrency(totalCgst)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST</span>
                        <span className="tabular-nums">
                          {formatCurrency(totalSgst)}
                        </span>
                      </div>
                      {totalIgst > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IGST</span>
                          <span className="tabular-nums">
                            {formatCurrency(totalIgst)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-1">
                        <span className="text-muted-foreground">Total GST</span>
                        <span className="text-blue-600 tabular-nums">
                          +{formatCurrency(totalGst)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-b border-border pb-2">
                      <span>Subtotal</span>
                      <span className="tabular-nums">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-semibold text-destructive tabular-nums">
                        -{formatCurrency(totalDiscount)}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-base font-bold">
                        <span>Grand Total</span>
                        <span className="text-accent tabular-nums">
                          {formatCurrency(grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mt-5 pt-4 border-t border-border">
                  <Button
                    onClick={() => handleSave(false)}
                    variant="outline"
                    className="w-full text-xs h-9"
                    disabled={items.length === 0 || saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-2" />
                    )}
                    {saving ? "Saving..." : "Save as Draft"}
                  </Button>
                  {hasPermission("project:send") && (
                    <Button
                      onClick={() => handleSave(true)}
                      className="w-full btn-accent text-xs h-9"
                      disabled={items.length === 0 || !customerId || saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />{" "}
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 mr-2" /> Save & Send
                          Email
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setPendingDiscountEdit(null);
        }}
        onVerify={handleOTPVerify}
        title="Discount Edit Approval"
        description="OTP verification required to modify discount percentage"
        type="discount"
        entityId={pendingDiscountEdit?.itemId}
        entityType="discount_override"
        entityName={
          pendingItem
            ? `${pendingItem.quotationName} - ${pendingDiscountEdit?.newDiscount}%`
            : undefined
        }
      />

      {/* Email Send Modal */}
      <EmailSendModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        project={savedProject}
        customer={selectedCustomer}
        salesPerson={selectedSalesPerson}
        grandTotal={grandTotal}
        items={items}
      />
    </div>
  );
};

export default ProjectForm;
