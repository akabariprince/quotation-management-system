import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Send, Package, Calculator, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OTPModal from '@/components/common/OTPModal';
import AddProductModal from '@/components/quotation/AddProductModal';
import ProductCard from '@/components/quotation/ProductCard';
import type { QuotationItemWithMaterials } from '@/components/quotation/AddProductModal';
import { toast } from 'sonner';

const resolveSelectValue = (val: string): string | undefined =>
  val === 'none' || val === '' ? undefined : val;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const QuotationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, hasPermission } = useAuth();
  const {
    customers, products, salesManagers, quotations,
    addQuotation, updateQuotation, getNextQuotationNumber, addOTPLog,
    woods, polishes, fabrics,
  } = useData();

  const existingQuotation = id ? quotations.find(q => q.id === id) : null;

  // Step state
  const [step, setStep] = useState<1 | 2>(existingQuotation ? 2 : 1);

  // Step 1 data
  const [customerId, setCustomerId] = useState(existingQuotation?.customerId || '');
  const [salesManager, setSalesManager] = useState(existingQuotation?.salesManager || salesManagers[0]);

  // Step 2 data
  const [items, setItems] = useState<QuotationItemWithMaterials[]>(
    existingQuotation?.items.map((item, i) => ({ ...item, itemNumber: i + 1 })) || []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // OTP
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingDiscountEdit, setPendingDiscountEdit] = useState<{ itemId: string; newDiscount: number } | null>(null);

  // Email
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [savedQuotation, setSavedQuotation] = useState<any>(null);

  // Refs for scroll-to
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const selectedCustomer = customers.find(c => c.id === customerId);

  // Calculations
  const recalculateItem = (item: QuotationItemWithMaterials): QuotationItemWithMaterials => {
    const amount = item.basePrice * item.quantity;
    const gstAmount = (amount * item.gstPercent) / 100;
    const subtotalWithGst = amount + gstAmount;
    const discountAmount = (amount * item.discountPercent) / 100;
    const grandTotalItem = subtotalWithGst - discountAmount;
    return {
      ...item, total: amount, discountAmount,
      finalPrice: item.basePrice,
      cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0,
      totalWithGst: grandTotalItem,
    };
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      return recalculateItem({ ...item, [field]: value });
    }));
  };

  const updateItemMaterial = (itemId: string, materialType: 'wood' | 'polish' | 'fabric', rawValue: string) => {
    const materialId = resolveSelectValue(rawValue);
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      if (materialType === 'wood') {
        return { ...item, woodId: materialId, woodName: materialId ? woods.find(w => w.id === materialId)?.name : undefined };
      } else if (materialType === 'polish') {
        return { ...item, polishId: materialId, polishName: materialId ? polishes.find(p => p.id === materialId)?.name : undefined };
      } else {
        return { ...item, fabricId: materialId, fabricName: materialId ? fabrics.find(f => f.id === materialId)?.name : undefined };
      }
    }));
    toast.success(`${materialType.charAt(0).toUpperCase() + materialType.slice(1)} updated`);
  };

  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    if (!hasPermission('edit_discount')) { toast.error('No permission to edit discount'); return; }
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
      addOTPLog({ type: 'discount', entityId: pendingDiscountEdit.itemId, entityType: 'quotation_item', requestedBy: user?.email || '', otp: '123456', status: 'approved', approvedAt: new Date() });
      toast.success('Discount updated successfully');
    }
    setShowOTPModal(false);
    setPendingDiscountEdit(null);
  };

  const removeItem = (itemId: string) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId);
      return filtered.map((item, i) => ({ ...item, itemNumber: i + 1 }));
    });
    toast.success('Product removed');
  };

  const handleAddProduct = (newItem: QuotationItemWithMaterials) => {
    setItems(prev => [...prev, { ...newItem, itemNumber: prev.length + 1 }]);
  };

  // Summary scroll sync
  const scrollToItem = useCallback((itemId: string) => {
    setHighlightedItemId(itemId);
    const el = itemRefs.current.get(itemId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => setHighlightedItemId(null), 2000);
  }, []);

  // Totals
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalGst = items.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
  const totalCgst = items.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgst, 0);
  const totalIgst = items.reduce((sum, item) => sum + item.igst, 0);
  const subtotal = totalAmount + totalGst;
  const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
  const grandTotal = subtotal - totalDiscount;

  const handleSave = (sendEmail: boolean = false) => {
    if (!customerId) { toast.error('Please select a customer'); return; }
    if (items.length === 0) { toast.error('Please add at least one product'); return; }

    const quotationData = {
      date: new Date(), customerId, salesManager, items,
      subtotal, totalDiscount, igst: totalIgst, cgst: totalCgst, sgst: totalSgst,
      grandTotal: totalAmount, grandTotalWithGst: grandTotal,
      status: sendEmail ? ('sent' as const) : ('draft' as const),
    };

    let saved;
    if (existingQuotation) {
      updateQuotation(existingQuotation.id, quotationData);
      saved = { ...existingQuotation, ...quotationData };
      toast.success('Quotation updated');
    } else {
      saved = addQuotation(quotationData);
      toast.success('Quotation created');
    }

    if (sendEmail) {
      setSavedQuotation(saved);
      setShowEmailPreview(true);
    } else {
      navigate('/quotations');
    }
  };

  const handleNextStep = () => {
    if (!customerId) { toast.error('Please select a customer'); return; }
    setStep(2);
  };

  return (
    <div className="space-y-0 animate-fade-in">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => step === 2 && !existingQuotation ? setStep(1) : navigate('/quotations')} className="p-2 hover:bg-muted rounded-md transition-colors">
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

      {/* ===== STEP 1: Company & Customer ===== */}
      {step === 1 && (
        <div className="space-y-6 max-w-3xl">
          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Company Details</h2>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-semibold">Ecstatics Spaces India Pvt. Ltd.</p>
              <p className="text-muted-foreground">3120, Ganga Trueno, Airport Road, Viman Nagar, Pune</p>
              <p className="text-muted-foreground">GST No: 27AAFCE9942B1ZM</p>
              <p className="text-muted-foreground">(+91) 7066 46 6060 | info@esipl.in</p>
            </div>
          </div>

          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
            <div className="form-grid">
              <div className="space-y-2 lg:col-span-2">
                <Label>Select Customer *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} - {c.mobile}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sales Manager</Label>
                <Select value={salesManager} onValueChange={setSalesManager}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {salesManagers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedCustomer && (
              <div className="mt-4 bg-muted/50 rounded-lg p-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-muted-foreground">Name</p><p className="font-medium">{selectedCustomer.name}</p></div>
                  <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{selectedCustomer.mobile}</p></div>
                  <div><p className="text-muted-foreground">Address</p><p className="font-medium">{selectedCustomer.address}, {selectedCustomer.city}</p></div>
                  <div><p className="text-muted-foreground">GSTIN</p><p className="font-medium font-mono">{selectedCustomer.gstin}</p></div>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleNextStep} className="btn-accent gap-2" disabled={!customerId}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ===== STEP 2: Products & Summary ===== */}
      {step === 2 && (
        <>
          {/* Sticky Customer Info Bar */}
          <div className="sticky top-0 z-30 bg-card border border-border rounded-xl shadow-sm mb-6 -mx-1 px-1">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-6 min-w-0 overflow-hidden">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold text-sm truncate">{selectedCustomer?.name}</p>
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="text-sm truncate">{selectedCustomer?.mobile}</p>
                </div>
                <div className="hidden md:block min-w-0">
                  <p className="text-xs text-muted-foreground">GSTIN</p>
                  <p className="text-sm font-mono truncate">{selectedCustomer?.gstin}</p>
                </div>
                <div className="hidden lg:block min-w-0">
                  <p className="text-xs text-muted-foreground">Sales Manager</p>
                  <p className="text-sm truncate">{salesManager}</p>
                </div>
              </div>
              <Button onClick={() => setShowAddModal(true)} className="btn-accent gap-2 flex-shrink-0">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Product List */}
            <div className="lg:col-span-3 space-y-4">
              {items.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-1">No products added</h3>
                  <p className="text-muted-foreground text-sm mb-4">Click "Add Product" to start adding products</p>
                  <Button onClick={() => setShowAddModal(true)} className="btn-accent gap-2">
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>
              ) : (
                items.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    ref={el => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
                    item={item}
                    index={index}
                    isHighlighted={highlightedItemId === item.id}
                    onUpdateItem={updateItem}
                    onUpdateMaterial={updateItemMaterial}
                    onRemoveItem={removeItem}
                    onDiscountChange={handleDiscountChange}
                  />
                ))
              )}
            </div>

            {/* Right Summary Panel */}
            <div className="lg:col-span-1">
              <div className="form-section sticky top-20">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" /> Summary
                </h2>

                {/* Product list in summary */}
                {items.length > 0 && (
                  <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                    {items.map((item, i) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToItem(item.id)}
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors text-xs flex items-center gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {item.itemNumber || i + 1}
                        </span>
                        <span className="truncate flex-1 font-medium">{item.productName}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">{item.productCode}</span>
                      </button>
                    ))}
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Add products to see summary</div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount ({items.length} items)</span>
                      <span className="font-medium">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">CGST</span><span>{formatCurrency(totalCgst)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">SGST</span><span>{formatCurrency(totalSgst)}</span></div>
                      {totalIgst > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">IGST</span><span>{formatCurrency(totalIgst)}</span></div>}
                      <div className="flex justify-between text-sm font-medium mt-1">
                        <span className="text-muted-foreground">Total GST</span>
                        <span className="text-blue-600">+{formatCurrency(totalGst)}</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-sm font-semibold"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
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
                  <Button onClick={() => handleSave(false)} variant="outline" className="w-full" disabled={items.length === 0}>
                    <Save className="h-4 w-4 mr-2" /> Save as Draft
                  </Button>
                  <Button onClick={() => handleSave(true)} className="w-full btn-accent" disabled={items.length === 0 || !customerId}>
                    <Send className="h-4 w-4 mr-2" /> Save & Send Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Product Modal */}
      <AddProductModal open={showAddModal} onOpenChange={setShowAddModal} existingItems={items} onAddProduct={handleAddProduct} />

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => { setShowOTPModal(false); setPendingDiscountEdit(null); }}
        onVerify={handleOTPVerify}
        title="Discount Edit Approval"
        description="OTP verification required to modify discount percentage"
        type="discount"
      />

      {/* Email Preview Modal */}
      {showEmailPreview && savedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setShowEmailPreview(false); navigate('/quotations'); }} />
          <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex gap-4"><span className="text-muted-foreground w-20">To:</span><span>{selectedCustomer?.email}</span></div>
              <div className="flex gap-4"><span className="text-muted-foreground w-20">CC:</span><span>admin@esipl.in</span></div>
              <div className="flex gap-4"><span className="text-muted-foreground w-20">Subject:</span><span>Quotation {savedQuotation.quotationNo} from Ecstatics Spaces India</span></div>
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-muted-foreground">Attachment:</p>
                <p className="font-medium">📎 {savedQuotation.quotationNo}.pdf</p>
              </div>
              <div className="border-t border-border pt-3">
                <p>Dear {selectedCustomer?.name},</p>
                <p className="mt-2">Please find attached the quotation for your review. The total value is {formatCurrency(grandTotal)} (including GST).</p>
                <p className="mt-2">For any queries, please feel free to contact us.</p>
                <p className="mt-4">Best Regards,<br />{salesManager}<br />Ecstatics Spaces India Pvt. Ltd.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowEmailPreview(false); navigate('/quotations'); }} className="flex-1">Close</Button>
              <Button onClick={() => navigate(`/quotations/${savedQuotation.id}/pdf`)} className="flex-1 btn-accent">View PDF Preview</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationForm;
