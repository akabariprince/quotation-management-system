import React, { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Percent,
  Hash,
  Lock,
} from "lucide-react";
import { useMaterials } from "@/hooks/useMaterials";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getImageUrl } from "@/utils/reportHelpers";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

interface DiscountRange {
  min: number;
  max: number;
}

interface QuotationCardProps {
  item: any;
  index: number;
  isHighlighted: boolean;
  onUpdateItem: (itemId: string, field: string, value: any) => void;
  onUpdateMaterial: (
    itemId: string,
    type: "wood" | "polish" | "fabric",
    value: string,
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onDiscountChange: (itemId: string, newDiscount: number) => void;
  salesManager?: string;
  discountRange?: DiscountRange;
}

/* ── Debounced Discount Input ── */
interface DebouncedDiscountInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  delay?: number;
}

const DebouncedDiscountInput: React.FC<DebouncedDiscountInputProps> = ({
  value,
  min,
  max,
  onChange,
  delay = 600,
}) => {
  const [localValue, setLocalValue] = useState<string>(String(value));
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userEditingRef = useRef(false);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!userEditingRef.current) setLocalValue(String(value));
  }, [value]);

  useEffect(() => {
    if (!userEditingRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const num = Number(localValue);
      if (!isNaN(num)) {
        const clamped = Math.max(min, Math.min(max, num));
        userEditingRef.current = false;
        onChangeRef.current(clamped);
      }
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [localValue, min, max, delay]);

  return (
    <Input
      type="number"
      value={localValue}
      onChange={(e) => {
        userEditingRef.current = true;
        setLocalValue(e.target.value);
      }}
      className="w-full h-6 sm:h-7 text-[11px] sm:text-xs text-right border-0 bg-transparent p-0 px-1 focus-visible:ring-0"
      min={min}
      max={max}
      step={0.5}
    />
  );
};

/* ── Main Quotation Card ── */
const QuotationCard = React.forwardRef<HTMLDivElement, QuotationCardProps>(
  (
    {
      item,
      index,
      isHighlighted,
      onUpdateItem,
      onUpdateMaterial,
      onRemoveItem,
      onDiscountChange,
      salesManager,
      discountRange,
    },
    ref,
  ) => {
    const { hasPermission } = useAuth();
    const { woods, polishes, fabrics } = useMaterials();
    const [isExpanded, setIsExpanded] = useState(true);

    const canEditDiscount = hasPermission("discount:edit");
    const canEditQuantity = hasPermission("quantity:edit");
    const dMin = discountRange?.min ?? 0;
    const dMax = discountRange?.max ?? 100;

    // const activeWoods = woods.filter((w) => w.status === "active");
    // const activePolishes = polishes.filter((p) => p.status === "active");
    // const activeFabrics = fabrics.filter((f) => f.status === "active");

    const itemAmount = item.basePrice * item.quantity;
    const gstAmount = item.cgst + item.sgst + item.igst;
    const subtotalWithGst = itemAmount + gstAmount;
    const grandTotal = subtotalWithGst - item.discountAmount;

    // const woodObj = item.woodId ? woods.find((w) => w.id === item.woodId) : null;
    // const polishObj = item.polishId ? polishes.find((p) => p.id === item.polishId) : null;
    // const fabricObj = item.fabricId ? fabrics.find((f) => f.id === item.fabricId) : null;

    const uniqueNumber =
      (item as any).uniqueNumber ||
      (item as any).projectQuotationNo ||
      (item as any).quotationCode ||
      "ITEM-0000";

    return (
      <div
        ref={ref}
        className={`border bg-card overflow-hidden transition-all duration-500 ${isHighlighted
            ? "border-primary ring-2 ring-primary/30 shadow-xl scale-[1.01]"
            : "border-border hover:shadow-md"
          }`}
      >
        {/* ═══════ TOP HEADER ROW ═══════ */}
        <div className="grid grid-cols-12 border-b border-border bg-muted/50">
          <div className="col-span-6 sm:col-span-4 md:col-span-3 border-r border-border px-2 sm:px-3 py-2 sm:py-2.5 flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold flex items-center justify-center flex-shrink-0">
              {item.itemNumber || index + 1}
            </span>
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-muted-foreground truncate">
              {item.quotationName}
            </span>
          </div>
          <div className="hidden sm:flex col-span-3 md:col-span-4 border-r border-border px-2 sm:px-3 py-2 sm:py-2.5 items-center justify-start">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 sm:py-1">
              <Hash className="h-3 w-3" />
              <span className="text-[9px] sm:text-[10px] font-bold font-mono tracking-wide">
                {uniqueNumber}
              </span>
            </div>
          </div>
          <div className="col-span-6 sm:col-span-5 px-2 sm:px-3 py-2 sm:py-2.5 flex items-center justify-between min-w-0">
            <span className="text-xs sm:text-sm font-bold font-mono tracking-wide truncate">
              {item.quotationCode}
            </span>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-1 sm:p-1.5 hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0 ml-2"
              title="Remove quotation"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
            </button>
          </div>
        </div>

        {/* Mobile unique number badge */}
        <div className="sm:hidden border-b border-border bg-muted/30 px-3 py-1.5 flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1">
            <Hash className="h-3 w-3" />
            <span className="text-[10px] font-bold font-mono tracking-wide">
              {uniqueNumber}
            </span>
          </div>
        </div>

        {/* ═══════ IMAGE ROW ═══════ */}
        <div className="grid grid-cols-12 border-b border-border">
          <div className="col-span-12 sm:col-span-12 border-r-0 sm:border-r border-border bg-muted/5">
            <div className="w-full aspect-[16/9] overflow-hidden bg-muted/5">
              {item.images?.[0] ? (
                <img
                  src={getImageUrl(item.images[0])}
                  alt={item.quotationName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
                  <ImageIcon className="h-10 w-10 sm:h-14 sm:w-14 text-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/50 mt-2">
                    No image
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Material circles - COMMENTED OUT */}
          {/*
          <div className="col-span-12 sm:col-span-3 flex sm:flex-col items-center justify-center gap-4 sm:gap-5 py-4 sm:py-5 px-3 border-t sm:border-t-0 border-border">
            ... wood, polish, fabric circles ...
          </div>
          */}
        </div>

        {/* ═══════ DETAILS + PRICING TABLE ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
          {/* Left: Info */}
          <div className="border-r-0 md:border-r border-border md:col-span-2">
            <table className="w-full text-xs sm:text-sm">
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground w-20 sm:w-28 border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    Description
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm leading-relaxed">
                    {item.description || "—"}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    Length
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
                    {(item as any).length
                      ? (item as any).length + " (mm)"
                      : "—"}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    Width
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
                    {(item as any).width ? (item as any).width + " (mm)" : "—"}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    Sales Mgr
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium">
                    {salesManager || "—"}
                  </td>
                </tr>
                <tr>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide align-top">
                    Special Note
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                    <Textarea
                      value={item.specialNote || ""}
                      onChange={(e) =>
                        onUpdateItem(item.id, "specialNote", e.target.value)
                      }
                      placeholder="Add any special instructions or notes..."
                      className="min-h-[100px] sm:min-h-[100px] text-xs sm:text-sm resize-none"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right: Pricing */}
          <div>
            <table className="w-full text-xs sm:text-sm">
              <tbody>
                {/* Price */}
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide w-20 sm:w-28">
                    Price
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-semibold tabular-nums text-xs sm:text-sm">
                    {formatCurrency(item.basePrice)}
                  </td>
                </tr>

                {/* Discount % */}
                <tr className="border-b border-border/60 bg-orange-50/50 dark:bg-orange-950/10">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Disc. %
                      {!canEditDiscount && (
                        <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                      )}
                    </div>
                    {canEditDiscount && (dMin > 0 || dMax < 100) && (
                      <span className="text-[7px] sm:text-[8px] font-normal text-orange-500/70 block leading-tight mt-0.5">
                        {dMin}% – {dMax}%
                      </span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-1 sm:py-1.5">
                    {canEditDiscount ? (
                      <div className="flex items-center gap-1 bg-white dark:bg-muted/50 rounded-lg px-1.5 sm:px-2 py-0.5 border border-border shadow-sm">
                        <DebouncedDiscountInput
                          value={item.discountPercent}
                          min={dMin}
                          max={dMax}
                          onChange={(val) => onDiscountChange(item.id, val)}
                          delay={700}
                        />
                        <Percent className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2 py-1 border border-border/50">
                        <Lock className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] sm:text-xs font-medium tabular-nums text-muted-foreground">
                          {item.discountPercent}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>

                {/* Discount Amount */}
                <tr className="border-b border-border/60 bg-orange-50/30 dark:bg-orange-950/5">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    Disc. Amt
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right">
                    <span
                      className={`text-xs sm:text-sm font-semibold tabular-nums ${item.discountAmount > 0
                          ? "text-destructive"
                          : "text-muted-foreground/50"
                        }`}
                    >
                      {item.discountAmount > 0
                        ? `-${formatCurrency(item.discountAmount)}`
                        : "₹0"}
                    </span>
                  </td>
                </tr>

                {/* Final Price */}
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    Final Price
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-semibold tabular-nums text-xs sm:text-sm">
                    {formatCurrency(
                      item.basePrice -
                      (item.quantity > 0
                        ? item.discountAmount / item.quantity
                        : 0),
                    )}
                  </td>
                </tr>

                {/* Units */}
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      Units
                      {!canEditQuantity && (
                        <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 py-1 sm:py-1.5">
                    <div className="flex items-center justify-end">
                      {canEditQuantity ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(
                              1,
                              Math.min(100, Number(e.target.value)),
                            );
                            onUpdateItem(item.id, "quantity", val);
                          }}
                          className="w-14 sm:w-16 h-6 sm:h-7 text-xs sm:text-sm text-right"
                          min={1}
                          max={100}
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2 py-1 border border-border/50">
                          <Lock className="h-3 w-3 text-muted-foreground/40" />
                          <span className="text-xs sm:text-sm font-medium tabular-nums text-muted-foreground">
                            {item.quantity}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Total */}
                <tr className="border-b border-border/60 bg-muted/20">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-bold border-r border-border/60 text-[9px] sm:text-[10px] uppercase tracking-wide">
                    Total
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-bold tabular-nums text-xs sm:text-sm">
                    {formatCurrency(itemAmount)}
                  </td>
                </tr>

                {/* IGST */}
                {item.igst > 0 && (
                  <tr className="border-b border-border/60">
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                      IGST
                    </td>
                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right tabular-nums text-[10px] sm:text-xs">
                      {formatCurrency(item.igst)}
                    </td>
                  </tr>
                )}

                {/* CGST */}
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    CGST ({item.gstPercent / 2}%)
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right tabular-nums text-[10px] sm:text-xs">
                    {formatCurrency(item.cgst)}
                  </td>
                </tr>

                {/* SGST */}
                <tr className="border-b border-border/60">
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-muted-foreground border-r border-border/60 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">
                    SGST ({item.gstPercent / 2}%)
                  </td>
                  <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right tabular-nums text-[10px] sm:text-xs">
                    {formatCurrency(item.sgst)}
                  </td>
                </tr>

                {/* Grand Total */}
                <tr className="bg-primary/5">
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 font-bold border-r border-border/60 text-[9px] sm:text-[10px] uppercase tracking-wide">
                    Total w/GST
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right font-bold text-sm sm:text-base tabular-nums text-accent">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════ FOOTER ROW — COMMENTED OUT ═══════ */}
        {/*
        <div className="flex flex-wrap items-center justify-between bg-muted/40 px-3 sm:px-4 py-1.5 sm:py-2 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Item #{item.itemNumber || index + 1}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono text-primary/70 bg-primary/5 px-1.5 sm:px-2 py-0.5 whitespace-nowrap">
              {uniqueNumber}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide whitespace-nowrap"
          >
            {isExpanded ? (
              <><ChevronUp className="h-3 w-3" /> Hide Materials</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Edit Materials</>
            )}
          </button>
        </div>
        */}

        {/* ═══════ EXPANDABLE MATERIALS — COMMENTED OUT ═══════ */}
        {/*
        {isExpanded && (
          <div className="border-t border-border bg-muted/10 p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">Wood Type</Label>
                <Select value={item.woodId || "none"} onValueChange={(v) => onUpdateMaterial(item.id, "wood", v)}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue placeholder="Select wood" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                    {activeWoods.map((w) => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">Polish</Label>
                <Select value={item.polishId || "none"} onValueChange={(v) => onUpdateMaterial(item.id, "polish", v)}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue placeholder="Select polish" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                    {activePolishes.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide">Fabric</Label>
                <Select value={item.fabricId || "none"} onValueChange={(v) => onUpdateMaterial(item.id, "fabric", v)}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue placeholder="Select fabric" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none"><span className="text-muted-foreground">None</span></SelectItem>
                    {activeFabrics.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        */}
      </div>
    );
  },
);

QuotationCard.displayName = "QuotationCard";
export default QuotationCard;
