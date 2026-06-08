import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/utils/reportHelpers";

// ─── Skeleton Component ───────────────────────────────────

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
      />
    </div>
  </div>
);

const A4_WIDTH_PX = 793.7;
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

  const border = "1px solid #000";
  const borderThin = "1px solid #ccc";
  const items = project.items || [];
  const pdfFont =
    "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const getMergedSelections = (
    item: any,
  ): Array<{ label: string; values: string[] }> => {
    const rows = (item.selections || []).flatMap((selection: any) =>
      (selection.values || [])
        .filter(
          (value: any) =>
            value &&
            typeof value.value === "string" &&
            value.value.trim() &&
            value.value !== "N.A.",
        )
        .map((value: any) => ({
          label: selection.selectionName || "Selection",
          value: value.value,
        })),
    );

    const grouped = new Map<string, string[]>();
    rows.forEach((row) => {
      if (!grouped.has(row.label)) {
        grouped.set(row.label, []);
      }
      grouped.get(row.label)!.push(row.value);
    });

    return Array.from(grouped.entries()).map(([label, values]) => ({
      label,
      values,
    }));
  };

  const getSelectionBoxes = (item: any): string[] => {
    const mergedSelections = getMergedSelections(item);
    const boxes: string[] = [];

    const multiValueItems: { label: string; values: string[] }[] = [];
    const singleValueItems: { label: string; values: string[] }[] = [];

    mergedSelections.forEach((sel) => {
      if (sel.values.length >= 2) {
        multiValueItems.push(sel);
      } else if (sel.values.length === 1) {
        singleValueItems.push(sel);
      }
    });

    multiValueItems.forEach((sel) => {
      sel.values.slice(0, 2).forEach((value) => {
        boxes.push(`${sel.label}: ${value}`);
      });
    });

    singleValueItems.forEach((sel) => {
      boxes.push(`${sel.label}: ${sel.values[0]}`);
    });

    while (boxes.length < 20) {
      boxes.push("");
    }

    return boxes.slice(0, 20);
  };

  const scaledHeight = A4_HEIGHT_PX * scale;

  // ─── Company Header ──────────────────────────────────────────────────

  const CompanyHeader = () => (
    <div style={{ borderBottom: border }}>
      <div
        style={{
          padding: "12px 17px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "17px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", color: "#333", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600 }}>
              Ecstatics Spaces India Pvt. Ltd.
            </div>
            <div>3120, Ganga Trueno, Airport Road,</div>
            <div>Viman Nagar, Pune</div>
            <div style={{ marginTop: "2px" }}>GST No: 27AAFCE9942B1ZM</div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="Ecstatics Logo"
            style={{ height: "75px", width: "auto", objectFit: "contain" }}
            crossOrigin="anonymous"
          />
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
          padding: "11px 17px",
          borderRight: border,
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
          <span style={{ color: "#666", minWidth: "100px" }}>Client name</span>
          <span style={{ fontWeight: 600 }}>{customer.name || ""}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
          <span style={{ color: "#666", minWidth: "100px" }}>Contact No</span>
          <span>{customer.mobile || ""}</span>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
          <span style={{ color: "#666", minWidth: "100px" }}>Project Name</span>
          <span style={{ fontWeight: 600 }}>{project.projectName || "—"}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ color: "#666", minWidth: "100px" }}>Project No</span>
          <span style={{ fontWeight: 600 }}>{project.projectNo || "—"}</span>
        </div>
      </div>
      <div
        style={{
          width: "170px",
          minWidth: "170px",
          padding: "11px 17px",
          fontSize: "15px",
          textAlign: "left",
        }}
      >
        <div style={{ color: "#666", marginBottom: "5px", fontWeight: 600 }}>
          Date
        </div>
        <div style={{ fontWeight: 600, color: "#111" }}>
          {formatDate(project.date)}
        </div>
      </div>
    </div>
  );

  // ─── Page Footer ──────────────────────────────────────────────────────

  const PageFooter = () => (
    <div
      style={{
        borderTop: border,
        padding: "9px 17px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
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
        @import url("https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap");
        
        @media print {
          @page { size: A4; margin: 0; }
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
            padding: 10mm !important; margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            font-family: 'Satoshi', sans-serif !important;
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
            padding: 10mm;
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
      <div className="no-print sticky top-0 bg-card border-b border-border p-2 sm:p-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold leading-none">PDF Preview</h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[140px] sm:max-w-none">
              {project.quotationNo || project.quotation_no}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            onClick={() => navigate(`/projects/${id}`)}
            variant="outline"
            className="gap-1 h-7 text-xs px-2 hidden sm:flex"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Project</span>
          </Button>
          <Button
            onClick={() => downloadProjectPDF(project.id)}
            className="btn-accent gap-1 h-7 text-xs px-2"
          >
            <Printer className="h-3 w-3" /> PDF
          </Button>
        </div>
      </div>

      {/* ─── Print Container ─────────────────────────────────────── */}
      <div
        ref={printRef}
        className="print-root print-container pdf-pages-wrapper p-4 md:p-8 flex flex-col items-center"
        style={{ gap: `${Math.max(16, 32 * scale)}px` }}
      >
        {/* PAGE 1: PROJECT SUMMARY */}
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
                <CompanyHeader />
                <ClientInfoRow />

                <div
                  style={{
                    borderBottom: border,
                    padding: "10px 17px",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "17px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  Quotation Summary
                </div>

                <div style={{ flex: 1 }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#f3f4f6" }}>
                        <th
                          style={{
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "10px 12px",
                            textAlign: "center",
                            fontWeight: 600,
                            width: "60px",
                            fontSize: "13.5px",
                          }}
                        >
                          Sr no
                        </th>
                        <th
                          style={{
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "10px 12px",
                            textAlign: "left",
                            fontWeight: 600,
                            fontSize: "13.5px",
                          }}
                        >
                          Code
                        </th>
                        <th
                          style={{
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "10px 12px",
                            textAlign: "right",
                            fontWeight: 600,
                            fontSize: "13.5px",
                          }}
                        >
                          Price{" "}
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: "12px",
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
                            padding: "10px 12px",
                            textAlign: "center",
                            fontWeight: 600,
                            width: "70px",
                            fontSize: "13.5px",
                          }}
                        >
                          Units
                        </th>
                        <th
                          style={{
                            borderBottom: border,
                            padding: "10px 12px",
                            textAlign: "right",
                            fontWeight: 600,
                            fontSize: "13.5px",
                          }}
                        >
                          Total{" "}
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: "12px",
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
                              borderBottom: borderThin,
                              borderRight: borderThin,
                              padding: "10px 12px",
                              textAlign: "center",
                              fontSize: "14px",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              borderBottom: borderThin,
                              borderRight: borderThin,
                              padding: "10px 12px",
                              fontWeight: 500,
                              fontSize: "14px",
                            }}
                          >
                            {item.quotationCode}
                          </td>
                          <td
                            style={{
                              borderBottom: borderThin,
                              borderRight: borderThin,
                              padding: "10px 12px",
                              textAlign: "right",
                              fontSize: "14px",
                            }}
                          >
                            {formatCurrency(getPriceInclGst(item))}
                          </td>
                          <td
                            style={{
                              borderBottom: borderThin,
                              borderRight: borderThin,
                              padding: "10px 12px",
                              textAlign: "center",
                              fontSize: "14px",
                            }}
                          >
                            {item.quantity}
                          </td>
                          <td
                            style={{
                              borderBottom: borderThin,
                              padding: "10px 12px",
                              textAlign: "right",
                              fontWeight: 500,
                              fontSize: "14px",
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
                            borderBottom: border,
                            borderRight: borderThin,
                            padding: "12px",
                            textAlign: "center",
                            fontWeight: 600,
                            fontSize: "15px",
                          }}
                        >
                          Grand Total{" "}
                          <span
                            style={{
                              fontWeight: 500,
                              fontSize: "13px",
                              color: "#555",
                            }}
                          >
                            (incl. of gst)
                          </span>
                        </td>
                        <td
                          style={{
                            borderTop: border,
                            borderBottom: border,
                            padding: "12px",
                            textAlign: "right",
                            fontWeight: 600,
                            fontSize: "15px",
                          }}
                        >
                          {formatCurrency(project.grandTotalWithGst)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ borderTop: border, display: "flex" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "13px 17px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      Sales Manager
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
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

        {/* PRODUCT DETAIL PAGES */}
        {items.map((item: any, index: number) => {
          const selectionBoxes = getSelectionBoxes(item);

          return (
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
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CompanyHeader />
                    <ClientInfoRow />

                    {/* Product Name + CODE */}
                    <div style={{ display: "flex", borderBottom: border }}>
                      <div
                        style={{
                          flex: 1,
                          padding: "7px 14px",
                          borderRight: border,
                          fontWeight: 600,
                          fontSize: "14px",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        {item.quotationName || "-"}
                      </div>
                      <div
                        style={{
                          width: "170px",
                          minWidth: "170px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            padding: "7px 2px",
                            borderRight: border,
                            fontWeight: 600,
                            fontSize: "14px",
                            backgroundColor: "#f9f9f9",
                            textAlign: "center",
                          }}
                        >
                          CODE
                        </div>
                        <div
                          style={{
                            flex: 1,
                            padding: "7px 9px",
                            fontWeight: 600,
                            fontSize: "13px",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.quotationCode || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Selection Details - 4x5 Grid */}
                    <div style={{ borderBottom: border }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              colSpan={5}
                              style={{
                                padding: "7px 14px",
                                fontWeight: 600,
                                fontSize: "14px",
                                backgroundColor: "#f9f9f9",
                                borderBottom: border,
                                textAlign: "left",
                              }}
                            >
                              Selection Details
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {[0, 1, 2, 3].map((row) => (
                            <tr key={row}>
                              {[0, 1, 2, 3, 4].map((col) => {
                                const boxIndex = col * 4 + row;
                                const boxContent = selectionBoxes[boxIndex] || "";

                                return (
                                  <td
                                    key={col}
                                    style={{
                                      padding: "10px 11px",
                                      fontSize: "13px",
                                      width: "20%",
                                      height: "54px",
                                      overflow: "hidden",
                                      wordWrap: "break-word",
                                      verticalAlign: "top",
                                      textAlign: "left",
                                      lineHeight: 1.2,
                                      borderRight: col < 4 ? borderThin : "none",
                                      borderBottom: row < 3 ? borderThin : "none",
                                    }}
                                  >
                                    {boxContent}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Image + Pricing Section */}
                    <div style={{ display: "flex", borderBottom: border }}>
                      <div style={{ width: "65%", borderRight: border }}>
                        <div
                          style={{
                            width: "100%",
                            paddingBottom: "56.25%",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {item.images?.[0] ? (
                            <img
                              src={getImageUrl(item.images[0])}
                              alt={item.quotationName}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                color: "#999",
                                fontSize: "18px",
                                textAlign: "center",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              No Image Available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing Table */}
                      <div style={{ width: "35%" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            height: "100%",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td
                                colSpan={2}
                                style={{
                                  padding: "7px 14px",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  backgroundColor: "#f9f9f9",
                                  borderBottom: border,
                                }}
                              >
                                Cost & GST Details
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  borderRight: borderThin,
                                  fontWeight: 500,
                                  fontSize: "13px",
                                  width: "45%",
                                  lineHeight: 1.3,
                                }}
                              >
                                Price
                                <br />
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#666",
                                    fontWeight: 400,
                                  }}
                                >
                                  (inc. of gst)
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  textAlign: "right",
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  width: "55%",
                                  lineHeight: 1.3,
                                }}
                              >
                                {formatCurrency(getPriceInclGst(item))}
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  borderRight: borderThin,
                                  fontSize: "13px",
                                  width: "45%",
                                  lineHeight: 1.3,
                                }}
                              >
                                Discount{" "}
                                <span style={{ fontSize: "11px", color: "#666" }}>
                                  ({Number(item.discountPercent)}%)
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  textAlign: "right",
                                  color: "#c00",
                                  fontWeight: 500,
                                  fontSize: "13px",
                                  width: "55%",
                                  lineHeight: 1.3,
                                }}
                              >
                                -{formatCurrency(getDiscountAmount(item))}
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  borderRight: borderThin,
                                  fontSize: "13px",
                                  width: "45%",
                                  lineHeight: 1.3,
                                }}
                              >
                                Units
                              </td>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  textAlign: "right",
                                  fontWeight: 500,
                                  fontSize: "13px",
                                  width: "55%",
                                  lineHeight: 1.3,
                                }}
                              >
                                {item.quantity}
                              </td>
                            </tr>
                            <tr style={{ backgroundColor: "#f9f9f9" }}>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  borderRight: borderThin,
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  width: "45%",
                                  lineHeight: 1.3,
                                }}
                              >
                                Final Price
                                <br />
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#555",
                                    fontWeight: 500,
                                  }}
                                >
                                  (incl. of gst)
                                </span>
                              </td>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderBottom: borderThin,
                                  textAlign: "right",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  width: "55%",
                                  lineHeight: 1.3,
                                }}
                              >
                                {formatCurrency(getTotalInclGst(item))}
                              </td>
                            </tr>
                            <tr>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  borderRight: borderThin,
                                  fontSize: "13px",
                                  width: "45%",
                                  lineHeight: 1.3,
                                }}
                              >
                                Quotation No
                              </td>
                              <td
                                style={{
                                  padding: "7px 14px",
                                  textAlign: "right",
                                  fontWeight: 600,
                                  fontSize: "11px",
                                  width: "55%",
                                  lineHeight: 1.3,
                                  wordWrap: "break-word",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {item.projectQuotationNo || index + 1}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Dimensions & Notes Section */}
                    <div
                      style={{
                        display: "flex",
                        borderBottom: border,
                        flex: 1,
                      }}
                    >
                      {/* Dimensions Table */}
                      <div
                        style={{
                          width: "50%",
                          borderRight: border,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            height: "100%",
                          }}
                        >
                          <tbody>
                            <tr>
                              <td
                                colSpan={2}
                                style={{
                                  padding: "7px 14px",
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  backgroundColor: "#f9f9f9",
                                  borderBottom: border,
                                }}
                              >
                                Dimensions
                              </td>
                            </tr>
                            {item.quotation?.length && (
                              <tr>
                                <td
                                  style={{
                                    padding: "7px 14px",
                                    borderBottom: borderThin,
                                    borderRight: borderThin,
                                    color: "#555",
                                    width: "40%",
                                    fontWeight: 500,
                                    fontSize: "13px",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  Length (L)
                                </td>
                                <td
                                  style={{
                                    padding: "7px 14px",
                                    borderBottom: borderThin,
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {item.quotation.length} mm
                                </td>
                              </tr>
                            )}
                            {item.quotation?.width && (
                              <tr>
                                <td
                                  style={{
                                    padding: "7px 14px",
                                    borderBottom: borderThin,
                                    borderRight: borderThin,
                                    color: "#555",
                                    width: "40%",
                                    fontWeight: 500,
                                    fontSize: "13px",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  Width (W)
                                </td>
                                <td
                                  style={{
                                    padding: "7px 14px",
                                    borderBottom: borderThin,
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {item.quotation.width} mm
                                </td>
                              </tr>
                            )}
                            {item.quotation?.height && (
                              <tr>
                                <td
                                  style={{
                                    padding: "7px 14px",
                                    borderRight: borderThin,
                                    color: "#555",
                                    width: "40%",
                                    fontWeight: 500,
                                    fontSize: "13px",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  Height (H)
                                </td>
                                <td
                                  style={{
                                    padding: "7px 14px",
                                    fontWeight: 600,
                                    fontSize: "13px",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {item.quotation.height} mm
                                </td>
                              </tr>
                            )}
                            {/* Fill empty rows */}
                            {[
                              ...Array(
                                Math.max(
                                  0,
                                  3 -
                                    [
                                      item.quotation?.length,
                                      item.quotation?.width,
                                      item.quotation?.height,
                                    ].filter(Boolean).length,
                                ),
                              ),
                            ].map((_, i) => (
                              <tr key={i}>
                                <td
                                  colSpan={2}
                                  style={{ padding: "7px 14px", height: "32px" }}
                                >
                                  &nbsp;
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* General Notes */}
                      <div
                        style={{
                          width: "50%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 14px",
                            fontWeight: 600,
                            fontSize: "14px",
                            backgroundColor: "#f9f9f9",
                            borderBottom: border,
                          }}
                        >
                          General Notes
                        </div>
                        <div style={{ flex: 1, padding: "10px 14px" }}>
                          {item.woodName && (
                            <div style={{ marginBottom: "6px", fontSize: "13px" }}>
                              <span style={{ fontWeight: 500, color: "#555" }}>
                                Wood:
                              </span>{" "}
                              <span>{item.woodName}</span>
                            </div>
                          )}
                          {item.polishName && (
                            <div style={{ marginBottom: "6px", fontSize: "13px" }}>
                              <span style={{ fontWeight: 500, color: "#555" }}>
                                Polish:
                              </span>{" "}
                              <span>{item.polishName}</span>
                            </div>
                          )}
                          {item.fabricName && (
                            <div style={{ marginBottom: "6px", fontSize: "13px" }}>
                              <span style={{ fontWeight: 500, color: "#555" }}>
                                Fabric:
                              </span>{" "}
                              <span>{item.fabricName}</span>
                            </div>
                          )}
                          {item.specialNote && (
                            <div style={{ marginTop: "10px" }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  color: "#333",
                                  marginBottom: "4px",
                                }}
                              >
                                Special Note:
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#333",
                                  lineHeight: 1.5,
                                }}
                              >
                                {item.specialNote}
                              </div>
                            </div>
                          )}
                          <div style={{ marginTop: "10px" }}>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              Sales Manager
                            </div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                marginTop: "2px",
                              }}
                            >
                              {salesPersonName}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div style={{ borderBottom: border, display: "flex" }}>
                      <div
                        style={{
                          flex: 1,
                          padding: "11px 17px",
                          borderRight: border,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#666",
                            marginBottom: "3px",
                          }}
                        >
                          Customer Signature
                        </div>
                        <div
                          style={{
                            height: "8px",
                            borderBottom: "1px solid #ddd",
                            marginTop: "6px",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, padding: "11px 17px" }}>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#666",
                            marginBottom: "3px",
                          }}
                        >
                          Company Signature
                        </div>
                        <div
                          style={{
                            height: "8px",
                            borderBottom: "1px solid #ddd",
                            marginTop: "6px",
                          }}
                        />
                      </div>
                    </div>

                    <PageFooter />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* TERMS & CONDITIONS PAGE */}
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
                <CompanyHeader />

                <div
                  style={{
                    borderBottom: border,
                    padding: "10px 17px",
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "17px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  Terms & Conditions
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: "18px 20px",
                    fontSize: "13px",
                    lineHeight: 1.65,
                    color: "#222",
                  }}
                >
                  <ol style={{ paddingLeft: "18px", margin: 0 }}>
                    {termsAndConditions.map((term, i) => (
                      <li
                        key={i}
                        style={{ marginBottom: "7px", paddingLeft: "4px" }}
                      >
                       {i + 1}. {term}
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