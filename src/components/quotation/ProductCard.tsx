import React, { useState } from 'react';
import { Trash2, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
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

    const itemAmount = item.basePrice * item.quantity;
    const gstAmount = item.cgst + item.sgst + item.igst;
    const subtotalWithGst = itemAmount + gstAmount;
    const grandTotal = subtotalWithGst - item.discountAmount;
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
        {/* ===== TOP BAR: Item number + Code + Delete ===== */}
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {item.itemNumber || index + 1}
            </span>
            <span className="text-sm font-semibold font-mono tracking-wide">{item.productCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">{item.productName}</span>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
              title="Remove product"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          </div>
        </div>

        {/* ===== FULL-WIDTH IMAGE ===== */}
        <div className="w-full flex justify-center bg-muted/20 border-b border-border">
          <div className="w-full max-w-md aspect-[4/3] overflow-hidden">
            {item.images[0] ? (
              <img src={item.images[0]} alt={item.productName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Material circles below image */}
        {hasMaterials && (
          <div className="flex gap-2 justify-center py-2 border-b border-border bg-muted/10">
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

        {/* ===== 2-SECTION: Description | Price Table ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
          {/* Description - 1 col */}
          <div className="p-4 md:border-r border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Qty</p>
              <Input
                type="number"
                value={item.quantity}
                onChange={e => onUpdateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                className="w-20 h-8 text-sm mt-1"
                min={1}
              />
            </div>
          </div>

          {/* Price Table - 2 cols */}
          <div className="md:col-span-2 p-0">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">Base Price</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(item.basePrice)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">Amount (Qty × Price)</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(itemAmount)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">
                    CGST ({item.gstPercent / 2}%)
                  </td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(item.cgst)}</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">
                    SGST ({item.gstPercent / 2}%)
                  </td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(item.sgst)}</td>
                </tr>
                {item.igst > 0 && (
                  <tr className="border-b border-border">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium">IGST</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(item.igst)}</td>
                  </tr>
                )}
                <tr className="border-b border-border bg-muted/30">
                  <td className="px-4 py-2.5 font-semibold">Subtotal (with GST)</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatCurrency(subtotalWithGst)}</td>
                </tr>
                {item.discountPercent > 0 ? (
                  <tr className="border-b border-border">
                    <td className="px-4 py-2.5 font-medium text-destructive">
                      <div className="flex items-center gap-2">
                        <span>Discount</span>
                        <span className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded text-xs font-bold">
                          {item.discountPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-destructive font-semibold">
                      -{formatCurrency(item.discountAmount)}
                    </td>
                  </tr>
                ) : (
                  <tr className="border-b border-border">
                    <td className="px-4 py-2.5 text-muted-foreground font-medium">Discount</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                  </tr>
                )}
                <tr className="bg-primary/5">
                  <td className="px-4 py-3 font-bold text-base">Grand Total</td>
                  <td className="px-4 py-3 text-right font-bold text-base text-accent">{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Materials Toggle */}
        <div>
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
