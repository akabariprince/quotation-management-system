import React, { useState } from 'react';
import { Trash2, Image as ImageIcon, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QuotationItemWithMaterials } from './AddProductModal';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

interface ProductCardProps {
  item: QuotationItemWithMaterials;
  index: number;
  isHighlighted: boolean;
  onUpdateItem: (itemId: string, field: string, value: any) => void;
  onUpdateMaterial: (itemId: string, type: 'wood' | 'polish' | 'fabric', value: string) => void;
  onRemoveItem: (itemId: string) => void;
  onDiscountChange: (itemId: string, newDiscount: number) => void;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ item, index, isHighlighted, onUpdateItem, onUpdateMaterial, onRemoveItem, onDiscountChange }, ref) => {
    const { hasPermission } = useAuth();
    const { woods, polishes, fabrics } = useData();
    const [isExpanded, setIsExpanded] = useState(false);

    const activeWoods = woods.filter(w => w.status === 'active');
    const activePolishes = polishes.filter(p => p.status === 'active');
    const activeFabrics = fabrics.filter(f => f.status === 'active');

    const product = item;
    const itemAmount = item.basePrice * item.quantity;
    const itemGst = item.cgst + item.sgst + item.igst;
    const itemSubtotal = itemAmount + itemGst;
    const itemGrandTotal = itemSubtotal - item.discountAmount;
    const hasMaterials = item.woodId || item.polishId || item.fabricId;

    return (
      <div
        ref={ref}
        className={`border rounded-xl bg-card shadow-sm overflow-hidden transition-all duration-300 ${
          isHighlighted
            ? 'border-primary ring-2 ring-primary/30 shadow-lg'
            : 'border-border hover:shadow-md'
        }`}
      >
        {/* ===== TOP: Reference Image + Code (matching PDF ref) ===== */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between bg-muted/50 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">Reference Image</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded">CODE</span>
              <span className="text-sm font-semibold font-mono">{item.productCode}</span>
            </div>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
              title="Remove product"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          </div>

          <div className="flex">
            {/* Image */}
            <div className="w-1/2 p-4">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                {item.images[0] ? (
                  <img src={item.images[0]} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Material circles (matching ref) */}
              {hasMaterials && (
                <div className="flex gap-2 justify-center mt-3">
                  {item.woodName && (
                    <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-[8px] font-medium text-center leading-tight p-0.5" title={`Wood: ${item.woodName}`}>
                      W
                    </div>
                  )}
                  {item.polishName && (
                    <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-[8px] font-medium text-center leading-tight p-0.5" title={`Polish: ${item.polishName}`}>
                      P
                    </div>
                  )}
                  {item.fabricName && (
                    <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-[8px] font-medium text-center leading-tight p-0.5" title={`Fabric: ${item.fabricName}`}>
                      F
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price breakdown table (matching ref) */}
            <div className="w-1/2 border-l border-border">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">Price</td>
                    <td className="px-3 py-1.5"></td>
                    <td className="px-3 py-1.5 text-right font-semibold">{formatCurrency(item.basePrice)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">Discount</td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          value={item.discountPercent}
                          onChange={e => onDiscountChange(item.id, Number(e.target.value))}
                          className="w-14 h-6 text-xs text-center p-0"
                          min={0} max={100}
                          disabled={!hasPermission('edit_discount')}
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right text-red-500">{formatCurrency(item.discountAmount)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">Final Price</td>
                    <td className="px-3 py-1.5"></td>
                    <td className="px-3 py-1.5 text-right font-semibold">{formatCurrency(itemAmount - item.discountAmount)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">Units</td>
                    <td className="px-3 py-1.5"></td>
                    <td className="px-3 py-1.5 text-right">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e => onUpdateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-14 h-6 text-xs text-center p-0 ml-auto"
                        min={1}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">Total</td>
                    <td className="px-3 py-1.5"></td>
                    <td className="px-3 py-1.5 text-right font-semibold">{formatCurrency((itemAmount - item.discountAmount) * item.quantity / item.quantity)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">IGST</td>
                    <td className="px-3 py-1.5 text-center text-xs">0%</td>
                    <td className="px-3 py-1.5 text-right">{formatCurrency(item.igst)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">CGST</td>
                    <td className="px-3 py-1.5 text-center text-xs">{item.gstPercent / 2}%</td>
                    <td className="px-3 py-1.5 text-right">{formatCurrency(item.cgst)}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-3 py-1.5 font-medium">SGST</td>
                    <td className="px-3 py-1.5 text-center text-xs">{item.gstPercent / 2}%</td>
                    <td className="px-3 py-1.5 text-right">{formatCurrency(item.sgst)}</td>
                  </tr>
                  <tr className="bg-muted/50">
                    <td className="px-3 py-2 font-bold">Total With GST</td>
                    <td className="px-3 py-2"></td>
                    <td className="px-3 py-2 text-right font-bold text-primary">{formatCurrency(itemGrandTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Description row */}
        <div className="border-b border-border">
          <div className="flex">
            <div className="w-1/2 p-3">
              <p className="text-xs font-semibold mb-1">Description</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              {hasMaterials && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.woodName && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-medium">
                      Wood: {item.woodName}
                    </span>
                  )}
                  {item.polishName && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-medium">
                      Polish: {item.polishName}
                    </span>
                  )}
                  {item.fabricName && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-medium">
                      Fabric: {item.fabricName}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="w-1/2 border-l border-border p-3">
              <p className="text-xs text-muted-foreground">Sales Manager</p>
              <p className="text-xs font-semibold">ESIPL</p>
            </div>
          </div>
        </div>

        {/* Quotation item number footer */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-medium">Quotation</span>
          <span className="font-bold text-sm">{item.itemNumber || index + 1}</span>
        </div>

        {/* Edit Materials Toggle */}
        <div className="border-t border-border">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            {isExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Hide Materials</> : <><ChevronDown className="h-3.5 w-3.5" /> Edit Materials</>}
          </button>

          {isExpanded && (
            <div className="border-t border-border bg-muted/20 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Wood Type</Label>
                  <Select value={item.woodId || 'none'} onValueChange={v => onUpdateMaterial(item.id, 'wood', v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select wood" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                      {activeWoods.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Polish</Label>
                  <Select value={item.polishId || 'none'} onValueChange={v => onUpdateMaterial(item.id, 'polish', v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select polish" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                      {activePolishes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Fabric</Label>
                  <Select value={item.fabricId || 'none'} onValueChange={v => onUpdateMaterial(item.id, 'fabric', v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select fabric" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                      {activeFabrics.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProductCard.displayName = 'ProductCard';

export default ProductCard;
