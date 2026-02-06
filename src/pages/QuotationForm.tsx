import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Send, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData, QuotationItem } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OTPModal from '@/components/common/OTPModal';
import { toast } from 'sonner';

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
  } = useData();

  const existingQuotation = id ? quotations.find(q => q.id === id) : null;

  const [customerId, setCustomerId] = useState(existingQuotation?.customerId || '');
  const [salesManager, setSalesManager] = useState(existingQuotation?.salesManager || salesManagers[0]);
  const [items, setItems] = useState<QuotationItem[]>(existingQuotation?.items || []);
  
  // Product selection state - simplified to only product selection
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');

  // OTP Modal
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingDiscountEdit, setPendingDiscountEdit] = useState<{itemId: string, newDiscount: number} | null>(null);

  // Email Preview Modal
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [savedQuotation, setSavedQuotation] = useState<any>(null);

  const selectedCustomer = customers.find(c => c.id === customerId);

  // Filter only active products - search by name or part code
  const filteredProducts = products.filter(p => 
    p.status === 'active' &&
    (productSearchTerm === '' || 
     p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
     p.partCode.toLowerCase().includes(productSearchTerm.toLowerCase()))
  );

  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Check if product already in quotation
    const existingItem = items.find(item => item.productId === product.id);
    if (existingItem) {
      toast.error('Product already added to quotation. Update quantity instead.');
      return;
    }

    // Calculation: Price - Discount = Final Price, then add GST
    const discountAmount = (product.basePrice * product.defaultDiscount) / 100;
    const finalPrice = product.basePrice - discountAmount;
    const total = finalPrice * 1; // quantity = 1 initially
    const gstAmount = (total * product.gstPercent) / 100;

    const newItem: QuotationItem = {
      id: Date.now().toString(),
      productId: product.id,
      productCode: product.partCode,
      productName: product.name,
      description: product.description,
      images: product.images,
      basePrice: product.basePrice,
      discountPercent: product.defaultDiscount,
      discountAmount,
      finalPrice,
      quantity: 1,
      total,
      gstPercent: product.gstPercent,
      igst: 0,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      totalWithGst: total + gstAmount,
      notes: product.description.split('. '),
    };

    setItems(prev => [...prev, newItem]);
    
    // Reset product selection
    setSelectedProductId('');
    setProductSearchTerm('');
    
    toast.success('Product added to quotation');
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const updated = { ...item, [field]: value };

      // Recalculate totals
      if (field === 'quantity' || field === 'discountPercent') {
        updated.discountAmount = (updated.basePrice * updated.discountPercent) / 100;
        updated.finalPrice = updated.basePrice - updated.discountAmount;
        updated.total = updated.finalPrice * updated.quantity;
        const gstAmount = (updated.total * updated.gstPercent) / 100;
        updated.cgst = gstAmount / 2;
        updated.sgst = gstAmount / 2;
        updated.totalWithGst = updated.total + gstAmount;
      }

      return updated;
    }));
  };

  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    // Data Entry users cannot edit discount at all
    if (!hasPermission('edit_discount')) {
      toast.error('You do not have permission to edit discount');
      return;
    }
    
    // Non-admin users with edit_discount permission require OTP
    if (user?.role !== 'admin') {
      setPendingDiscountEdit({ itemId, newDiscount });
      setShowOTPModal(true);
    } else {
      // Admin can edit directly
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
    toast.success('Product removed from quotation');
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discountAmount * item.quantity), 0);
  const totalIgst = items.reduce((sum, item) => sum + item.igst, 0);
  const totalCgst = items.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = items.reduce((sum, item) => sum + item.sgst, 0);
  const grandTotalWithGst = items.reduce((sum, item) => sum + item.totalWithGst, 0);

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
      grandTotal: subtotal,
      grandTotalWithGst,
      status: sendEmail ? 'sent' as const : 'draft' as const,
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
          {/* Company Info (Static) */}
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

          {/* Product Selection - Simplified (only product selection, no category/type/model) */}
          <div className="form-section">
            <h2 className="text-lg font-semibold mb-4">Add Products</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Product</Label>
                <Input
                  placeholder="Search by product name or code..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
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
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No products found
                      </div>
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
              
              {/* Selected product preview */}
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
            </div>
            <Button onClick={handleAddProduct} className="mt-4 btn-accent" disabled={!selectedProductId}>
              <Plus className="h-4 w-4 mr-2" />
              Add to Quotation
            </Button>
          </div>

          {/* Product Table */}
          {items.length > 0 && (
            <div className="enterprise-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Sr</th>
                      <th>Image</th>
                      <th>Code</th>
                      <th>Price</th>
                      <th>Disc %</th>
                      <th>Final</th>
                      <th>Qty</th>
                      <th>Total</th>
                      <th>GST</th>
                      <th>With GST</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                            {item.images[0] ? (
                              <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="font-mono text-xs">{item.productCode}</td>
                        <td>{formatCurrency(item.basePrice)}</td>
                        <td>
                          <Input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => handleDiscountChange(item.id, Number(e.target.value))}
                            className="w-16 text-center"
                            min={0}
                            max={100}
                            disabled={!hasPermission('edit_discount')}
                            title={!hasPermission('edit_discount') ? 'You do not have permission to edit discount' : ''}
                          />
                        </td>
                        <td>{formatCurrency(item.finalPrice)}</td>
                        <td>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            className="w-16 text-center"
                            min={1}
                          />
                        </td>
                        <td className="font-medium">{formatCurrency(item.total)}</td>
                        <td className="text-xs text-muted-foreground">
                          <div>C: {formatCurrency(item.cgst)}</div>
                          <div>S: {formatCurrency(item.sgst)}</div>
                        </td>
                        <td className="font-semibold">{formatCurrency(item.totalWithGst)}</td>
                        <td>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 hover:bg-destructive/10 rounded-md"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          <div className="form-section sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Discount</span>
                <span className="font-medium text-success">-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IGST (0%)</span>
                  <span>{formatCurrency(totalIgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST (9%)</span>
                  <span>{formatCurrency(totalCgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST (9%)</span>
                  <span>{formatCurrency(totalSgst)}</span>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Grand Total</span>
                  <span className="text-accent">{formatCurrency(grandTotalWithGst)}</span>
                </div>
              </div>
            </div>

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
          <div className="fixed inset-0 bg-black/50" onClick={() => {
            setShowEmailPreview(false);
            navigate('/quotations');
          }} />
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
                <p className="mt-2">Please find attached the quotation for your review. The total value is {formatCurrency(grandTotalWithGst)} (including GST).</p>
                <p className="mt-2">For any queries, please feel free to contact us.</p>
                <p className="mt-4">Best Regards,<br/>{salesManager}<br/>Ecstatics Spaces India Pvt. Ltd.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => {
                setShowEmailPreview(false);
                navigate('/quotations');
              }} className="flex-1">
                Close
              </Button>
              <Button onClick={() => navigate(`/quotations/${savedQuotation.id}/pdf`)} className="flex-1 btn-accent">
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
