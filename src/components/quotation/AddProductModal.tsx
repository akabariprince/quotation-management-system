import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useData, QuotationItem } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import OTPModal from '@/components/common/OTPModal';
import { toast } from 'sonner';

interface QuotationItemWithMaterials extends QuotationItem {
  woodId?: string;
  woodName?: string;
  polishId?: string;
  polishName?: string;
  fabricId?: string;
  fabricName?: string;
  itemNumber?: number;
}

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItems: QuotationItemWithMaterials[];
  onAddProduct: (item: QuotationItemWithMaterials) => void;
}

const resolveSelectValue = (val: string): string | undefined =>
  val === 'none' || val === '' ? undefined : val;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const AddProductModal: React.FC<AddProductModalProps> = ({ open, onOpenChange, existingItems, onAddProduct }) => {
  const { products, woods, polishes, fabrics } = useData();

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWoodId, setSelectedWoodId] = useState('none');
  const [selectedPolishId, setSelectedPolishId] = useState('none');
  const [selectedFabricId, setSelectedFabricId] = useState('none');

  const activeWoods = woods.filter(w => w.status === 'active');
  const activePolishes = polishes.filter(p => p.status === 'active');
  const activeFabrics = fabrics.filter(f => f.status === 'active');

  const filteredProducts = products.filter(p =>
    p.status === 'active' &&
    (productSearchTerm === '' ||
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.partCode.toLowerCase().includes(productSearchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setSelectedProductId('');
    setProductSearchTerm('');
    setSelectedWoodId('none');
    setSelectedPolishId('none');
    setSelectedFabricId('none');
  };

  const handleAdd = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    if (existingItems.find(item => item.productId === product.id)) {
      toast.error('Product already added. Update quantity instead.');
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
      itemNumber: existingItems.length + 1,
    };

    onAddProduct(newItem);
    resetForm();
    onOpenChange(false);
    toast.success('Product added to quotation');
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Product</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={productSearchTerm}
                onChange={e => setProductSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          {/* Select */}
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
                      <span className="font-medium">{product.partCode} - {product.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatCurrency(product.basePrice)}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {selectedProduct && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <div className="flex gap-4">
                {selectedProduct.images[0] && (
                  <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-20 h-20 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{selectedProduct.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">{selectedProduct.partCode}</p>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span>Price: {formatCurrency(selectedProduct.basePrice)}</span>
                    <span>Discount: {selectedProduct.defaultDiscount}%</span>
                    <span>GST: {selectedProduct.gstPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Materials */}
          {selectedProductId && (
            <div className="border border-border rounded-lg p-4 bg-background">
              <h3 className="font-medium text-foreground border-b border-border pb-2 mb-4 text-sm">
                Material Selection
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Wood Type</Label>
                  <Select value={selectedWoodId} onValueChange={setSelectedWoodId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select wood" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                      {activeWoods.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Polish</Label>
                  <Select value={selectedPolishId} onValueChange={setSelectedPolishId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select polish" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                      {activePolishes.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fabric</Label>
                  <Select value={selectedFabricId} onValueChange={setSelectedFabricId}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select fabric" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                      {activeFabrics.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleAdd} className="w-full btn-accent" disabled={!selectedProductId}>
            <Plus className="h-4 w-4 mr-2" />
            Add to Quotation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductModal;
export type { QuotationItemWithMaterials };
