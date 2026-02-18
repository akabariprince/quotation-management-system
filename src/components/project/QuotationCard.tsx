import React, { useState } from "react";
import {
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Percent,
  Hash,
} from "lucide-react";
import { useMaterials } from "@/hooks/useMaterials";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

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
    },
    ref,
  ) => {
    const { hasPermission } = useAuth();
    const { woods, polishes, fabrics } = useMaterials();
    const [isExpanded, setIsExpanded] = useState(true);

    const activeWoods = woods.filter((w) => w.status === "active");
    const activePolishes = polishes.filter((p) => p.status === "active");
    const activeFabrics = fabrics.filter((f) => f.status === "active");

    const itemAmount = item.basePrice * item.quantity;
    const gstAmount = item.cgst + item.sgst + item.igst;
    const subtotalWithGst = itemAmount + gstAmount;
    const grandTotal = subtotalWithGst - item.discountAmount;

    const woodObj = item.woodId
      ? woods.find((w) => w.id === item.woodId)
      : null;
    const polishObj = item.polishId
      ? polishes.find((p) => p.id === item.polishId)
      : null;
    const fabricObj = item.fabricId
      ? fabrics.find((f) => f.id === item.fabricId)
      : null;

    const uniqueNumber =
      (item as any).projectQuotationNo || `ITM-${String(index + 1).padStart(4, "0")}`;

    return (
      <div
        ref={ref}
        className={`border rounded-xl bg-card overflow-hidden transition-all duration-500 ${
          isHighlighted
            ? "border-primary ring-2 ring-primary/30 shadow-xl scale-[1.01]"
            : "border-border hover:shadow-md"
        }`}
      >
        {/* ═══════ TOP HEADER ROW ═══════ */}
        <div className="grid grid-cols-12 border-b border-border bg-muted/50">
          {/* Cell 1: mobile=6cols, sm+=3cols (was col-span-4 causing 4+4+6=14 overflow) */}
          <div className="col-span-6 sm:col-span-3 border-r border-border px-3 py-2.5 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0">
              {item.itemNumber || index + 1}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Reference Image
            </span>
          </div>
          {/* Cell 2: hidden on mobile (mobile badge exists below), visible sm+ */}
          <div className="hidden sm:flex col-span-4 border-r border-border px-3 py-2.5 items-center justify-start">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full">
              <Hash className="h-3 w-3" />
              <span className="text-[10px] font-bold font-mono tracking-wide">
                {uniqueNumber}
              </span>
            </div>
          </div>
          {/* Cell 3: mobile=6cols, sm+=5cols */}
          <div className="col-span-6 sm:col-span-5 px-3 py-2.5 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-bold font-mono tracking-wide truncate">
                {item.quotationCode}
              </span>
              <span className="text-xs text-muted-foreground truncate hidden md:inline">
                — {item.quotationName}
              </span>
            </div>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors flex-shrink-0"
              title="Remove quotation"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </button>
          </div>
        </div>

        {/* Mobile unique number badge */}
        <div className="sm:hidden border-b border-border bg-muted/30 px-3 py-1.5 flex items-center justify-center">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            <Hash className="h-3 w-3" />
            <span className="text-[10px] font-bold font-mono tracking-wide">
              {uniqueNumber}
            </span>
          </div>
        </div>

        {/* ═══════ IMAGE + MATERIAL CIRCLES ROW ═══════ */}
        <div className="grid grid-cols-12 border-b border-border">
          <div className="col-span-12 sm:col-span-9 border-r-0 sm:border-r border-border bg-muted/5">
            <div className="w-full aspect-[16/9] overflow-hidden bg-muted/5">
              {item.images?.[0] ? (
                <img
                  src={getImageUrl(item.images[0])}
                  alt={item.quotationName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20">
                  <ImageIcon className="h-14 w-14 text-muted-foreground/30" />
                  <span className="text-[10px] text-muted-foreground/50 mt-2">
                    No image
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="col-span-12 sm:col-span-3 flex sm:flex-col items-center justify-center gap-5 py-5 px-3 border-t sm:border-t-0 border-border">
            {/* Wood Circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-14 h-14 rounded-full border-2 transition-colors ${
                  woodObj ? "border-amber-400 shadow-sm" : "border-border"
                }`}
                style={{
                  backgroundColor: woodObj ? "#D2B48C" : undefined,
                }}
                title={item.woodName || "No wood"}
              >
                {!woodObj && (
                  <div className="w-full h-full rounded-full bg-muted/40 flex items-center justify-center">
                    <span className="text-muted-foreground/40 text-lg">—</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center leading-tight max-w-[70px]">
                {item.woodName || "Wood"}
              </span>
            </div>
            {/* Polish Circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-14 h-14 rounded-full border-2 transition-colors ${
                  polishObj ? "border-purple-400 shadow-sm" : "border-border"
                }`}
                style={{
                  backgroundColor: polishObj ? "#8B6914" : undefined,
                }}
                title={item.polishName || "No polish"}
              >
                {!polishObj && (
                  <div className="w-full h-full rounded-full bg-muted/40 flex items-center justify-center">
                    <span className="text-muted-foreground/40 text-lg">—</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center leading-tight max-w-[70px]">
                {item.polishName || "Polish"}
              </span>
            </div>
            {/* Fabric Circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-14 h-14 rounded-full border-2 transition-colors ${
                  fabricObj ? "border-blue-400 shadow-sm" : "border-border"
                }`}
                style={{
                  backgroundColor: fabricObj ? "#4A90D9" : undefined,
                }}
                title={item.fabricName || "No fabric"}
              >
                {!fabricObj && (
                  <div className="w-full h-full rounded-full bg-muted/40 flex items-center justify-center">
                    <span className="text-muted-foreground/40 text-lg">—</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center leading-tight max-w-[70px]">
                {item.fabricName || "Fabric"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════ DETAILS TABLE ROW ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
          <div className="border-r-0 md:border-r border-border md:col-span-2">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground w-28 border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Description
                  </td>
                  <td className="px-3 py-2 text-sm leading-relaxed">
                    {item.description || "—"}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Length
                  </td>
                  <td className="px-3 py-2 text-sm font-medium">
                    {(item as any).length + " (mm)" || "—"}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Width
                  </td>
                  <td className="px-3 py-2 text-sm font-medium">
                    {(item as any).width + " (mm)" || "—"}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Seat Height
                  </td>
                  <td className="px-3 py-2 text-sm font-medium">
                    {(item as any).seatHeight + " (mm)" || "—"}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Sales Mgr
                  </td>
                  <td className="px-3 py-2 text-sm font-medium">
                    {salesManager || "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide w-28">
                    Price
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {formatCurrency(item.basePrice)}
                  </td>
                </tr>
                <tr className="border-b border-border/60 bg-orange-50/50 dark:bg-orange-950/10">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Discount
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-1 bg-white dark:bg-muted/50 rounded-lg px-2 py-1 border border-border shadow-sm">
                        <Input
                          type="number"
                          value={item.discountPercent}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(100, Number(e.target.value)),
                            );
                            onDiscountChange(item.id, val);
                          }}
                          className="w-18 h-6 text-xs text-right border-0 bg-transparent p-0 focus-visible:ring-0"
                          min={0}
                          max={100}
                          step={0.5}
                        />
                        <Percent className="h-3 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            item.discountAmount > 0
                              ? "text-destructive"
                              : "text-muted-foreground/50"
                          }`}
                        >
                          {item.discountAmount > 0
                            ? `-${formatCurrency(item.discountAmount)}`
                            : "₹0"}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Final Price
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {formatCurrency(
                      item.basePrice -
                        (item.quantity > 0
                          ? item.discountAmount / item.quantity
                          : 0),
                    )}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    Units
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-end gap-2">
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
                        className="w-16 h-7 text-sm text-right ml-auto"
                        min={1}
                        max={100}
                      />
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-border/60 bg-muted/20">
                  <td className="px-3 py-2 font-bold border-r border-border/60 text-[10px] uppercase tracking-wide">
                    Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">
                    {formatCurrency(itemAmount)}
                  </td>
                </tr>
                {item.igst > 0 && (
                  <tr className="border-b border-border/60">
                    <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                      IGST
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-xs">
                      {formatCurrency(item.igst)}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    CGST ({item.gstPercent / 2}%)
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">
                    {formatCurrency(item.cgst)}
                  </td>
                </tr>
                <tr className="border-b border-border/60">
                  <td className="px-3 py-2 text-muted-foreground border-r border-border/60 text-[10px] font-semibold uppercase tracking-wide">
                    SGST ({item.gstPercent / 2}%)
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-xs">
                    {formatCurrency(item.sgst)}
                  </td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-3 py-2.5 font-bold border-r border-border/60 text-[10px] uppercase tracking-wide">
                    Total with GST
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-base tabular-nums text-accent">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════ FOOTER ROW ═══════ */}
        <div className="flex flex-wrap items-center justify-between bg-muted/40 px-4 py-2 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Item #{item.itemNumber || index + 1}
            </span>
            <span className="text-[9px] font-mono text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full whitespace-nowrap">
              {uniqueNumber}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-wide whitespace-nowrap"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Hide Materials
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Edit Materials
              </>
            )}
          </button>
        </div>

        {/* ═══════ EXPANDABLE MATERIALS ═══════ */}
        {isExpanded && (
          <div className="border-t border-border bg-muted/10 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wide">
                  Wood Type
                </Label>
                <Select
                  value={item.woodId || "none"}
                  onValueChange={(v) => onUpdateMaterial(item.id, "wood", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select wood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                    {activeWoods.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wide">
                  Polish
                </Label>
                <Select
                  value={item.polishId || "none"}
                  onValueChange={(v) => onUpdateMaterial(item.id, "polish", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select polish" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                    {activePolishes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wide">
                  Fabric
                </Label>
                <Select
                  value={item.fabricId || "none"}
                  onValueChange={(v) => onUpdateMaterial(item.id, "fabric", v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select fabric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                    {activeFabrics.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

QuotationCard.displayName = "QuotationCard";

export default QuotationCard;