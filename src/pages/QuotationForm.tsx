import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Send, Image as ImageIcon, ChevronDown, ChevronUp, GripVertical, Package, Percent, Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, QuotationItem } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OTPModal from '@/components/common/OTPModal';
import { toast } from 'sonner';

// Extended QuotationItem to include material selections
interface QuotationItemWithMaterials extends QuotationItem {
  woodId?: string;
  woodName?: string;
  polishId?: string;
  polishName?: string;
  fabricId?: string;
  fabricName?: string;
}

// Helper: convert "none" to undefined, otherwise return the value
const resolveSelectValue = (val: string): string | undefined => {
  return val === 'none' || val === '' ? undefined : val;
};

const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, hasPermission } = useAuth();
  const {
    customers,
    products,
    salesManagers,
    quotations,
    addQuotation,
    updateQuotation,
    getNextQuotationNumber,
    addOTPLog,
    woods,
    polishes,
    fabrics,
  } = useData();

  const existingQuotation = id ? quotations.find(q => q.id === id) : null;

  const [customerId, setCustomerId] = useState(existingQuotation?.customerId || '');
  const [salesManager, setSalesManager] = useState(existingQuotation?.salesManager || salesManagers[0]);
  const [items, setItems] = useState<QuotationItemWithMaterials[]>(existingQuotation?.items || []);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [selectedWoodId, setSelectedWoodId] = useState('none');
  const [selectedPolishId, setSelectedPolishId] = useState('none');
  const [selectedFabricId, setSelectedFabricId] = useState('none');

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingDiscountEdit, setPendingDiscountEdit] = useState<{ itemId: string; newDiscount: number } | null>(null);

  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [savedQuotation, setSavedQuotation] = useState<any>(null);

  const selectedCustomer = customers.find(c => c.id === customerId);

  const filteredProducts = products.filter(p =>
    p.status === 'active' &&
    (productSearchTerm === '' ||
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.partCode.toLowerCase().includes(productSearchTerm.toLowerCase()))
  );

  const activeWoods = woods.filter(w => w.status === 'active');
  const activePolishes = polishes.filter(p => p.status === 'active');
  const activeFabrics = fabrics.filter(f => f.status === 'active');

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existingItem = items.find(item => item.productId === product.id);
    if (existingItem) {
      toast.error('Product already added to quotation. Update quantity instead.');
      return;
    }

    const quantity = 1;
    const amount = product.basePrice * quantity;
    const gstAmount = (amount * product.gstPercent) / 100;
    const subtotalWithGst = amount + gstAmount;
    const discountAmount = (amount * product.defaultDiscount) / 100;
    const grandTotalItem = subtotalWithGst - discountAmount;

    const woodIdResolved = resolveSelectValue(selectedWoodId);
    const polishIdResolved = resolveSelectValue(selectedPolishId);
    const fabricIdResolved = resolveSelectValue(selectedFabricId);

    const selectedWood = woodIdResolved ? woods.find(w => w.id === woodIdResolved) : undefined;
    const selectedPolish = polishIdResolved ? polishes.find(p => p.id === polishIdResolved) : undefined;
    const selectedFabric = fabricIdResolved ? fabrics.find(f => f.id === fabricIdResolved) : undefined;

    const newItem: QuotationItemWithMaterials = {
      id: Date.now().toString(),
      productId: product.id,
      productCode: product.partCode,
      productName: product.name,
      description: product.description,
      images: product.images,
      basePrice: product.basePrice,
      discountPercent: product.defaultDiscount,
      discountAmount,
      finalPrice: product.basePrice,
      quantity,
      total: amount,
      gstPercent: product.gstPercent,
      igst: 0,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      totalWithGst: grandTotalItem,
      notes: product.description.split('. '),
      woodId: woodIdResolved,
      woodName: selectedWood?.name,
      polishId: polishIdResolved,
      polishName: selectedPolish?.name,
      fabricId: fabricIdResolved,
      fabricName: selectedFabric?.name,
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setProductSearchTerm('');
    setSelectedWoodId('none');
    setSelectedPolishId('none');
    setSelectedFabricId('none');
    toast.success('Product added to quotation');
  };

  const recalculateItem = (item: QuotationItemWithMaterials): QuotationItemWithMaterials => {
    const amount = item.basePrice * item.quantity;
    const gstAmount = (amount * item.gstPercent) / 100;
    const subtotalWithGst = amount + gstAmount;
    const discountAmount = (amount * item.discountPercent) / 100;
    const grandTotalItem = subtotalWithGst - discountAmount;

    return {
      ...item,
      total: amount,
      discountAmount,
      finalPrice: item.basePrice,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      totalWithGst: grandTotalItem,
    };
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        return recalculateItem(updated);
      })
    );
  };

  const updateItemMaterial = (
    itemId: string,
    materialType: 'wood' | 'polish' | 'fabric',
    rawValue: string
  ) => {
    const materialId = resolveSelectValue(rawValue);

    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;

        if (materialType === 'wood') {
          const materialName = materialId ? woods.find(w => w.id === materialId)?.name : undefined;
          return { ...item, woodId: materialId, woodName: materialName };
        } else if (materialType === 'polish') {
          const materialName = materialId ? polishes.find(p => p.id === materialId)?.name : undefined;
          return { ...item, polishId: materialId, polishName: materialName };
        } else {
          const materialName = materialId ? fabrics.find(f => f.id === materialId)?.name : undefined;
          return { ...item, fabricId: materialId, fabricName: materialName };
        }
      })
    );
    toast.success(`${materialType.charAt(0).toUpperCase() + materialType.slice(1)} updated`);
  };

  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    if (!hasPermission('edit_discount')) {
      toast.error('You do not have permission to edit discount');
      return;
    }

    if (user?.role !== 'admin') {
      setPendingDiscountEdit({ itemId, newDiscount });
      setShowOTPModal(true);
    } else {
      updateItem(itemId, 'discountPercent', newDiscount);
    }
  };

  const handleOTPVerify = () => {
    if (pendingDiscountEdit) {
      updateItem(pendingDiscountEdit.itemId, 'discountPercent', pendingDiscountEdit.newDiscount);
      addOTPLog({
        type: 'discount',
        entityId: pendingDiscountEdit.itemId,
        entityType: 'quotation_item',
        requestedBy: user?.email || '',
        otp: '123456',
        status: 'approved',
        approvedAt: new Date(),
      });
      toast.success('Discount updated successfully');
    }
    setShowOTPModal(false);
    setPendingDiscountEdit(null);
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    toast.success('Product removed from quotation');
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalGst = items.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
  const totalCgst = items.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgst, 0);
  const totalIgst = items.reduce((sum, item) => sum + item.igst, 0);
  const subtotal = totalAmount + totalGst;
  const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const grandTotal = subtotal - totalDiscount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSave = (sendEmail: boolean = false) => {
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const quotationData = {
      date: new Date(),
      customerId,
      salesManager,
      items,
      subtotal,
      totalDiscount,
      igst: totalIgst,
      cgst: totalCgst,
      sgst: totalSgst,
      grandTotal: totalAmount,
      grandTotalWithGst: grandTotal,
      status: sendEmail ? ('sent' as const) : ('draft' as const),
    };

    let saved;
    if (existingQuotation) {
      updateQuotation(existingQuotation.id, quotationData);
      saved = { ...existingQuotation, ...quotationData };
      toast.success('Quotation updated successfully');
    } else {
      saved = addQuotation(quotationData);
      toast.success('Quotation created successfully');
    }

    if (sendEmail) {
      setSavedQuotation(saved);
      setShowEmailPreview(true);
    } else {
      navigate('/quotations');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="page-title">
              {existingQuotation ? `Edit ${existingQuotation.quotationNo}` : 'Create Quotation'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {existingQuotation ? 'Update quotation details' : `New Quotation: ${getNextQuotationNumber()}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info */}
          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Company Details</h2>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-semibold">Ecstatics Spaces India Pvt. Ltd.</p>
              <p className="text-muted-foreground">3120, Ganga Trueno, Airport Road, Viman Nagar, Pune</p>
              <p className="text-muted-foreground">GST No: 27AAFCE9942B1ZM</p>
              <p className="text-muted-foreground">(+91) 7066 46 6060 | info@esipl.in</p>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="form-grid">
              <div className="space-y-2 lg:col-span-2">
                <Label>Select Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.mobile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sales Manager</Label>
                <Select value={salesManager} onValueChange={setSalesManager}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {salesManagers.map(manager => (
                      <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedCustomer && (
              <div className="mt-4 bg-muted/50 rounded-lg p-4 text-sm">
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
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedCustomer.address}, {selectedCustomer.city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GSTIN</p>
                    <p className="font-medium font-mono">{selectedCustomer.gstin}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Selection with Materials */}
          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Add Products</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Product</Label>
                <Input
                  placeholder="Search by product name or code..."
                  value={productSearchTerm}
                  onChange={e => setProductSearchTerm(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Product *</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select a product to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">No products found</div>
                    ) : (
                      filteredProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{product.partCode} - {product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(product.basePrice)} | Discount: {product.defaultDiscount}%
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedProductId && (() => {
                const product = products.find(p => p.id === selectedProductId);
                if (!product) return null;
                return (
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    <div className="flex gap-4">
                      {product.images[0] && (
                        <img src={product.images[0]} alt={product.name} className="w-16 h-16 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-muted-foreground font-mono text-xs">{product.partCode}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span>Price: {formatCurrency(product.basePrice)}</span>
                          <span>Discount: {product.defaultDiscount}%</span>
                          <span>GST: {product.gstPercent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedProductId && (
                <div className="border border-border rounded-lg p-4 bg-background">
                  <h3 className="font-medium text-foreground border-b border-border pb-2 mb-4">
                    Materials for this Product
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Wood Type</Label>
                      <Select value={selectedWoodId} onValueChange={setSelectedWoodId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select wood" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                          {activeWoods.map(wood => (
                            <SelectItem key={wood.id} value={wood.id}>
                              <div className="flex items-center gap-2">
                                {wood.image && <img src={wood.image} alt={wood.name} className="w-6 h-6 rounded object-cover" />}
                                <span>{wood.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Polish</Label>
                      <Select value={selectedPolishId} onValueChange={setSelectedPolishId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select polish" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                          {activePolishes.map(polish => (
                            <SelectItem key={polish.id} value={polish.id}>
                              <div className="flex items-center gap-2">
                                {polish.image && <img src={polish.image} alt={polish.name} className="w-6 h-6 rounded object-cover" />}
                                <span>{polish.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fabric</Label>
                      <Select value={selectedFabricId} onValueChange={setSelectedFabricId}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select fabric" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                          {activeFabrics.map(fabric => (
                            <SelectItem key={fabric.id} value={fabric.id}>
                              <div className="flex items-center gap-2">
                                {fabric.image && <img src={fabric.image} alt={fabric.name} className="w-6 h-6 rounded object-cover" />}
                                <span>{fabric.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(selectedWoodId !== 'none' || selectedPolishId !== 'none' || selectedFabricId !== 'none') && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedWoodId !== 'none' && (() => {
                        const wood = woods.find(w => w.id === selectedWoodId);
                        return wood ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                            {wood.name}
                          </span>
                        ) : null;
                      })()}
                      {selectedPolishId !== 'none' && (() => {
                        const polish = polishes.find(p => p.id === selectedPolishId);
                        return polish ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            {polish.name}
                          </span>
                        ) : null;
                      })()}
                      {selectedFabricId !== 'none' && (() => {
                        const fabric = fabrics.find(f => f.id === selectedFabricId);
                        return fabric ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {fabric.name}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button onClick={handleAddProduct} className="mt-4 btn-accent" disabled={!selectedProductId}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Quotation
            </Button>
          </div>

          {/* ===== CARD-BASED PRODUCT LIST ===== */}
          {items.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({items.length})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{formatCurrency(grandTotal)}</span>
                </p>
              </div>

              {items.map((item, index) => {
                const itemAmount = item.basePrice * item.quantity;
                const itemGst = item.cgst + item.sgst + item.igst;
                const itemSubtotal = itemAmount + itemGst;
                const itemGrandTotal = itemSubtotal - item.discountAmount;
                const isExpanded = expandedItems.has(item.id);
                const hasMaterials = item.woodId || item.polishId || item.fabricId;

                return (
                  <div
                    key={item.id}
                    className="border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Card Header - Product Info */}
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Sr No + Image */}
                        <div className="flex flex-col items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {item.images[0] ? (
                              <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm truncate">{item.productName}</h3>
                              <p className="font-mono text-xs text-muted-foreground">{item.productCode}</p>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
                              title="Remove product"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </div>

                          {/* Material chips */}
                          {hasMaterials && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {item.woodName && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-medium">
                                  Wood: {item.woodName}
                                </span>
                              )}
                              {item.polishName && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[11px] font-medium">
                                  Polish: {item.polishName}
                                </span>
                              )}
                              {item.fabricName && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-medium">
                                  Fabric: {item.fabricName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pricing Grid */}
                    <div className="border-t border-border bg-muted/30 px-4 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Base Price */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Base Price
                          </p>
                          <p className="text-sm font-semibold">{formatCurrency(item.basePrice)}</p>
                        </div>

                        {/* Quantity */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Quantity
                          </p>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={e => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                            className="w-20 h-8 text-sm text-center"
                            min={1}
                          />
                        </div>

                        {/* Amount */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Amount
                          </p>
                          <p className="text-sm font-semibold">{formatCurrency(itemAmount)}</p>
                        </div>

                        {/* Item Total */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Item Total
                          </p>
                          <p className="text-sm font-bold text-primary">{formatCurrency(itemGrandTotal)}</p>
                        </div>
                      </div>
                    </div>

                    {/* GST & Discount Row */}
                    <div className="border-t border-border px-4 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* GST */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            GST ({item.gstPercent}%)
                          </p>
                          <p className="text-sm font-medium text-blue-600">+{formatCurrency(itemGst)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            CGST: {formatCurrency(item.cgst)} | SGST: {formatCurrency(item.sgst)}
                          </p>
                        </div>

                        {/* Discount % */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Discount %
                          </p>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={item.discountPercent}
                              onChange={e => handleDiscountChange(item.id, Number(e.target.value))}
                              className="w-16 h-8 text-sm text-center"
                              min={0}
                              max={100}
                              disabled={!hasPermission('edit_discount')}
                              title={!hasPermission('edit_discount') ? 'No permission to edit discount' : ''}
                            />
                            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>

                        {/* Discount Amount */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            Discount Amt
                          </p>
                          <p className="text-sm font-medium text-red-500">-{formatCurrency(item.discountAmount)}</p>
                        </div>

                        {/* Subtotal with GST */}
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                            With GST
                          </p>
                          <p className="text-sm font-medium">{formatCurrency(itemSubtotal)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Materials Toggle */}
                    <div className="border-t border-border">
                      <button
                        onClick={() => toggleItemExpand(item.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" /> Hide Materials
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" /> Edit Materials
                          </>
                        )}
                      </button>

                      {/* Expanded Materials */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Wood Type</Label>
                              <Select
                                value={item.woodId || 'none'}
                                onValueChange={v => updateItemMaterial(item.id, 'wood', v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select wood" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                                  {activeWoods.map(wood => (
                                    <SelectItem key={wood.id} value={wood.id}>
                                      <div className="flex items-center gap-2">
                                        {wood.image && <img src={wood.image} alt={wood.name} className="w-5 h-5 rounded object-cover" />}
                                        <span>{wood.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Polish</Label>
                              <Select
                                value={item.polishId || 'none'}
                                onValueChange={v => updateItemMaterial(item.id, 'polish', v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select polish" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                                  {activePolishes.map(polish => (
                                    <SelectItem key={polish.id} value={polish.id}>
                                      <div className="flex items-center gap-2">
                                        {polish.image && <img src={polish.image} alt={polish.name} className="w-5 h-5 rounded object-cover" />}
                                        <span>{polish.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Fabric</Label>
                              <Select
                                value={item.fabricId || 'none'}
                                onValueChange={v => updateItemMaterial(item.id, 'fabric', v)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select fabric" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                                  {activeFabrics.map(fabric => (
                                    <SelectItem key={fabric.id} value={fabric.id}>
                                      <div className="flex items-center gap-2">
                                        {fabric.image && <img src={fabric.image} alt={fabric.name} className="w-5 h-5 rounded object-cover" />}
                                        <span>{fabric.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {items.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">No products added</h3>
              <p className="text-muted-foreground text-sm">
                Search and select products above to add them to this quotation
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="form-section sticky top-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Summary
            </h2>

            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Add products to see the summary
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount ({items.length} items)</span>
                  <span className="font-medium">{formatCurrency(totalAmount)}</span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CGST</span>
                    <span>{formatCurrency(totalCgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SGST</span>
                    <span>{formatCurrency(totalSgst)}</span>
                  </div>
                  {totalIgst > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IGST</span>
                      <span>{formatCurrency(totalIgst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span className="text-muted-foreground">Total GST</span>
                    <span className="text-blue-600">+{formatCurrency(totalGst)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-red-500">-{formatCurrency(totalDiscount)}</span>
                  </div>
                </div>

                <div className="border-t-2 border-border pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="text-accent">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 mt-6">
              <Button
                onClick={() => handleSave(false)}
                variant="outline"
                className="w-full"
                disabled={items.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                className="w-full btn-accent"
                disabled={items.length === 0 || !customerId}
              >
                <Send className="h-4 w-4 mr-2" />
                Save & Send Email
              </Button>
            </div>
          </div>
        </div>
      </div>

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
      />

      {/* Email Preview Modal */}
      {showEmailPreview && savedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setShowEmailPreview(false);
              navigate('/quotations');
            }}
          />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex gap-4">
                <span className="text-muted-foreground w-20">To:</span>
                <span>{selectedCustomer?.email}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-muted-foreground w-20">CC:</span>
                <span>admin@esipl.in</span>
              </div>
              <div className="flex gap-4">
                <span className="text-muted-foreground w-20">Subject:</span>
                <span>Quotation {savedQuotation.quotationNo} from Ecstatics Spaces India</span>
              </div>
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-muted-foreground">Attachment:</p>
                <p className="font-medium">📎 {savedQuotation.quotationNo}.pdf</p>
              </div>
              <div className="border-t border-border pt-3">
                <p>Dear {selectedCustomer?.name},</p>
                <p className="mt-2">
                  Please find attached the quotation for your review. The total value is{' '}
                  {formatCurrency(grandTotal)} (including GST).
                </p>
                <p className="mt-2">For any queries, please feel free to contact us.</p>
                <p className="mt-4">
                  Best Regards,<br />{salesManager}<br />Ecstatics Spaces India Pvt. Ltd.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailPreview(false);
                  navigate('/quotations');
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => navigate(`/quotations/${savedQuotation.id}/pdf`)}
                className="flex-1 btn-accent"
              >
                View PDF Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationForm;