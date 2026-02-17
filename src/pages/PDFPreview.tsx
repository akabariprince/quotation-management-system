import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Loader2, FileText } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/utils/reportHelpers";

// ─── Skeleton for PDF Preview ───────────────────────────────────────────────

const PDFPreviewSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-100">
    {/* Toolbar Skeleton */}
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

    {/* Page Skeletons */}
    <div className="p-4 md:p-8 flex flex-col items-center gap-8">
      {/* Summary Page Skeleton */}
      <div
        className="bg-white shadow-lg"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        <div className="p-0">
          <div className="border-2 border-gray-200">
            {/* Header */}
            <div className="flex border-b-2 border-gray-200">
              <div className="flex-1 p-4 border-r-2 border-gray-200">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-3 w-48 mt-3" />
                <Skeleton className="h-3 w-44 mt-1" />
                <Skeleton className="h-3 w-32 mt-1" />
              </div>
              <div className="w-40 flex items-center justify-center">
                <Skeleton className="h-6 w-24" />
              </div>
            </div>

            {/* Client Info */}
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

            {/* Title */}
            <div className="border-b-2 border-gray-200 p-3 flex justify-center">
              <Skeleton className="h-5 w-40" />
            </div>

            {/* Table Header */}
            <div className="flex border-b-2 border-gray-200 bg-gray-50 p-2 gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Table Rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex border-b border-gray-100 p-2 gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}

            {/* Grand Total */}
            <div className="flex border-t-2 border-gray-200 bg-gray-50 p-3 gap-2">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-24" />
            </div>

            {/* Bottom Section */}
            <div className="flex border-t-2 border-gray-200">
              <div className="flex-1 p-4 border-r-2 border-gray-200">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
              <div className="w-64 p-2 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between px-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 p-2 flex justify-between bg-gray-50">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Page Skeletons */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="bg-white shadow-lg"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <div className="p-0">
            <div className="border-2 border-gray-200">
              {/* Header */}
              <div className="flex border-b-2 border-gray-200">
                <div className="flex-1 p-4 border-r-2 border-gray-200">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-3 w-48 mt-3" />
                </div>
                <div className="w-40 flex items-center justify-center">
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>

              {/* Notes */}
              <div className="border-b-2 border-gray-200 p-3 space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-56" />
              </div>

              {/* Image Area */}
              <div className="border-b-2 border-gray-200 p-4 flex justify-center">
                <Skeleton className="h-80 w-96 rounded" />
              </div>

              {/* Bottom Details */}
              <div className="flex border-b-2 border-gray-200">
                <div className="w-1/2 border-r-2 border-gray-200 p-3 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="w-1/2 p-3 space-y-2">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <div key={j} className="flex justify-between px-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
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

// ─── Main Component ─────────────────────────────────────────────────────────

const PDFPreview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchProjectById, downloadProjectPDF } = useProjects();

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

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

  // ─── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return <PDFPreviewSkeleton />;
  }

  const customer = project?.customer;
  const salesPersonName = project?.salesPerson?.name || "—";

  // ─── Not Found ──────────────────────────────────────────────────────────

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
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

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

  const border = "1.5px solid #000";
  const borderThin = "1px solid #000";
  const items = project.items || [];

  // ─── Company Header (reusable inline) ─────────────────────────────────

  const CompanyHeader = ({ rightLabel }: { rightLabel: string }) => (
    <div style={{ display: "flex", borderBottom: border }}>
      <div style={{ flex: 1, padding: "16px 20px", borderRight: border }}>
        <div
          style={{
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          ecstatics<span>.</span>
        </div>
        <div
          style={{
            fontSize: "9px",
            marginTop: "6px",
            color: "#333",
            lineHeight: 1.5,
          }}
        >
          <div>Ecstatics Spaces India Pvt. Ltd.</div>
          <div>3120, Ganga Trueno, Airport Road,</div>
          <div>Viman Nagar, Pune</div>
          <div style={{ marginTop: "2px" }}>GST No: 27AAFCE9942B1ZM</div>
        </div>
      </div>
      <div
        style={{
          width: "160px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <div
          style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "0.5px" }}
        >
          {rightLabel}
        </div>
      </div>
    </div>
  );

  // ─── Client Info Row (reusable) ───────────────────────────────────────

  const ClientInfoRow = () => (
    <div style={{ display: "flex", borderBottom: border }}>
      <div
        style={{
          flex: 1,
          padding: "10px 20px",
          borderRight: border,
          fontSize: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
          <span style={{ color: "#666", minWidth: "75px" }}>Client name</span>
          <span style={{ fontWeight: 600 }}>{customer.name}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <span style={{ color: "#666", minWidth: "75px" }}>Contact No</span>
          <span>{customer.mobile}</span>
        </div>
      </div>
      <div
        style={{
          width: "160px",
          padding: "10px 20px",
          fontSize: "10px",
          textAlign: "right",
        }}
      >
        <div style={{ color: "#666", marginBottom: "4px" }}>Date</div>
        <div style={{ fontWeight: 600 }}>{formatDate(project.date)}</div>
      </div>
    </div>
  );

  // ─── Page Footer (reusable) ───────────────────────────────────────────

  const PageFooter = () => (
    <div
      style={{
        borderTop: border,
        padding: "8px 20px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "9px",
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
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;   /* <<< match server margin */
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
            height: auto !important;
          }
          /* Hide everything except the print container */
          body > * {
            display: none !important;
          }
          body > #root {
            display: block !important;
          }
          #root > * {
            display: none !important;
          }
          #root .print-root {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            width: auto !important;
          }
          .pdf-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 12mm !important;    /* <<< added padding */
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          .pdf-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .pdf-pages-wrapper {
            padding: 0 !important;
            gap: 0 !important;
            display: block !important;
            overflow: visible !important;
          }
          /* Ensure images print */
          img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Remove any scroll containers */
          .min-h-screen {
            min-height: auto !important;
            overflow: visible !important;
          }
        }
        @media screen {
          .pdf-page {
            width: 210mm;
            min-height: 297mm;
            background: #fff;
            margin: 0 auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            padding: 12mm; /* keep same visual spacing on screen */
          }
        }
      `}</style>

      {/* ─── Toolbar (hidden in print) ─────────────────────────────────── */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">PDF Preview</h1>
            <p className="text-sm text-gray-500">
              {project.quotationNo || project.quotation_no}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate(`/projects/${id}`)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
          <Button onClick={() => downloadProjectPDF(project.id)} className="btn-accent gap-2" size="sm">
            <Printer className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* ─── Print Container ───────────────────────────────────────────── */}
      <div
        ref={printRef}
        className="print-root print-container pdf-pages-wrapper p-4 md:p-8 flex flex-col items-center"
        style={{ gap: "2rem" }}
      >
        {/* ════════════════════════════════════════════════════════════════
            PAGE 1: PROJECT SUMMARY
            ════════════════════════════════════════════════════════════════ */}
        <div
          className="pdf-page"
          style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
        >
          <div
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
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
              {/* Header */}
              <CompanyHeader rightLabel="Quotation" />

              {/* Client Info */}
              <ClientInfoRow />

              {/* Summary Title */}
              <div
                style={{
                  borderBottom: border,
                  padding: "8px 20px",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "13px",
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
                    fontSize: "10px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <th
                        style={{
                          borderBottom: border,
                          borderRight: borderThin,
                          padding: "8px 12px",
                          textAlign: "center",
                          fontWeight: 700,
                          width: "50px",
                          fontSize: "9.5px",
                        }}
                      >
                        Sr no
                      </th>
                      <th
                        style={{
                          borderBottom: border,
                          borderRight: borderThin,
                          padding: "8px 12px",
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: "9.5px",
                        }}
                      >
                        Code
                      </th>
                      <th
                        style={{
                          borderBottom: border,
                          borderRight: borderThin,
                          padding: "8px 12px",
                          textAlign: "right",
                          fontWeight: 700,
                          fontSize: "9.5px",
                        }}
                      >
                        Final Price
                      </th>
                      <th
                        style={{
                          borderBottom: border,
                          borderRight: borderThin,
                          padding: "8px 12px",
                          textAlign: "center",
                          fontWeight: 700,
                          width: "60px",
                          fontSize: "9.5px",
                        }}
                      >
                        Units
                      </th>
                      <th
                        style={{
                          borderBottom: border,
                          padding: "8px 12px",
                          textAlign: "right",
                          fontWeight: 700,
                          fontSize: "9.5px",
                        }}
                      >
                        Total
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
                            padding: "8px 12px",
                            textAlign: "center",
                          }}
                        >
                          {index + 1}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            borderRight: borderThin,
                            padding: "8px 12px",
                            fontWeight: 500,
                          }}
                        >
                          {item.quotationCode}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            borderRight: borderThin,
                            padding: "8px 12px",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(item.finalPrice)}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            borderRight: borderThin,
                            padding: "8px 12px",
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          style={{
                            borderBottom: "1px solid #ccc",
                            padding: "8px 12px",
                            textAlign: "right",
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: "#f9f9f9" }}>
                      <td
                        colSpan={4}
                        style={{
                          borderTop: border,
                          borderRight: borderThin,
                          padding: "10px 12px",
                          textAlign: "center",
                          fontWeight: 800,
                          fontSize: "11px",
                        }}
                      >
                        Grand Total
                      </td>
                      <td
                        style={{
                          borderTop: border,
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: 800,
                          fontSize: "11px",
                        }}
                      >
                        {formatCurrency(project.grandTotal)}
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
                    padding: "12px 20px",
                    borderRight: border,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <div style={{ fontSize: "9px", color: "#666" }}>
                    Sales Manager
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      marginTop: "2px",
                    }}
                  >
                    {salesPersonName}
                  </div>
                </div>
                <div style={{ width: "260px" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "10px",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                            fontWeight: 500,
                          }}
                        >
                          Grand Total
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "center",
                            width: "45px",
                          }}
                        ></td>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "right",
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(project.grandTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                          }}
                        >
                          IGST
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "center",
                          }}
                        >
                          0%
                        </td>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "right",
                          }}
                        >
                          0
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                          }}
                        >
                          CGST
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(project.cgst)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                          }}
                        >
                          SGST
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "center",
                          }}
                        >
                          9%
                        </td>
                        <td
                          style={{
                            padding: "6px 12px",
                            borderBottom: "1px solid #ccc",
                            textAlign: "right",
                          }}
                        >
                          {formatCurrency(project.sgst)}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: "#f3f4f6" }}>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontWeight: 800,
                            fontSize: "10px",
                          }}
                        >
                          Grand Total With GST
                        </td>
                        <td
                          style={{
                            padding: "8px 8px",
                            textAlign: "center",
                            fontWeight: 700,
                          }}
                        >
                          18%
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            textAlign: "right",
                            fontWeight: 800,
                            fontSize: "11px",
                          }}
                        >
                          {formatCurrency(project.grandTotalWithGst)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <PageFooter />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            PRODUCT DETAIL PAGES
            ════════════════════════════════════════════════════════════════ */}
        {items.map((item: any, index: number) => (
          <div
            key={item.id}
            className="pdf-page"
            style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
          >
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
                <CompanyHeader rightLabel="Quotation" />

                {/* Notes */}
                <div
                  style={{
                    borderBottom: border,
                    padding: "10px 20px",
                    fontSize: "9.5px",
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                    Notes:
                  </div>
                  <div>1. {item.quotationName}</div>
                  {item.woodName && (
                    <div>
                      2. Base frame & support
                      <span
                        style={{ display: "inline-block", width: "4px" }}
                      ></span>
                      : {item.woodName} with {item.polishName}
                    </div>
                  )}
                  {item.fabricName && (
                    <div>
                      {item.woodName ? "3" : "2"}. Upholstery
                      <span
                        style={{ display: "inline-block", width: "4px" }}
                      ></span>
                      : {item.fabricName}
                    </div>
                  )}
                  {item.notes &&
                    item.notes.length > 0 &&
                    !item.woodName &&
                    !item.fabricName &&
                    item.notes.map((note: string, i: number) => (
                      <div key={i}>
                        {i + 1}. {note}
                      </div>
                    ))}
                </div>

                {/* Client Info */}
                <ClientInfoRow />

                {/* Reference Image Header + CODE */}
                <div style={{ display: "flex", borderBottom: borderThin }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRight: borderThin,
                      fontWeight: 600,
                      fontSize: "10px",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    Reference Image
                  </div>
                  <div style={{ display: "flex" }}>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRight: borderThin,
                        fontWeight: 700,
                        fontSize: "10px",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      CODE
                    </div>
                    <div
                      style={{
                        padding: "6px 16px",
                        fontWeight: 600,
                        fontSize: "10px",
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
                      alt={item.productName}
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
                        fontSize: "14px",
                        textAlign: "center",
                        padding: "40px",
                      }}
                    >
                      No Image Available
                    </div>
                  )}
                </div>

                {/* Bottom: Description + Pricing */}
                <div style={{ display: "flex", borderBottom: border }}>
                  {/* Left - Description */}
                  <div
                    style={{
                      width: "50%",
                      borderRight: border,
                      fontSize: "10px",
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
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              fontWeight: 600,
                              fontSize: "10px",
                            }}
                          >
                            Description
                          </td>
                        </tr>
                        {item.woodName && (
                          <tr>
                            <td
                              style={{
                                padding: "4px 12px",
                                borderBottom: borderThin,
                                color: "#555",
                                width: "100px",
                              }}
                            >
                              Wood
                            </td>
                            <td
                              style={{
                                padding: "4px 12px",
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
                                padding: "4px 12px",
                                borderBottom: borderThin,
                                color: "#555",
                              }}
                            >
                              Polish
                            </td>
                            <td
                              style={{
                                padding: "4px 12px",
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
                                padding: "4px 12px",
                                borderBottom: borderThin,
                                color: "#555",
                              }}
                            >
                              Fabric
                            </td>
                            <td
                              style={{
                                padding: "4px 12px",
                                borderBottom: borderThin,
                              }}
                            >
                              : {item.fabricName}
                            </td>
                          </tr>
                        )}
                        {!item.woodName &&
                          !item.polishName &&
                          !item.fabricName && (
                            <>
                              <tr>
                                <td
                                  style={{
                                    padding: "4px 12px",
                                    borderBottom: borderThin,
                                    color: "#555",
                                  }}
                                >
                                  Length
                                </td>
                                <td
                                  style={{
                                    padding: "4px 12px",
                                    borderBottom: borderThin,
                                  }}
                                >
                                  :
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "4px 12px",
                                    borderBottom: borderThin,
                                    color: "#555",
                                  }}
                                >
                                  Width
                                </td>
                                <td
                                  style={{
                                    padding: "4px 12px",
                                    borderBottom: borderThin,
                                  }}
                                >
                                  :
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    padding: "4px 12px",
                                    borderBottom: borderThin,
                                    color: "#555",
                                  }}
                                >
                                  Height
                                </td>
                                <td
                                  style={{
                                    padding: "4px 12px",
                                    borderBottom: borderThin,
                                  }}
                                >
                                  :
                                </td>
                              </tr>
                            </>
                          )}
                        <tr>
                          <td
                            colSpan={2}
                            style={{
                              padding: "8px 12px",
                              verticalAlign: "bottom",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "9px",
                                color: "#666",
                                marginTop: "4px",
                              }}
                            >
                              Sales Manager
                            </div>
                            <div style={{ fontWeight: 600, fontSize: "10px" }}>
                              {salesPersonName}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right - Pricing */}
                  <div style={{ width: "50%", fontSize: "10px" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                            }}
                          >
                            Price
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                              textAlign: "center",
                              width: "40px",
                            }}
                          ></td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                            }}
                          >
                            {formatCurrency(item.basePrice)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                            }}
                          >
                            Discount
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                              textAlign: "center",
                            }}
                          >
                            {Number(item.discountPercent)}%
                          </td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                            }}
                          >
                            {formatCurrency(item.discountAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                            }}
                          >
                            Final Price
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                            }}
                          ></td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                            }}
                          >
                            {formatCurrency(item.finalPrice)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                            }}
                          >
                            Units
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                            }}
                          ></td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                            }}
                          >
                            {item.quantity}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              fontWeight: 600,
                            }}
                          >
                            Total
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                            }}
                          ></td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                            }}
                          >
                            IGST
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                              textAlign: "center",
                            }}
                          >
                            0%
                          </td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                            }}
                          >
                            0
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                            }}
                          >
                            CGST
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                              textAlign: "center",
                            }}
                          >
                            9%
                          </td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                            }}
                          >
                            {formatCurrency(item.cgst)}
                          </td>
                        </tr>
                        <tr style={{ backgroundColor: "#f9f9f9" }}>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              fontWeight: 700,
                            }}
                          >
                            Total With GST
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              borderBottom: borderThin,
                            }}
                          ></td>
                          <td
                            style={{
                              padding: "5px 12px",
                              borderBottom: borderThin,
                              textAlign: "right",
                              fontWeight: 700,
                            }}
                          >
                            {formatCurrency(item.totalWithGst)}
                          </td>
                        </tr>
                        <tr>
                          <td
                            style={{
                              padding: "5px 12px",
                              textAlign: "center",
                            }}
                            colSpan={2}
                          >
                            Quotation
                          </td>
                          <td
                            style={{
                              padding: "5px 12px",
                              textAlign: "right",
                              fontWeight: 700,
                              fontSize: "13px",
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
                    padding: "8px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "9px",
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
        ))}

        {/* ════════════════════════════════════════════════════════════════
            TERMS & CONDITIONS PAGE
            ════════════════════════════════════════════════════════════════ */}
        <div
          className="pdf-page"
          style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
        >
          <div
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
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
              <div style={{ display: "flex", borderBottom: border }}>
                <div
                  style={{ flex: 1, padding: "16px 20px", borderRight: border }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 800,
                      letterSpacing: "-1px",
                      lineHeight: 1,
                    }}
                  >
                    ecstatics<span>.</span>
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      marginTop: "6px",
                      color: "#333",
                      lineHeight: 1.5,
                    }}
                  >
                    <div>Ecstatics Spaces India Pvt. Ltd.</div>
                  </div>
                </div>
                <div
                  style={{
                    width: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>
                    Terms & Conditions
                  </div>
                </div>
              </div>

              {/* Terms Content */}
              <div
                style={{
                  flex: 1,
                  padding: "20px 24px",
                  fontSize: "10px",
                  lineHeight: 1.8,
                  color: "#222",
                }}
              >
                <ol style={{ paddingLeft: "18px", margin: 0 }}>
                  {termsAndConditions.map((term, i) => (
                    <li
                      key={i}
                      style={{ marginBottom: "8px", paddingLeft: "4px" }}
                    >
                      {term}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Footer */}
              <PageFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
