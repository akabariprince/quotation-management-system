import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';

const PDFPreview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotations, customers } = useData();

  const quotation = quotations.find(q => q.id === id);
  const customer = quotation ? customers.find(c => c.id === quotation.customerId) : null;

  if (!quotation || !customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Quotation not found</p>
        <Button onClick={() => navigate('/quotations')} variant="outline" className="mt-4">
          Back to Quotations
        </Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const border = '1.5px solid #000';
  const borderThin = '1px solid #000';

  return (
    <div className="min-h-screen bg-gray-100">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .pdf-page {
            width: 210mm !important;
            min-height: 297mm !important;
            height: 297mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .pdf-page:last-child {
            page-break-after: auto;
          }
          .pdf-pages-container {
            padding: 0 !important;
            gap: 0 !important;
          }
        }
        @media screen {
          .pdf-page {
            width: 210mm;
            min-height: 297mm;
            background: #fff;
            margin: 0 auto;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">PDF Preview</h1>
            <p className="text-sm text-gray-500">{quotation.quotationNo}</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="btn-accent gap-2">
          <Printer className="h-4 w-4" />
          Print PDF
        </Button>
      </div>

      <div className="pdf-pages-container p-0 md:p-8 space-y-8 flex flex-col items-center">

        {/* ========== PAGE 1: SUMMARY ========== */}
        <div className="pdf-page" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              border: border,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
            }}>

              {/* Header Row */}
              <div style={{ display: 'flex', borderBottom: border }}>
                <div style={{ flex: 1, padding: '16px 20px', borderRight: border }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                    ecstatics<span>.</span>
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '6px', color: '#333', lineHeight: 1.5 }}>
                    <div>Ecstatics Spaces India Pvt. Ltd.</div>
                    <div>3120, Ganga Trueno, Airport Road,</div>
                    <div>Viman Nagar, Pune</div>
                    <div style={{ marginTop: '2px' }}>GST No: 27AAFCE9942B1ZM</div>
                  </div>
                </div>
                <div style={{ width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>Quotation</div>
                </div>
              </div>

              {/* Client Info Row */}
              <div style={{ display: 'flex', borderBottom: border }}>
                <div style={{ flex: 1, padding: '10px 20px', borderRight: border, fontSize: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ color: '#666', minWidth: '75px' }}>Client name</span>
                    <span style={{ fontWeight: 600 }}>{customer.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#666', minWidth: '75px' }}>Contact No</span>
                    <span>{customer.mobile}</span>
                  </div>
                </div>
                <div style={{ width: '160px', padding: '10px 20px', fontSize: '10px', textAlign: 'right' }}>
                  <div style={{ color: '#666', marginBottom: '4px' }}>Date</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(quotation.date)}</div>
                </div>
              </div>

              {/* Quotation Summary Title */}
              <div style={{
                borderBottom: border,
                padding: '8px 20px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '13px',
                backgroundColor: '#f9f9f9',
              }}>
                Quotation Summary
              </div>

              {/* Summary Table */}
              <div style={{ flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ borderBottom: border, borderRight: borderThin, padding: '8px 12px', textAlign: 'center', fontWeight: 700, width: '50px', fontSize: '9.5px' }}>Sr no</th>
                      <th style={{ borderBottom: border, borderRight: borderThin, padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '9.5px' }}>Code</th>
                      <th style={{ borderBottom: border, borderRight: borderThin, padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '9.5px' }}>Final Price</th>
                      <th style={{ borderBottom: border, borderRight: borderThin, padding: '8px 12px', textAlign: 'center', fontWeight: 700, width: '60px', fontSize: '9.5px' }}>Units</th>
                      <th style={{ borderBottom: border, padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '9.5px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotation.items.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{ borderBottom: '1px solid #ccc', borderRight: borderThin, padding: '8px 12px', textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ borderBottom: '1px solid #ccc', borderRight: borderThin, padding: '8px 12px', fontWeight: 500 }}>{item.productCode}</td>
                        <td style={{ borderBottom: '1px solid #ccc', borderRight: borderThin, padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.finalPrice)}</td>
                        <td style={{ borderBottom: '1px solid #ccc', borderRight: borderThin, padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ borderBottom: '1px solid #ccc', padding: '8px 12px', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#f9f9f9' }}>
                      <td colSpan={4} style={{ borderTop: border, borderRight: borderThin, padding: '10px 12px', textAlign: 'center', fontWeight: 800, fontSize: '11px' }}>Grand Total</td>
                      <td style={{ borderTop: border, padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: '11px' }}>{formatCurrency(quotation.grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Section */}
              <div style={{ borderTop: border, display: 'flex' }}>
                <div style={{ flex: 1, padding: '12px 20px', borderRight: border, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '9px', color: '#666' }}>Sales Manager</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>{quotation.salesManager}</div>
                </div>
                <div style={{ width: '260px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc', fontWeight: 500 }}>Grand Total</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #ccc', textAlign: 'center', width: '45px' }}></td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(quotation.grandTotal)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc' }}>IGST</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>0%</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc', textAlign: 'right' }}>0</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc' }}>CGST</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>9%</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc', textAlign: 'right' }}>{formatCurrency(quotation.cgst)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc' }}>SGST</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid #ccc', textAlign: 'center' }}>9%</td>
                        <td style={{ padding: '6px 12px', borderBottom: '1px solid #ccc', textAlign: 'right' }}>{formatCurrency(quotation.sgst)}</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 800, fontSize: '10px' }}>Grand Total With GST</td>
                        <td style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 700 }}>18%</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: '11px' }}>{formatCurrency(quotation.grandTotalWithGst)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div style={{ borderTop: border, padding: '8px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', backgroundColor: '#fafafa' }}>
                <span>(+91) 7066 46 6060</span>
                <span>info@esipl.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========== PRODUCT PAGES ========== */}
        {quotation.items.map((item, index) => (
          <div key={item.id} className="pdf-page" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ border: border, flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Header */}
                <div style={{ display: 'flex', borderBottom: border }}>
                  <div style={{ flex: 1, padding: '16px 20px', borderRight: border }}>
                    <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                      ecstatics<span>.</span>
                    </div>
                    <div style={{ fontSize: '9px', marginTop: '6px', color: '#333', lineHeight: 1.5 }}>
                      <div>Ecstatics Spaces India Pvt. Ltd.</div>
                      <div>3120, Ganga Trueno, Airport Road,</div>
                      <div>Viman Nagar, Pune</div>
                      <div style={{ marginTop: '2px' }}>GST No: 27AAFCE9942B1ZM</div>
                    </div>
                  </div>
                  <div style={{ width: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>Quotation</div>
                  </div>
                </div>

                {/* Notes with Wood/Polish/Fabric details */}
                <div style={{ borderBottom: border, padding: '10px 20px', fontSize: '9.5px', lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>Notes:</div>
                  <div>1. {item.productName}</div>
                  {(item as any).woodName && (
                    <div>2. Base frame & support
                      <span style={{ display: 'inline-block', width: '16px' }}></span>
                      : {(item as any).woodName} with {(item as any).polishName}
                    </div>
                  )}
                  {(item as any).fabricName && (
                    <div>{(item as any).woodName ? '3' : '2'}. Upholstery
                      <span style={{ display: 'inline-block', width: '68px' }}></span>
                      : {(item as any).fabricName}
                    </div>
                  )}
                  {item.notes && item.notes.length > 0 && !(item as any).woodName && !(item as any).fabricName && (
                    item.notes.map((note, i) => (
                      <div key={i}>{i + 1}. {note}</div>
                    ))
                  )}
                </div>

                {/* Client Info */}
                <div style={{ display: 'flex', borderBottom: border }}>
                  <div style={{ flex: 1, padding: '10px 20px', borderRight: border, fontSize: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#666', minWidth: '75px' }}>Client name</span>
                      <span style={{ fontWeight: 600 }}>{customer.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#666', minWidth: '75px' }}>Contact No</span>
                      <span>{customer.mobile}</span>
                    </div>
                  </div>
                  <div style={{ width: '160px', padding: '10px 20px', fontSize: '10px', textAlign: 'right' }}>
                    <div style={{ color: '#666', marginBottom: '4px' }}>Date</div>
                    <div style={{ fontWeight: 600 }}>{formatDate(quotation.date)}</div>
                  </div>
                </div>

                {/* Reference Image Header + CODE */}
                <div style={{ display: 'flex', borderBottom: borderThin }}>
                  <div style={{ flex: 1, padding: '6px 12px', borderRight: borderThin, fontWeight: 600, fontSize: '10px', backgroundColor: '#f9f9f9' }}>
                    Reference Image
                  </div>
                  <div style={{ display: 'flex' }}>
                    <div style={{ padding: '6px 12px', borderRight: borderThin, fontWeight: 700, fontSize: '10px', backgroundColor: '#f9f9f9' }}>CODE</div>
                    <div style={{ padding: '6px 16px', fontWeight: 600, fontSize: '10px' }}>{item.productCode}</div>
                  </div>
                </div>

                {/* Large Image Area - Takes up most of the page */}
              
           
           <div
  style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    borderBottom: borderThin,
  }}
>
  {item.images?.[0] ? (
    <img
      src={item.images[0]}
      alt={item.productName}
      style={{
        maxHeight: '400px',   // 👈 limit height
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  ) : (
    <div
      style={{
        color: '#999',
        fontSize: '14px',
        textAlign: 'center',
        padding: '40px',
      }}
    >
      No Image Available
    </div>
  )}
</div>



                {/* Bottom Details: Description Left + Pricing Right */}
                <div style={{ display: 'flex', borderBottom: border }}>
                  {/* Left - Description & Dimensions */}
                  <div style={{ width: '50%', borderRight: border, fontSize: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td colSpan={2} style={{ padding: '5px 12px', borderBottom: borderThin, fontWeight: 600, fontSize: '10px' }}>Description</td>
                        </tr>
                        {(item as any).woodName && (
                          <tr>
                            <td style={{ padding: '4px 12px', borderBottom: borderThin, color: '#555', width: '100px' }}>Wood</td>
                            <td style={{ padding: '4px 12px', borderBottom: borderThin }}>: {(item as any).woodName}</td>
                          </tr>
                        )}
                        {(item as any).polishName && (
                          <tr>
                            <td style={{ padding: '4px 12px', borderBottom: borderThin, color: '#555' }}>Polish</td>
                            <td style={{ padding: '4px 12px', borderBottom: borderThin }}>: {(item as any).polishName}</td>
                          </tr>
                        )}
                        {(item as any).fabricName && (
                          <tr>
                            <td style={{ padding: '4px 12px', borderBottom: borderThin, color: '#555' }}>Fabric</td>
                            <td style={{ padding: '4px 12px', borderBottom: borderThin }}>: {(item as any).fabricName}</td>
                          </tr>
                        )}
                        {!(item as any).woodName && !(item as any).polishName && !(item as any).fabricName && (
                          <>
                            <tr>
                              <td style={{ padding: '4px 12px', borderBottom: borderThin, color: '#555' }}>Length</td>
                              <td style={{ padding: '4px 12px', borderBottom: borderThin }}>:</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '4px 12px', borderBottom: borderThin, color: '#555' }}>Width</td>
                              <td style={{ padding: '4px 12px', borderBottom: borderThin }}>:</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '4px 12px', borderBottom: borderThin, color: '#555' }}>Height</td>
                              <td style={{ padding: '4px 12px', borderBottom: borderThin }}>:</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td colSpan={2} style={{ padding: '8px 12px', verticalAlign: 'bottom' }}>
                            <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>Sales Manager</div>
                            <div style={{ fontWeight: 600, fontSize: '10px' }}>{quotation.salesManager}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right - Pricing */}
                  <div style={{ width: '50%', fontSize: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin }}>Price</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin, textAlign: 'center', width: '40px' }}></td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right' }}>{formatCurrency(item.basePrice)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin }}>Discount</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin, textAlign: 'center' }}>{item.discountPercent}%</td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right' }}>{formatCurrency(item.discountAmount)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin }}>Final Price</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin }}></td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right' }}>{formatCurrency(item.finalPrice)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin }}>Units</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin }}></td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right' }}>{item.quantity}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, fontWeight: 600 }}>Total</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin }}></td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin }}>IGST</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin, textAlign: 'center' }}>0%</td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right' }}>0</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin }}>CGST</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin, textAlign: 'center' }}>9%</td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right' }}>{formatCurrency(item.cgst)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin }}>SGST</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin, textAlign: 'center' }}>9%</td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right' }}>{formatCurrency(item.sgst)}</td>
                        </tr>
                        <tr style={{ backgroundColor: '#f9f9f9' }}>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, fontWeight: 700 }}>Total With GST</td>
                          <td style={{ padding: '5px 8px', borderBottom: borderThin }}></td>
                          <td style={{ padding: '5px 12px', borderBottom: borderThin, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.totalWithGst)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 12px', textAlign: 'center' }} colSpan={2}>Quotation</td>
                          <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 700, fontSize: '13px' }}>{index + 1}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '8px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', backgroundColor: '#fafafa' }}>
                  <span>(+91) 7066 46 6060</span>
                  <span>info@esipl.in</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ========== TERMS & CONDITIONS PAGE ========== */}
        <div className="pdf-page" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ border: border, flex: 1, display: 'flex', flexDirection: 'column' }}>

              {/* Header */}
              <div style={{ display: 'flex', borderBottom: border }}>
                <div style={{ flex: 1, padding: '16px 20px', borderRight: border }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                    ecstatics<span>.</span>
                  </div>
                  <div style={{ fontSize: '9px', marginTop: '6px', color: '#333', lineHeight: 1.5 }}>
                    <div>Ecstatics Spaces India Pvt. Ltd.</div>
                  </div>
                </div>
                <div style={{ width: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>Terms & Conditions</div>
                </div>
              </div>

              {/* Terms Content */}
              <div style={{ flex: 1, padding: '20px 24px', fontSize: '10px', lineHeight: 1.8, color: '#222' }}>
                <ol style={{ paddingLeft: '18px', margin: 0 }}>
                  {[
                    'The quotation is valid for a period of 30 days from the date of this offer.',
                    'The order shall be processed only after receipt of the purchase order and 70% advance payment from the client.',
                    'The order shall be dispatched only after receipt of the remaining 30% balance payment.',
                    'The order shall be dispatched within 3 working days after receipt of the final payment.',
                    'Transfer of property in goods shall occur once the goods are dispatched to the customer. Ecstatics shall ensure repair or replacement in case of transit damage.',
                    'In case of cancellation of the order at any stage for any reason, the amount collected shall stand forfeited.',
                    'After delivery, if the customer is unable to accept the products at site for any reason, the client shall be responsible for any damages to the products.',
                    'Godown demurrage charges of ₹3,000 per week shall be levied if delivery is not accepted after intimation. Products will be held for a maximum of 4 weeks, post which the order will be cancelled and the amount collected will be forfeited.',
                    'Invoice shall be issued in the name mentioned in the purchase order received from the client.',
                    'All rights related to photography, videography, and promotional activities of the products before and after delivery are reserved with Ecstatics Spaces India Pvt. Ltd.',
                    'Expenses related to logistics, transportation, unloading, and on-site placement of products shall be in the client\'s scope.',
                    'A tolerance of up to 50mm shall be acceptable in the gross dimensions of the products.',
                    'All products shall be dispatched from the Sangamner godown.',
                    'All disputes are subject to Pune jurisdiction only.',
                    'All prices are mentioned in INR.',
                  ].map((term, i) => (
                    <li key={i} style={{ marginBottom: '8px', paddingLeft: '4px' }}>
                      {term}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Footer */}
              <div style={{ borderTop: border, padding: '8px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', backgroundColor: '#fafafa' }}>
                <span>(+91) 7066 46 6060</span>
                <span>info@esipl.in</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PDFPreview;