import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Check,
  Clock,
  X,
  Image as ImageIcon,
  Edit2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import OTPModal from "@/components/common/OTPModal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { toast } from "sonner";

import { useCategories, Category } from "@/hooks/useCategories";
import { useQuotationTypes, QuotationType } from "@/hooks/useQuotationTypes";
import { useQuotationModels, QuotationModel } from "@/hooks/useQuotationModels";
import { useWoods, Wood } from "@/hooks/useWoods";
import { usePolishes, Polish } from "@/hooks/usePolishes";
import { useFabrics, Fabric } from "@/hooks/useFabrics";
import {
  useQuotations,
  Quotation,
  getQuotationImageUrl,
} from "@/hooks/useQuotations";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PAGE_LIMIT = 10;

// ── Skeleton Components ──
const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => (
  <>
    {Array.from({ length: 5 }).map((_, rowIdx) => (
      <tr key={rowIdx} className="animate-pulse">
        {Array.from({ length: columns }).map((_, colIdx) => (
          <td key={colIdx}>
            <div
              className={`h-4 bg-muted rounded ${
                colIdx === 0 ? "w-32" : "w-20"
              }`}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

const QuotationTableSkeleton: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td>
          <div className="w-10 h-10 bg-muted rounded" />
        </td>
        <td>
          <div className="h-4 bg-muted rounded w-16" />
        </td>
        <td>
          <div className="h-4 bg-muted rounded w-28" />
        </td>
        <td className="hidden md:table-cell">
          <div className="h-4 bg-muted rounded w-20" />
        </td>
        <td className="hidden lg:table-cell">
          <div className="h-4 bg-muted rounded w-16" />
        </td>
        <td>
          <div className="h-5 bg-muted rounded w-14" />
        </td>
        <td>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

const Masters: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { hasPermission, user } = useAuth();

  // Hooks
  const {
    categories,
    meta: categoriesMeta,
    loading: categoriesLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const {
    quotationTypes,
    meta: quotationTypesMeta,
    loading: quotationTypesLoading,
    fetchQuotationTypes,
    createQuotationType,
    updateQuotationType,
    deleteQuotationType,
  } = useQuotationTypes();

  const {
    quotationModels,
    meta: quotationModelsMeta,
    loading: quotationModelsLoading,
    fetchQuotationModels,
    createQuotationModel,
    updateQuotationModel,
    deleteQuotationModel,
  } = useQuotationModels();

  const {
    woods,
    meta: woodsMeta,
    loading: woodsLoading,
    fetchWoods,
    createWood,
    updateWood,
    deleteWood,
  } = useWoods();

  const {
    polishes,
    meta: polishesMeta,
    loading: polishesLoading,
    fetchPolishes,
    createPolish,
    updatePolish,
    deletePolish,
  } = usePolishes();

  const {
    fabrics,
    meta: fabricsMeta,
    loading: fabricsLoading,
    fetchFabrics,
    createFabric,
    updateFabric,
    deleteFabric,
  } = useFabrics();

  const {
    quotations,
    meta: quotationsMeta,
    loading: quotationsLoading,
    fetchQuotations,
    createQuotation,
    updateQuotation,
    deleteQuotation,
  } = useQuotations();

  const tabParam = searchParams.get("tab");
  const validTabs = [
    "category",
    "quotationType",
    "quotationModel",
    "wood",
    "polish",
    "fabric",
    "quotation",
  ];
  const initialTab =
    tabParam && validTabs.includes(tabParam) ? tabParam : "category";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [selectedParent, setSelectedParent] = useState("");
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit modal state for simple masters
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editSelectedParent, setEditSelectedParent] = useState("");

  // Search / Filter / Pagination state per tab
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({
    category: "",
    quotationType: "",
    quotationModel: "",
    wood: "",
    polish: "",
    fabric: "",
    quotation: "",
  });
  const [statusFilters, setStatusFilters] = useState<Record<string, string>>({
    category: "",
    quotationType: "",
    quotationModel: "",
    wood: "",
    polish: "",
    fabric: "",
    quotation: "",
  });
  const [currentPages, setCurrentPages] = useState<Record<string, number>>({
    category: 1,
    quotationType: 1,
    quotationModel: 1,
    wood: 1,
    polish: 1,
    fabric: 1,
    quotation: 1,
  });

  // Debounce timer
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    loading: false,
  });

  // Update tab when URL changes
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch helper that respects search/filter/page
  const fetchTabData = useCallback(
    (tab: string, page?: number, search?: string, status?: string) => {
      const p = page ?? currentPages[tab] ?? 1;
      const s = search ?? searchQueries[tab] ?? "";
      const st = status ?? statusFilters[tab] ?? "";
      const params: any = { page: p, limit: PAGE_LIMIT };
      if (s) params.search = s;
      if (st) params.status = st;

      switch (tab) {
        case "category":
          return fetchCategories(params);
        case "quotationType":
          return fetchQuotationTypes(params);
        case "quotationModel":
          return fetchQuotationModels(params);
        case "wood":
          return fetchWoods(params);
        case "polish":
          return fetchPolishes(params);
        case "fabric":
          return fetchFabrics(params);
        case "quotation":
          return fetchQuotations(params);
      }
    },
    [
      currentPages,
      searchQueries,
      statusFilters,
      fetchCategories,
      fetchQuotationTypes,
      fetchQuotationModels,
      fetchWoods,
      fetchPolishes,
      fetchFabrics,
      fetchQuotations,
    ],
  );

  // Initial load + refetch on tab/page/filter change
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, currentPages[activeTab], statusFilters[activeTab]]);

  // Also load categories & quotationTypes always (for dropdowns)
  useEffect(() => {
    fetchCategories({ limit: 1000 });
    fetchQuotationTypes({ limit: 1000 });
    fetchQuotationModels({ limit: 1000 });
    fetchWoods({ limit: 1000 });
    fetchPolishes({ limit: 1000 });
    fetchFabrics({ limit: 1000 });
  }, []);

  // Search with debounce
  const handleSearchChange = (tab: string, value: string) => {
    setSearchQueries((prev) => ({ ...prev, [tab]: value }));
    setCurrentPages((prev) => ({ ...prev, [tab]: 1 }));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchTabData(tab, 1, value, statusFilters[tab]);
    }, 400);
  };

  // Status filter
  const handleStatusChange = (tab: string, value: string) => {
    const actualValue = value === "all" ? "" : value;
    setStatusFilters((prev) => ({ ...prev, [tab]: actualValue }));
    setCurrentPages((prev) => ({ ...prev, [tab]: 1 }));
  };

  // Pagination
  const handlePageChange = (tab: string, page: number) => {
    setCurrentPages((prev) => ({ ...prev, [tab]: page }));
  };

  const refreshCurrentTab = async () => {
    await fetchTabData(activeTab);
  };

  // Quotation form state
  const [showQuotationForm, setShowQuotationForm] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(
    null,
  );
  const [quotationForm, setQuotationForm] = useState({
    name: "",
    partCode: "",
    categoryId: "",
    quotationTypeId: "",
    quotationModelId: "",
    woodId: "",
    polishId: "",
    fabricId: "",
    length: 0,
    width: 0,
    height: 0,
    description: "",
    basePrice: 0,
    defaultDiscount: 15,
    gstPercent: 18,
  });
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const resetQuotationForm = () => {
    setQuotationForm({
      name: "",
      partCode: "",
      categoryId: "",
      quotationTypeId: "",
      quotationModelId: "",
      woodId: "",
      polishId: "",
      fabricId: "",
      length: 0,
      width: 0,
      height: 0,
      description: "",
      basePrice: 0,
      defaultDiscount: 15,
      gstPercent: 18,
    });
    setEditingQuotation(null);
    setSelectedFiles([]);
    setImagePreviewUrls([]);
    setExistingImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Add simple master
  const handleAdd = async () => {
    if (!newItemName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setSubmitting(true);
    try {
      let newItem: any;
      switch (activeTab) {
        case "category":
          newItem = await createCategory({
            name: newItemName,
            status: "pending",
          });
          break;
        case "quotationType":
          if (!selectedParent) {
            toast.error("Please select a category");
            setSubmitting(false);
            return;
          }
          newItem = await createQuotationType({
            name: newItemName,
            categoryId: selectedParent,
            status: "pending",
          });
          break;
        case "quotationModel":
          if (!selectedParent) {
            toast.error("Please select a quotation type");
            setSubmitting(false);
            return;
          }
          newItem = await createQuotationModel({
            name: newItemName,
            quotationTypeId: selectedParent,
            status: "pending",
          });
          break;
        case "wood":
          newItem = await createWood({
            name: newItemName,
            status: "pending",
          });
          break;
        case "polish":
          newItem = await createPolish({
            name: newItemName,
            status: "pending",
          });
          break;
        case "fabric":
          newItem = await createFabric({
            name: newItemName,
            status: "pending",
          });
          break;
      }
      setPendingItem({ ...newItem, type: activeTab });
      setShowAddModal(false);
      setNewItemName("");
      setSelectedParent("");
      setShowOTPModal(true);
      await refreshCurrentTab();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit simple master
  const handleEditClick = (item: any, type: string) => {
    setEditingItem({ ...item, type });
    setEditItemName(item.name);
    if (type === "quotationType") {
      setEditSelectedParent(item.categoryId || "");
    } else if (type === "quotationModel") {
      setEditSelectedParent(item.quotationTypeId || "");
    } else {
      setEditSelectedParent("");
    }
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editItemName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    setSubmitting(true);
    try {
      const updateData: any = { name: editItemName };
      if (editingItem.type === "quotationType" && editSelectedParent) {
        updateData.categoryId = editSelectedParent;
      }
      if (editingItem.type === "quotationModel" && editSelectedParent) {
        updateData.quotationTypeId = editSelectedParent;
      }

      const updateFn: Record<string, Function> = {
        category: updateCategory,
        quotationType: updateQuotationType,
        quotationModel: updateQuotationModel,
        wood: updateWood,
        polish: updatePolish,
        fabric: updateFabric,
      };

      await updateFn[editingItem.type]?.(editingItem.id, updateData);
      toast.success(`${getTabLabel(editingItem.type)} updated successfully`);
      setShowEditModal(false);
      setEditingItem(null);
      setEditItemName("");
      setEditSelectedParent("");
      await refreshCurrentTab();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  // Image handling
  const handleAddFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setImagePreviewUrls((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Quotation submit
  const handleQuotationSubmit = async () => {
    if (!quotationForm.name.trim()) {
      toast.error("Please enter quotation name");
      return;
    }
    if (!quotationForm.partCode.trim()) {
      toast.error("Please enter part code");
      return;
    }
    if (!quotationForm.categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!quotationForm.quotationTypeId) {
      toast.error("Please select a quotation type");
      return;
    }
    if (quotationForm.basePrice <= 0) {
      toast.error("Please enter a valid base price");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", quotationForm.name);
      formData.append("partCode", quotationForm.partCode);
      formData.append("categoryId", quotationForm.categoryId);
      formData.append("quotationTypeId", quotationForm.quotationTypeId);
      if (quotationForm.quotationModelId)
        formData.append("quotationModelId", quotationForm.quotationModelId);
      if (quotationForm.woodId) formData.append("woodId", quotationForm.woodId);
      if (quotationForm.polishId)
        formData.append("polishId", quotationForm.polishId);
      if (quotationForm.fabricId)
        formData.append("fabricId", quotationForm.fabricId);
      formData.append("length", String(quotationForm.length));
      formData.append("width", String(quotationForm.width));
      formData.append("height", String(quotationForm.height));
      formData.append("description", quotationForm.description);
      formData.append("basePrice", String(quotationForm.basePrice));
      formData.append("defaultDiscount", String(quotationForm.defaultDiscount));
      formData.append("gstPercent", String(quotationForm.gstPercent));
      formData.append("status", "pending");

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });
      if (existingImages.length > 0) {
        formData.append("existingImages", JSON.stringify(existingImages));
      }

      if (editingQuotation) {
        await updateQuotation(editingQuotation.id, formData);
        toast.success("Quotation updated successfully");
      } else {
        const newQuotation = await createQuotation(formData);
        setPendingItem({ ...newQuotation, type: "quotation" });
        setShowOTPModal(true);
      }
      setShowQuotationForm(false);
      resetQuotationForm();
      await refreshCurrentTab();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setQuotationForm({
      name: quotation.name,
      partCode: quotation.partCode,
      categoryId: quotation.categoryId,
      quotationTypeId: quotation.quotationTypeId,
      quotationModelId: quotation.quotationModelId || "",
      woodId: quotation.woodId || "",
      polishId: quotation.polishId || "",
      fabricId: quotation.fabricId || "",
      length: quotation.length,
      width: quotation.width,
      height: quotation.height,
      description: quotation.description,
      basePrice: quotation.basePrice,
      defaultDiscount: quotation.defaultDiscount,
      gstPercent: quotation.gstPercent,
    });
    setExistingImages(
      quotation.images && quotation.images.length > 0
        ? [...quotation.images]
        : [],
    );
    setSelectedFiles([]);
    setImagePreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowQuotationForm(true);
  };

  // OTP
  const handleOTPVerify = async (otp: string, otpLogId: string) => {
    if (pendingItem) {
      try {
        const updateFn: Record<string, Function> = {
          category: updateCategory,
          quotationType: updateQuotationType,
          quotationModel: updateQuotationModel,
          wood: updateWood,
          polish: updatePolish,
          fabric: updateFabric,
          quotation: updateQuotation,
        };

        await updateFn[pendingItem.type]?.(pendingItem.id, {
          status: "active",
        });
        toast.success(`${pendingItem.name} activated successfully`);
        await refreshCurrentTab();
      } catch (error: any) {
        toast.error(error?.message || "Failed to activate item");
      }
    }
    setShowOTPModal(false);
    setPendingItem(null);
  };

  // Delete with custom confirm
  const handleDelete = (id: string, type: string, itemName?: string) => {
    const label = itemName || "this item";
    setConfirmDialog({
      open: true,
      title: `Delete ${getTabLabel(type)}`,
      description: `Are you sure you want to delete "${label}"? This action cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const deleteFn: Record<string, Function> = {
            category: deleteCategory,
            quotationType: deleteQuotationType,
            quotationModel: deleteQuotationModel,
            wood: deleteWood,
            polish: deletePolish,
            fabric: deleteFabric,
            quotation: deleteQuotation,
          };
          await deleteFn[type]?.(id);
          toast.success("Item deleted successfully");
          await refreshCurrentTab();
        } catch (error: any) {
          toast.error(error?.message || "Failed to delete item");
        } finally {
          setConfirmDialog((prev) => ({
            ...prev,
            open: false,
            loading: false,
          }));
        }
      },
    });
  };

  // Helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
      return imagePath;
    return `${API_BASE_URL}/${imagePath}`;
  };

  const filteredQuotationTypes = quotationTypes.filter(
    (qt) =>
      qt.categoryId === quotationForm.categoryId && qt.status === "active",
  );
  const filteredQuotationModels = quotationModels.filter(
    (qm) =>
      qm.quotationTypeId === quotationForm.quotationTypeId &&
      qm.status === "active",
  );

  const getTabLabel = (tab: string) => {
    const labels: Record<string, string> = {
      category: "Category",
      quotationType: "Product Type",
      quotationModel: "Product Model",
      wood: "Wood",
      polish: "Polish",
      fabric: "Fabric",
      quotation: "Products",
    };
    return labels[tab] || tab;
  };

  const handleAddClick = () => {
    if (activeTab === "quotation") {
      resetQuotationForm();
      setShowQuotationForm(true);
    } else setShowAddModal(true);
  };

  // Get meta/loading for tab
  const getMetaForTab = (tab: string) => {
    switch (tab) {
      case "category":
        return categoriesMeta;
      case "quotationType":
        return quotationTypesMeta;
      case "quotationModel":
        return quotationModelsMeta;
      case "wood":
        return woodsMeta;
      case "polish":
        return polishesMeta;
      case "fabric":
        return fabricsMeta;
      case "quotation":
        return quotationsMeta;
      default:
        return null;
    }
  };

  const getLoadingForTab = (tab: string) => {
    switch (tab) {
      case "category":
        return categoriesLoading;
      case "quotationType":
        return quotationTypesLoading;
      case "quotationModel":
        return quotationModelsLoading;
      case "wood":
        return woodsLoading;
      case "polish":
        return polishesLoading;
      case "fabric":
        return fabricsLoading;
      case "quotation":
        return quotationsLoading;
      default:
        return false;
    }
  };

  // Pagination Component
  const renderPagination = (tab: string, meta: any) => {
    if (!meta || meta.totalPages <= 1) return null;
    const page = currentPages[tab] || 1;
    const totalPages = meta.totalPages || 1;
    const totalCount = meta.totalCount || meta.totalItems || 0;

    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * PAGE_LIMIT + 1}–
          {Math.min(page * PAGE_LIMIT, totalCount)} of {totalCount} items
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(tab, page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {start > 1 && (
            <>
              <Button
                variant={page === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(tab, 1)}
              >
                1
              </Button>
              {start > 2 && (
                <span className="px-1 text-muted-foreground">…</span>
              )}
            </>
          )}
          {pages.map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(tab, p)}
            >
              {p}
            </Button>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && (
                <span className="px-1 text-muted-foreground">…</span>
              )}
              <Button
                variant={page === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(tab, totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(tab, page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Search + Filter Bar
  const renderSearchBar = (tab: string) => (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQueries[tab]}
          onChange={(e) => handleSearchChange(tab, e.target.value)}
          placeholder={`Search ${getTabLabel(tab).toLowerCase()}...`}
          className="pl-10 h-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={statusFilters[tab] || "all"}
          onValueChange={(v) => handleStatusChange(tab, v)}
        >
          <SelectTrigger className="w-[140px] h-10">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render simple master table (with edit icon added)
  const renderTable = (items: any[], type: string, parentKey?: string) => {
    const isLoading = getLoadingForTab(type);
    const meta = getMetaForTab(type);
    const colCount = parentKey ? 4 : 3;

    return (
      <div>
        {renderSearchBar(type)}
        <div className="enterprise-card overflow-hidden">
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {parentKey && (
                    <th className="hidden sm:table-cell">Parent</th>
                  )}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <TableRowSkeleton columns={colCount} />
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colCount}
                      className="text-center text-muted-foreground py-12"
                    >
                      No items found.{" "}
                      {!searchQueries[type] && !statusFilters[type]
                        ? "Add your first item."
                        : "Try different filters."}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.name}</td>
                      {parentKey && (
                        <td className="hidden sm:table-cell text-muted-foreground">
                          {type === "quotationType"
                            ? categories.find((c) => c.id === item.categoryId)
                                ?.name
                            : quotationTypes.find(
                                (qt) => qt.id === item.quotationTypeId,
                              )?.name}
                        </td>
                      )}
                      <td>
                        <span
                          className={
                            item.status === "active"
                              ? "badge-success"
                              : "badge-warning"
                          }
                        >
                          {item.status === "active" ? (
                            <>
                              <Check className="h-3 w-3" /> Active
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {item.status === "pending" &&
                            hasPermission("master:manage") && (
                              <button
                                onClick={() => {
                                  setPendingItem({
                                    ...item,
                                    type,
                                  });
                                  setShowOTPModal(true);
                                }}
                                className="text-xs text-accent hover:underline font-medium"
                              >
                                Activate
                              </button>
                            )}
                          {hasPermission("master:manage") && (
                            <>
                              <button
                                onClick={() => handleEditClick(item, type)}
                                className="action-btn"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(item.id, type, item.name)
                                }
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
          {renderPagination(type, meta)}
        </div>
      </div>
    );
  };

  // Quotations table (formerly products table)
  const renderQuotationsTable = () => {
    const meta = quotationsMeta;

    return (
      <div>
        {renderSearchBar("quotation")}
        <div className="enterprise-card overflow-hidden">
          <div className="table-container">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th className="hidden md:table-cell">Category</th>
                  <th className="hidden lg:table-cell">Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotationsLoading ? (
                  <QuotationTableSkeleton />
                ) : quotations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-muted-foreground py-12"
                    >
                      No products found.{" "}
                      {!searchQueries.quotation && !statusFilters.quotation
                        ? "Add your first quotation."
                        : "Try different filters."}
                    </td>
                  </tr>
                ) : (
                  quotations.map((quotation) => (
                    <tr key={quotation.id}>
                      <td>
                        <div className="w-24 aspect-[16/9] rounded overflow-hidden bg-muted">
                          {quotation.images && quotation.images[0] ? (
                            <img
                              src={getImageUrl(quotation.images[0])}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-xs">
                        {quotation.partCode}
                      </td>
                      <td className="font-medium max-w-[150px] truncate">
                        {quotation.name}
                      </td>
                      <td className="hidden md:table-cell text-muted-foreground">
                        {categories.find((c) => c.id === quotation.categoryId)
                          ?.name || "-"}
                      </td>
                      <td className="hidden lg:table-cell">
                        {formatCurrency(quotation.basePrice)}
                      </td>
                      <td>
                        <span
                          className={
                            quotation.status === "active"
                              ? "badge-success"
                              : "badge-warning"
                          }
                        >
                          {quotation.status === "active" ? (
                            <>
                              <Check className="h-3 w-3" /> Active
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" /> Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {quotation.status === "pending" && (
                            <button
                              onClick={() => {
                                setPendingItem({
                                  ...quotation,
                                  type: "quotation",
                                });
                                setShowOTPModal(true);
                              }}
                              className="text-xs text-accent hover:underline font-medium"
                            >
                              Activate
                            </button>
                          )}
                          {hasPermission("master:manage") && (
                            <>
                              <button
                                onClick={() => handleEditQuotation(quotation)}
                                className="action-btn"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(
                                    quotation.id,
                                    "quotation",
                                    quotation.name,
                                  )
                                }
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
          {renderPagination("quotation", meta)}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Master Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage categories, product types, materials, and products
          </p>
        </div>
        {hasPermission("master:manage") && (
          <Button className="btn-accent gap-2" onClick={handleAddClick}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              Add {getTabLabel(activeTab)}
            </span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto">
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="quotationType">Type</TabsTrigger>
            <TabsTrigger value="quotationModel">Model</TabsTrigger>
            <TabsTrigger value="wood">Wood</TabsTrigger>
            <TabsTrigger value="polish">Polish</TabsTrigger>
            <TabsTrigger value="fabric">Fabric</TabsTrigger>
            <TabsTrigger value="quotation">Products</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="category">
          {renderTable(categories, "category")}
        </TabsContent>
        <TabsContent value="quotationType">
          {renderTable(quotationTypes, "quotationType", "categoryId")}
        </TabsContent>
        <TabsContent value="quotationModel">
          {renderTable(quotationModels, "quotationModel", "quotationTypeId")}
        </TabsContent>
        <TabsContent value="wood">{renderTable(woods, "wood")}</TabsContent>
        <TabsContent value="polish">
          {renderTable(polishes, "polish")}
        </TabsContent>
        <TabsContent value="fabric">
          {renderTable(fabrics, "fabric")}
        </TabsContent>
        <TabsContent value="quotation">{renderQuotationsTable()}</TabsContent>
      </Tabs>

      {/* Add Modal for simple masters */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Add {getTabLabel(activeTab)}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              {activeTab === "quotationType" && (
                <div className="space-y-2">
                  <Label>Select Category</Label>
                  <Select
                    value={selectedParent}
                    onValueChange={setSelectedParent}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.status === "active")
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {activeTab === "quotationModel" && (
                <div className="space-y-2">
                  <Label>Select Product Type</Label>
                  <Select
                    value={selectedParent}
                    onValueChange={setSelectedParent}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select quotation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotationTypes
                        .filter((qt) => qt.status === "active")
                        .map((qt) => (
                          <SelectItem key={qt.id} value={qt.id}>
                            {qt.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Enter name"
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdd}
                  className="flex-1 h-11 btn-accent"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Adding...
                    </div>
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal for simple masters */}
      {showEditModal && editingItem && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Edit {getTabLabel(editingItem.type)}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              {editingItem.type === "quotationType" && (
                <div className="space-y-2">
                  <Label>Select Category</Label>
                  <Select
                    value={editSelectedParent}
                    onValueChange={setEditSelectedParent}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.status === "active")
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingItem.type === "quotationModel" && (
                <div className="space-y-2">
                  <Label>Select Product Type</Label>
                  <Select
                    value={editSelectedParent}
                    onValueChange={setEditSelectedParent}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select quotation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotationTypes
                        .filter((qt) => qt.status === "active")
                        .map((qt) => (
                          <SelectItem key={qt.id} value={qt.id}>
                            {qt.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  placeholder="Enter name"
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave();
                  }}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-11"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  className="flex-1 h-11 btn-accent"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </div>
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Form Modal */}
      {showQuotationForm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowQuotationForm(false)}
        >
          <div
            className="modal-content p-6 max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingQuotation ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={() => {
                  setShowQuotationForm(false);
                  resetQuotationForm();
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name *</Label>
                    <Input
                      value={quotationForm.name}
                      onChange={(e) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="e.g., Sectional Sofa - Living Room"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Part Code *</Label>
                    <Input
                      value={quotationForm.partCode}
                      onChange={(e) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          partCode: e.target.value,
                        }))
                      }
                      placeholder="e.g., S00_Vx(Sx)"
                      className="h-11 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">
                  Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={quotationForm.categoryId}
                      onValueChange={(v) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          categoryId: v,
                          quotationTypeId: "",
                          quotationModelId: "",
                        }))
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c.status === "active")
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Type *</Label>
                    <Select
                      value={quotationForm.quotationTypeId}
                      onValueChange={(v) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          quotationTypeId: v,
                          quotationModelId: "",
                        }))
                      }
                      disabled={!quotationForm.categoryId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredQuotationTypes.map((qt) => (
                          <SelectItem key={qt.id} value={qt.id}>
                            {qt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Product Model</Label>
                    <Select
                      value={quotationForm.quotationModelId}
                      onValueChange={(v) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          quotationModelId: v,
                        }))
                      }
                      disabled={!quotationForm.quotationTypeId}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredQuotationModels.map((qm) => (
                          <SelectItem key={qm.id} value={qm.id}>
                            {qm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Materials */}
              {/* <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">
                  Materials (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Wood</Label>
                    <Select
                      value={quotationForm.woodId}
                      onValueChange={(v) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          woodId: v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select wood" />
                      </SelectTrigger>
                      <SelectContent>
                        {woods
                          .filter((w) => w.status === "active")
                          .map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Polish</Label>
                    <Select
                      value={quotationForm.polishId}
                      onValueChange={(v) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          polishId: v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select polish" />
                      </SelectTrigger>
                      <SelectContent>
                        {polishes
                          .filter((p) => p.status === "active")
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fabric</Label>
                    <Select
                      value={quotationForm.fabricId}
                      onValueChange={(v) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          fabricId: v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select fabric" />
                      </SelectTrigger>
                      <SelectContent>
                        {fabrics
                          .filter((f) => f.status === "active")
                          .map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div> */}

              {/* Dimensions */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">
                  Dimensions (mm)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {(["length", "width", "height"] as const).map((dim) => (
                    <div key={dim} className="space-y-2">
                      <Label>
                        {dim.charAt(0).toUpperCase() + dim.slice(1)}
                      </Label>
                      <Input
                        type="number"
                        value={quotationForm[dim] || ""}
                        onChange={(e) =>
                          setQuotationForm((prev) => ({
                            ...prev,
                            [dim]: Number(e.target.value),
                          }))
                        }
                        placeholder="0"
                        className="h-11"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground border-b border-border pb-2">
                  Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Base Price (₹) *</Label>
                    <Input
                      type="number"
                      value={quotationForm.basePrice || ""}
                      onChange={(e) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          basePrice: Number(e.target.value),
                        }))
                      }
                      placeholder="Enter price"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Discount (%)</Label>
                    <Input
                      type="number"
                      value={quotationForm.defaultDiscount}
                      onChange={(e) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          defaultDiscount: Number(e.target.value),
                        }))
                      }
                      min={0}
                      max={100}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>GST (%)</Label>
                    <Input
                      type="number"
                      value={quotationForm.gstPercent}
                      onChange={(e) =>
                        setQuotationForm((prev) => ({
                          ...prev,
                          gstPercent: Number(e.target.value),
                        }))
                      }
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={quotationForm.description}
                  onChange={(e) =>
                    setQuotationForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter product description..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Images Section */}
              <div className="space-y-6">
                <h3 className="font-medium text-foreground border-b border-border pb-2">
                  Images
                </h3>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-sm text-muted-foreground">
                      Current Images
                    </Label>

                    <div className="space-y-4">
                      {existingImages.map((img, idx) => (
                        <div key={`existing-${idx}`} className="relative group">
                          <div className="w-full aspect-video rounded-lg overflow-hidden border border-border">
                            <img
                              src={getImageUrl(img)}
                              alt={`Quotation ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-sm text-muted-foreground">
                      New Images ({selectedFiles.length})
                    </Label>

                    <div className="space-y-4">
                      {selectedFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="relative group">
                          <div className="w-full aspect-video rounded-lg overflow-hidden border-2 border-accent/30">
                            <img
                              src={imagePreviewUrls[idx]}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveNewImage(idx)}
                            className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          <p className="text-xs text-muted-foreground mt-2 truncate">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  multiple
                  onChange={(e) => handleAddFiles(e.target.files)}
                  className="hidden"
                />

                {/* Upload Box */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Click to upload images
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF, WebP • Max 5MB each • Up to 10 images
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuotationForm(false);
                    resetQuotationForm();
                  }}
                  className="flex-1 h-11"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuotationSubmit}
                  className="flex-1 h-11 btn-accent"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Saving...
                    </div>
                  ) : editingQuotation ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setPendingItem(null);
        }}
        onVerify={handleOTPVerify}
        title="Master Activation"
        description={`Verify OTP to activate "${pendingItem?.name}"`}
        type="master_activation"
        entityId={pendingItem?.id}
        entityType={pendingItem?.type}
        entityName={pendingItem?.name}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="danger"
        loading={confirmDialog.loading}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Masters;
