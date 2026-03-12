import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Loader2, FileText } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/utils/reportHelpers";

// ─── Skeleton for PDF Preview ───────────────────────────────────────────────

const PDFPreviewSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-100">
    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-36 mt-1" />
        </div>
      </div>
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
    <div className="p-4 md:p-8 flex flex-col items-center gap-8">
      <div
        className="bg-white shadow-lg"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        <div className="p-0">
          <div className="border-2 border-gray-200">
            <div className="flex border-b-2 border-gray-200">
              <div className="flex-1 p-4">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-3 w-48 mt-3" />
                <Skeleton className="h-3 w-44 mt-1" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
            </div>
            <div className="flex border-b-2 border-gray-200">
              <div className="flex-1 p-3 border-r-2 border-gray-200 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="w-40 p-3">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-4 w-24 mt-1 ml-auto" />
              </div>
            </div>
            <div className="border-b-2 border-gray-200 p-3 flex justify-center">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="flex border-b-2 border-gray-200 bg-gray-50 p-2 gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex border-b border-gray-100 p-2 gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
            <div className="flex border-t-2 border-gray-200 bg-gray-50 p-3 gap-2">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="border-t-2 border-gray-200 p-2 flex justify-between bg-gray-50">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="bg-white shadow-lg"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <div className="p-0">
            <div className="border-2 border-gray-200">
              <div className="flex border-b-2 border-gray-200">
                <div className="flex-1 p-4">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-3 w-48 mt-3" />
                </div>
              </div>
              <div className="border-b-2 border-gray-200 p-3 space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-64" />
              </div>
              <div className="border-b-2 border-gray-200 p-4 flex justify-center">
                <Skeleton className="h-80 w-96 rounded" />
              </div>
              <div className="flex border-b-2 border-gray-200">
                <div className="w-1/2 border-r-2 border-gray-200 p-3 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="w-1/2 p-3 space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex justify-between px-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-2 flex justify-between bg-gray-50">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 210mm in pixels at 96dpi
const A4_WIDTH_PX = 793.7;
// 297mm in pixels at 96dpi
const A4_HEIGHT_PX = 1122.5;

// ─── Main Component ─────────────────────────────────────────────────────────

const PDFPreview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProjectById, downloadProjectPDF } = useProjects();

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const data = await fetchProjectById(id);
        setProject(data);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  // ─── Responsive scaling ─────────────────────────────────────────────
  const updateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const padding = 32;
      const availableWidth = containerWidth - padding;
      const newScale = Math.min(1, availableWidth / A4_WIDTH_PX);
      setScale(newScale);
    }
  }, []);

  useEffect(() => {
    updateScale();
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", updateScale);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [updateScale]);

  if (loading) return <PDFPreviewSkeleton />;

  const customer = project?.customer;
  const salesPersonName = project?.salesPerson?.name || "—";

  if (!project || !customer) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg mb-4">
            Project not found
          </p>
          <Button
            onClick={() => navigate("/projects")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  const formatCurrency = (amount: number | string) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
      Number(amount) || 0,
    );

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

  const getAmount = (item: any) => {
    const basePrice = Number(item.basePrice) || 0;
    const quantity = Number(item.quantity) || 1;
    return basePrice * quantity;
  };

  const getGstAmount = (item: any) => {
    const gstPercent = Number(item.gstPercent) || 18;
    const amount = getAmount(item);
    return (amount * gstPercent) / 100;
  };

  const getDiscountAmount = (item: any) => {
    const discountPercent = Number(item.discountPercent) || 0;
    const amount = getAmount(item);
    return (amount * discountPercent) / 100;
  };

  const getPriceInclGst = (item: any) => {
    const basePrice = Number(item.basePrice) || 0;
    const gstPercent = Number(item.gstPercent) || 18;
    return basePrice + (basePrice * gstPercent) / 100;
  };

  const getTotalInclGst = (item: any) => {
    const amount = getAmount(item);
    const gst = getGstAmount(item);
    const discount = getDiscountAmount(item);
    return amount + gst - discount;
  };

  const border = "1.5px solid #000";
  const borderThin = "1px solid #000";
  const items = project.items || [];
  const pdfFont = "'Lora', serif";

  const scaledHeight = A4_HEIGHT_PX * scale;

  // ─── Company Header ──────────────────────────────────────────────────

  const CompanyHeader = () => (
    <div style={{ borderBottom: border }}>
      <div style={{ padding: "13px 20px" }}>
        <div style={{ flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="Ecstatics Logo"
            style={{ height: "70px", width: "auto", objectFit: "contain" }}
            crossOrigin="anonymous"
          />
        </div>
        <div
          style={{
            fontSize: "12px",
            color: "#333",
            lineHeight: 1.5,
            marginTop: "2px",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            Ecstatics Spaces India Pvt. Ltd.
          </div>
          <div>3120, Ganga Trueno, Airport Road,</div>
          <div>Viman Nagar, Pune</div>
          <div style={{ marginTop: "2px" }}>GST No: 27AAFCE9942B1ZM</div>
        </div>
      </div>
    </div>
  );

  // ─── Client Info Row ──────────────────────────────────────────────────

  const ClientInfoRow = () => (
    <div style={{ display: "flex", borderBottom: border }}>
      <div
        style={{
          flex: 1,
          padding: "11px 20px",
          borderRight: border,
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
          <span style={{ color: "#666", minWidth: "95px" }}>Client name</span>
          <span style={{ fontWeight: 600 }}>{customer.name}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ color: "#666", minWidth: "95px" }}>Contact No</span>
          <span>{customer.mobile}</span>
        </div>
      </div>
      <div
        style={{
          width: "170px",
          padding: "11px 20px",
          fontSize: "13px",
          textAlign: "right",
        }}
      >
        <div style={{ color: "#666", marginBottom: "5px" }}>Date</div>
        <div style={{ fontWeight: 600 }}>{formatDate(project.date)}</div>
      </div>
    </div>
  );

  // ─── Page Footer ──────────────────────────────────────────────────────

  const PageFooter = () => (
    <div
      style={{
        borderTop: border,
        padding: "9px 20px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        color: "#555",
        backgroundColor: "#fafafa",
      }}
    >
      <span>(+91) 7066 46 6060</span>
      <span>info@esipl.in</span>
    </div>
  );

  // ─── Terms Data ───────────────────────────────────────────────────────

  const termsAndConditions = [
    "The quotation is valid for a period of 30 days from the date of this offer.",
    "The order shall be processed only after receipt of the purchase order and 70% advance payment from the client.",
    "The order shall be dispatched only after receipt of the remaining 30% balance payment.",
    "The order shall be dispatched within 3 working days after receipt of the final payment.",
    "Transfer of property in goods shall occur once the goods are dispatched to the customer. Ecstatics shall ensure repair or replacement in case of transit damage.",
    "In case of cancellation of the order at any stage for any reason, the amount collected shall stand forfeited.",
    "After delivery, if the customer is unable to accept the products at site for any reason, the client shall be responsible for any damages to the products.",
    "Godown demurrage charges of ₹3,000 per week shall be levied if delivery is not accepted after intimation. Products will be held for a maximum of 4 weeks, post which the order will be cancelled and the amount collected will be forfeited.",
    "Invoice shall be issued in the name mentioned in the purchase order received from the client.",
    "All rights related to photography, videography, and promotional activities of the products before and after delivery are reserved with Ecstatics Spaces India Pvt. Ltd.",
    "Expenses related to logistics, transportation, unloading, and on-site placement of products shall be in the client's scope.",
    "A tolerance of up to 50mm shall be acceptable in the gross dimensions of the products.",
    "All products shall be dispatched from the Sangamner godown.",
    "All disputes are subject to Pune jurisdiction only.",
    "All prices are mentioned in INR.",
  ];

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100" ref={containerRef}>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body {
            margin: 0 !important; padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important; height: auto !important;
          }
          body > * { display: none !important; }
          body > #root { display: block !important; }
          #root > * { display: none !important; }
          #root .print-root { display: block !important; }
          .no-print { display: none !important; }
          .print-container {
            display: block !important; padding: 0 !important;
            margin: 0 !important; overflow: visible !important;
            height: auto !important; width: auto !important;
          }
          .pdf-page {
            width: 210mm !important; height: 297mm !important;
            min-height: 297mm !important; max-height: 297mm !important;
            padding: 12mm !important; margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            font-family: 'Lora', serif !important;
            transform: none !important;
          }
          .pdf-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .pdf-pages-wrapper {
            padding: 0 !important; gap: 0 !important;
            display: block !important; overflow: visible !important;
          }
          .pdf-page-wrapper {
            height: auto !important;
            width: auto !important;
            overflow: visible !important;
          }
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .min-h-screen {
            min-height: auto !important; overflow: visible !important;
          }
        }
        @media screen {
          .pdf-page {
            width: 210mm;
            min-height: 297mm;
            background: #fff;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            padding: 12mm;
            transform-origin: top center;
            transform: scale(${scale});
          }
          .pdf-page-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            height: ${scaledHeight}px;
            overflow: hidden;
          }
        }
      `}</style>

      {/* ─── Toolbar ─────────────────────────────────────────────── */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm sm:text-base">
              PDF Preview
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[140px] sm:max-w-none">
              {project.quotationNo || project.quotation_no}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={() => navigate(`/projects/${id}`)}
            variant="outline"
            size="sm"
            className="gap-2 hidden sm:flex"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Project
          </Button>
          <Button
            onClick={() => downloadProjectPDF(project.id)}
            className="btn-accent gap-1 sm:gap-2 text-xs sm:text-sm"
            size="sm"
          >
            <Printer className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* ─── Print Container ─────────────────────────────────────── */}
      <div
        ref={printRef}
        className="print-root print-container pdf-pages-wrapper p-4 md:p-8 flex flex-col items-center"
        style={{ gap: `${Math.max(16, 32 * scale)}px` }}
      >
        {/* ═══════════════════════════════════════════════════════
            PAGE 1: PROJECT SUMMARY
            ═══════════════════════════════════════════════════════ */}
        <div className="pdf-page-wrapper">
          <div className="pdf-page" style={{ fontFamily: pdfFont }}>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  border,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "0",
                }}
              >
                <CompanyHeader />
                <ClientInfoRow />

                {/* Summary Title */}
                <div
                  style={{
                    borderBottom: border,
                    padding: "9px 20px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  Quotation Summary
                </div>

                {/* Summary Table */}
                <div style={{ flex: 1 }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f6" }}>
                        <th
                          style={{
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "9px 12px",
                            textAlign: "center",
                            fontWeight: 700,
                            width: "55px",
                            fontSize: "12.5px",
                          }}
                        >
                          Sr no
                        </th>
                        <th
                          style={{
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "9px 12px",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "12.5px",
                          }}
                        >
                          Code
                        </th>
                        <th
                          style={{
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "9px 12px",
                            textAlign: "right",
                            fontWeight: 700,
                            fontSize: "12.5px",
                          }}
                        >
                          Price{" "}
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: "11px",
                              color: "#666",
                            }}
                          >
                            (inc. of gst)
                          </span>
                        </th>
                        <th
                          style={{
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "9px 12px",
                            textAlign: "center",
                            fontWeight: 700,
                            width: "65px",
                            fontSize: "12.5px",
                          }}
                        >
                          Units
                        </th>
                        <th
                          style={{
                            borderBottom: border,
                            padding: "9px 12px",
                            textAlign: "right",
                            fontWeight: 700,
                            fontSize: "12.5px",
                          }}
                        >
                          Total{" "}
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: "11px",
                              color: "#666",
                            }}
                          >
                            (incl. of gst)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any, index: number) => (
                        <tr key={item.id}>
                          <td
                            style={{
                              borderBottom: "1px solid #ccc",
                              borderRight: borderThin,
                              padding: "9px 12px",
                              textAlign: "center",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #ccc",
                              borderRight: borderThin,
                              padding: "9px 12px",
                              fontWeight: 500,
                            }}
                          >
                            {item.quotationName +
                              "  (" +
                              item.quotationCode +
                              ")"}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #ccc",
                              borderRight: borderThin,
                              padding: "9px 12px",
                              textAlign: "right",
                            }}
                          >
                            {formatCurrency(getPriceInclGst(item))}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #ccc",
                              borderRight: borderThin,
                              padding: "9px 12px",
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}
                          </td>
                          <td
                            style={{
                              borderBottom: "1px solid #ccc",
                              padding: "9px 12px",
                              textAlign: "right",
                              fontWeight: 500,
                            }}
                          >
                            {formatCurrency(item.totalWithGst)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: "#f9f9f9" }}>
                        <td
                          colSpan={4}
                          style={{
                            borderTop: border,
                            borderRight: borderThin,
                            padding: "11px 12px",
                            textAlign: "center",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}
                        >
                          Grand Total{" "}
                          <span
                            style={{
                              fontWeight: 500,
                              fontSize: "12px",
                              color: "#555",
                            }}
                          >
                            (incl. of gst)
                          </span>
                        </td>
                        <td
                          style={{
                            borderTop: border,
                            padding: "11px 12px",
                            textAlign: "right",
                            fontWeight: 800,
                            fontSize: "14px",
                          }}
                        >
                          {formatCurrency(project.grandTotalWithGst)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bottom Section */}
                <div style={{ borderTop: border, display: "flex" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "13px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Sales Manager
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        marginTop: "3px",
                      }}
                    >
                      {salesPersonName}
                    </div>
                  </div>

                </div>

                <PageFooter />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            PRODUCT DETAIL PAGES
            ═══════════════════════════════════════════════════════ */}
        {items.map((item: any, index: number) => (
          <div key={item.id} className="pdf-page-wrapper">
            <div className="pdf-page" style={{ fontFamily: pdfFont }}>
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    border,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CompanyHeader />

                  {/* Note */}
                  {item.specialNote && (
                    <div
                      style={{
                        borderBottom: border,
                        padding: "9px 20px",
                        fontSize: "12.5px",
                        lineHeight: 1.7,
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>Note: </span>
                      <span style={{ color: "#333" }}>{item.specialNote}</span>
                    </div>
                  )}

                  <ClientInfoRow />

                  {/* Product Name + CODE */}
                  <div style={{ display: "flex", borderBottom: borderThin }}>
                    <div
                      style={{
                        flex: 1,
                        padding: "7px 13px",
                        borderRight: borderThin,
                        fontWeight: 600,
                        fontSize: "13px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      {item.quotationName}
                    </div>
                    <div style={{ display: "flex" }}>
                      <div
                        style={{
                          padding: "7px 13px",
                          borderRight: borderThin,
                          fontWeight: 700,
                          fontSize: "13px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        CODE
                      </div>
                      <div
                        style={{
                          padding: "7px 16px",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        {item.quotationCode}
                      </div>
                    </div>
                  </div>

                  {/* Large Image */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderBottom: borderThin,
                    }}
                  >
                    {item.images?.[0] ? (
                      <img
                        src={getImageUrl(item.images[0])}
                        alt={item.quotationName}
                        style={{
                          maxHeight: "400px",
                          width: "auto",
                          height: "auto",
                          objectFit: "contain",
                          display: "block",
                        }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div
                        style={{
                          color: "#999",
                          fontSize: "17px",
                          textAlign: "center",
                          padding: "40px",
                        }}
                      >
                        No Image Available
                      </div>
                    )}
                  </div>

                  {/* Bottom: Description (left) + Pricing (right) */}
                  <div style={{ display: "flex", borderBottom: border }}>
                    {/* LEFT - Description */}
                    <div
                      style={{
                        width: "50%",
                        borderRight: border,
                        fontSize: "13px",
                      }}
                    >
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <tbody>
                          <tr>
                            <td
                              colSpan={2}
                              style={{
                                padding: "6px 13px",
                                fontWeight: 600,
                                fontSize: "13px",
                              }}
                            >
                              Description
                            </td>
                          </tr>

                          {item.description && (
                            <tr>
                              <td
                                colSpan={2}
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                  fontSize: "12px",
                                  color: "#444",
                                  lineHeight: 1.5,
                                }}
                              >
                                {item.description}
                              </td>
                            </tr>
                          )}

                          {item.woodName && (
                            <tr>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                  color: "#555",
                                  width: "110px",
                                }}
                              >
                                Wood
                              </td>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                }}
                              >
                                : {item.woodName}
                              </td>
                            </tr>
                          )}
                          {item.polishName && (
                            <tr>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                  color: "#555",
                                }}
                              >
                                Polish
                              </td>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                }}
                              >
                                : {item.polishName}
                              </td>
                            </tr>
                          )}
                          {item.fabricName && (
                            <tr>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                  color: "#555",
                                }}
                              >
                                Fabric
                              </td>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                }}
                              >
                                : {item.fabricName}
                              </td>
                            </tr>
                          )}

                          {(item as any).quotation?.length && (
                            <tr>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                  color: "#555",
                                }}
                              >
                                Length
                              </td>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                }}
                              >
                                : {(item as any).quotation.length} (mm)
                              </td>
                            </tr>
                          )}
                          {(item as any).quotation?.width && (
                            <tr>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                  color: "#555",
                                }}
                              >
                                Width
                              </td>
                              <td
                                style={{
                                  padding: "5px 13px",
                                  borderBottom: borderThin,
                                }}
                              >
                                : {(item as any).quotation.width} (mm)
                              </td>
                            </tr>
                          )}

                          <tr>
                            <td
                              colSpan={2}
                              style={{
                                padding: "9px 13px",
                                verticalAlign: "bottom",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                  marginTop: "5px",
                                }}
                              >
                                Sales Manager
                              </div>
                              <div
                                style={{ fontWeight: 600, fontSize: "13px" }}
                              >
                                {salesPersonName}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* RIGHT - Pricing */}
                    <div style={{ width: "50%", fontSize: "13px" }}>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <tbody>
                          <tr>
                            <td
                              style={{
                                padding: "7px 13px",
                                borderBottom: borderThin,
                                fontWeight: 500,
                              }}
                            >
                              Price{" "}
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#666",
                                  fontWeight: 400,
                                }}
                              >
                                (inc. of gst)
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "7px 13px",
                                borderBottom: borderThin,
                                textAlign: "right",
                                fontWeight: 600,
                              }}
                            >
                              {formatCurrency(getPriceInclGst(item))}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style={{
                                padding: "7px 13px",
                                borderBottom: borderThin,
                              }}
                            >
                              Discount{" "}
                              <span
                                style={{ fontSize: "12px", color: "#666" }}
                              >
                                ({Number(item.discountPercent)}%)
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "7px 13px",
                                borderBottom: borderThin,
                                textAlign: "right",
                                color: "#c00",
                                fontWeight: 500,
                              }}
                            >
                              -{formatCurrency(getDiscountAmount(item))}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style={{
                                padding: "7px 13px",
                                borderBottom: borderThin,
                              }}
                            >
                              Units
                            </td>
                            <td
                              style={{
                                padding: "7px 13px",
                                borderBottom: borderThin,
                                textAlign: "right",
                                fontWeight: 500,
                              }}
                            >
                              {item.quantity}
                            </td>
                          </tr>

                          <tr style={{ backgroundColor: "#f9f9f9" }}>
                            <td
                              style={{
                                padding: "9px 13px",
                                borderBottom: borderThin,
                                fontWeight: 700,
                                fontSize: "14px",
                              }}
                            >
                              Final Price{" "}
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#555",
                                  fontWeight: 500,
                                }}
                              >
                                (incl. of gst)
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "9px 13px",
                                borderBottom: borderThin,
                                textAlign: "right",
                                fontWeight: 700,
                                fontSize: "14px",
                              }}
                            >
                              {formatCurrency(getTotalInclGst(item))}
                            </td>
                          </tr>

                          <tr>
                            <td
                              style={{
                                padding: "7px 13px",
                                textAlign: "left",
                              }}
                            >
                              Quotation
                            </td>
                            <td
                              style={{
                                padding: "7px 13px",
                                textAlign: "right",
                                fontWeight: 700,
                                fontSize: "16px",
                              }}
                            >
                              {index + 1}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      padding: "9px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#555",
                      backgroundColor: "#fafafa",
                    }}
                  >
                    <span>(+91) 7066 46 6060</span>
                    <span>info@esipl.in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ═══════════════════════════════════════════════════════
            TERMS & CONDITIONS PAGE
            ═══════════════════════════════════════════════════════ */}
        <div className="pdf-page-wrapper">
          <div className="pdf-page" style={{ fontFamily: pdfFont }}>
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  border,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div style={{ borderBottom: border }}>
                  <div
                    style={{
                      padding: "13px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ flexShrink: 0 }}>
                        <img
                          src="/logo.png"
                          alt="Ecstatics Logo"
                          style={{
                            height: "70px",
                            width: "auto",
                            objectFit: "contain",
                          }}
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#333",
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          Ecstatics Spaces India Pvt. Ltd.
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "19px", fontWeight: 700 }}>
                      Terms & Conditions
                    </div>
                  </div>
                </div>

                {/* Terms Content */}
                <div
                  style={{
                    flex: 1,
                    padding: "22px 26px",
                    fontSize: "13px",
                    lineHeight: 1.8,
                    color: "#222",
                  }}
                >
                  <ol style={{ paddingLeft: "20px", margin: 0 }}>
                    {termsAndConditions.map((term, i) => (
                      <li
                        key={i}
                        style={{ marginBottom: "9px", paddingLeft: "5px" }}
                      >
                        {term}
                      </li>
                    ))}
                  </ol>
                </div>

                <PageFooter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;