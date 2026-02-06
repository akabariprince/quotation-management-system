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
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  const handlePrint = () => {
    window.print();
  };

  // PDF Document Styles (inline for print accuracy)
  const pdfStyles = {
    page: {
      width: '210mm',
      minHeight: '297mm',
      background: '#fff',
      padding: '20mm',
      margin: '0 auto 2rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#000',
      fontSize: '12px',
      lineHeight: '1.5',
    } as React.CSSProperties,
    border: {
      border: '1px solid #000',
      padding: '20px',
    } as React.CSSProperties,
    header: {
      borderBottom: '1px solid #000',
      paddingBottom: '15px',
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    } as React.CSSProperties,
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      border: '1px solid #000',
    },
    th: {
      border: '1px solid #000',
      padding: '8px 10px',
      background: '#f3f4f6',
      fontWeight: 600,
      textAlign: 'left' as const,
      fontSize: '11px',
    },
    td: {
      border: '1px solid #000',
      padding: '8px 10px',
      fontSize: '11px',
    },
    tdRight: {
      border: '1px solid #000',
      padding: '8px 10px',
      fontSize: '11px',
      textAlign: 'right' as const,
    },
    tdCenter: {
      border: '1px solid #000',
      padding: '8px 10px',
      fontSize: '11px',
      textAlign: 'center' as const,
    },
    footer: {
      borderTop: '1px solid #000',
      paddingTop: '15px',
      marginTop: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '11px',
      color: '#666',
    } as React.CSSProperties,
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Controls - No Print */}
      <div className="no-print sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/quotations')} 
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-foreground">PDF Preview</h1>
            <p className="text-sm text-muted-foreground">{quotation.quotationNo}</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="btn-accent gap-2">
          <Printer className="h-4 w-4" />
          Print PDF
        </Button>
      </div>

      {/* PDF Pages Container */}
      <div className="p-4 md:p-8 space-y-8">
        
        {/* Summary Page */}
        <div style={pdfStyles.page}>
          <div style={pdfStyles.border}>
            {/* Header */}
            <div style={pdfStyles.header}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>ecstatics.</h1>
                <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Ecstatics Spaces India Pvt. Ltd.</p>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>3120, Ganga Trueno, Airport Road, Viman Nagar, Pune</p>
                <p style={{ margin: '2px 0', fontSize: '11px' }}>GST No: 27AAFCE9942B1ZM</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Quotation</h2>
                <p style={{ fontSize: '11px', margin: '4px 0 0' }}>{quotation.quotationNo}</p>
              </div>
            </div>

            {/* Client Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <p style={{ margin: '4px 0' }}>
                  <span style={{ color: '#666' }}>Client name</span>
                  <span style={{ marginLeft: '16px', fontWeight: 500 }}>{customer.name}</span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <span style={{ color: '#666' }}>Contact No</span>
                  <span style={{ marginLeft: '16px' }}>{customer.mobile}</span>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#666', margin: '4px 0' }}>Date</p>
                <p style={{ margin: '4px 0', fontWeight: 500 }}>{formatDate(quotation.date)}</p>
              </div>
            </div>

            {/* Summary Title */}
            <h3 style={{ textAlign: 'center', fontWeight: 600, margin: '20px 0 15px' }}>Quotation Summary</h3>

            {/* Summary Table */}
            <table style={pdfStyles.table}>
              <thead>
                <tr>
                  <th style={pdfStyles.th}>Sr no</th>
                  <th style={pdfStyles.th}>Code</th>
                  <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Final Price</th>
                  <th style={{ ...pdfStyles.th, textAlign: 'center' }}>Units</th>
                  <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={item.id}>
                    <td style={pdfStyles.tdCenter}>{index + 1}</td>
                    <td style={pdfStyles.td}>{item.productCode}</td>
                    <td style={pdfStyles.tdRight}>{formatCurrency(item.finalPrice)}</td>
                    <td style={pdfStyles.tdCenter}>{item.quantity}</td>
                    <td style={pdfStyles.tdRight}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td colSpan={4} style={{ ...pdfStyles.tdCenter, fontWeight: 700 }}>Grand Total</td>
                  <td style={{ ...pdfStyles.tdRight, fontWeight: 700 }}>{formatCurrency(quotation.grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* GST Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '30px' }}>
              <div>
                <p style={{ color: '#666', fontSize: '11px', margin: '4px 0' }}>Sales Manager</p>
                <p style={{ fontWeight: 500, margin: '4px 0' }}>{quotation.salesManager}</p>
              </div>
              <table style={{ ...pdfStyles.table, width: '250px' }}>
                <tbody>
                  <tr>
                    <td style={pdfStyles.td}>Grand Total</td>
                    <td style={pdfStyles.tdRight}>{formatCurrency(quotation.grandTotal)}</td>
                  </tr>
                  <tr>
                    <td style={pdfStyles.td}>IGST</td>
                    <td style={pdfStyles.tdCenter}>0%</td>
                    <td style={pdfStyles.tdRight}>0</td>
                  </tr>
                  <tr>
                    <td style={pdfStyles.td}>CGST</td>
                    <td style={pdfStyles.tdCenter}>9%</td>
                    <td style={pdfStyles.tdRight}>{formatCurrency(quotation.cgst)}</td>
                  </tr>
                  <tr>
                    <td style={pdfStyles.td}>SGST</td>
                    <td style={pdfStyles.tdCenter}>9%</td>
                    <td style={pdfStyles.tdRight}>{formatCurrency(quotation.sgst)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700 }}>
                    <td style={{ ...pdfStyles.td, fontWeight: 700 }}>Grand Total With GST</td>
                    <td style={{ ...pdfStyles.tdCenter, fontWeight: 700 }}>18%</td>
                    <td style={{ ...pdfStyles.tdRight, fontWeight: 700 }}>{formatCurrency(quotation.grandTotalWithGst)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={pdfStyles.footer}>
              <p>(+91) 7066 46 6060</p>
              <p>info@esipl.in</p>
            </div>
          </div>
        </div>

        {/* Individual Product Pages */}
        {quotation.items.map((item, index) => (
          <div key={item.id} style={pdfStyles.page}>
            <div style={{ ...pdfStyles.border, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={pdfStyles.header}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>ecstatics.</h1>
                  <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Ecstatics Spaces India Pvt. Ltd.</p>
                  <p style={{ margin: '2px 0', fontSize: '11px' }}>3120, Ganga Trueno, Airport Road, Viman Nagar, Pune</p>
                  <p style={{ margin: '2px 0', fontSize: '11px' }}>GST No: 27AAFCE9942B1ZM</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Quotation</h2>
                </div>
              </div>

              {/* Notes */}
              <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '15px', background: '#fafafa' }}>
                <p style={{ fontWeight: 600, marginBottom: '8px' }}>Notes:</p>
                {item.notes.map((note, i) => (
                  <p key={i} style={{ fontSize: '11px', margin: '3px 0' }}>{i + 1}. {note}</p>
                ))}
              </div>

              {/* Client Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div>
                  <p style={{ margin: '4px 0' }}>
                    <span style={{ color: '#666' }}>Client name</span>
                    <span style={{ marginLeft: '16px', fontWeight: 500 }}>{customer.name}</span>
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    <span style={{ color: '#666' }}>Contact No</span>
                    <span style={{ marginLeft: '16px' }}>{customer.mobile}</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#666', margin: '4px 0' }}>Date</p>
                  <p style={{ margin: '4px 0' }}>{formatDate(quotation.date)}</p>
                </div>
              </div>

              {/* Product Content */}
              <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
                {/* Left - Reference Image */}
                <div style={{ width: '50%' }}>
                  <table style={{ ...pdfStyles.table, height: '100%' }}>
                    <thead>
                      <tr><th style={pdfStyles.th}>Reference Image</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ ...pdfStyles.td, padding: '15px', height: '240px', verticalAlign: 'middle', textAlign: 'center' }}>
                          {item.images[0] ? (
                            <img 
                              src={item.images[0]} 
                              alt={item.productName} 
                              style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }} 
                            />
                          ) : (
                            <div style={{ color: '#999', padding: '40px' }}>No Image Available</div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right - Details */}
                <div style={{ width: '50%' }}>
                  <table style={pdfStyles.table}>
                    <tbody>
                      <tr>
                        <td style={{ ...pdfStyles.td, fontWeight: 600 }}>CODE</td>
                        <td style={pdfStyles.td}>{item.productCode}</td>
                      </tr>
                      <tr>
                        <td style={pdfStyles.td}>Price</td>
                        <td style={pdfStyles.tdRight}>{formatCurrency(item.basePrice)}</td>
                      </tr>
                      <tr>
                        <td style={pdfStyles.td}>Discount</td>
                        <td style={pdfStyles.tdRight}>
                          {item.discountPercent}% 
                          <span style={{ color: '#666', marginLeft: '8px' }}>{formatCurrency(item.discountAmount)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={pdfStyles.td}>Final Price</td>
                        <td style={pdfStyles.tdRight}>{formatCurrency(item.finalPrice)}</td>
                      </tr>
                      <tr>
                        <td style={pdfStyles.td}>Units</td>
                        <td style={pdfStyles.tdRight}>{item.quantity}</td>
                      </tr>
                      <tr style={{ fontWeight: 600 }}>
                        <td style={{ ...pdfStyles.td, fontWeight: 600 }}>Total</td>
                        <td style={{ ...pdfStyles.tdRight, fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                      </tr>
                      <tr>
                        <td style={pdfStyles.td}>IGST</td>
                        <td style={pdfStyles.tdRight}>0% <span style={{ marginLeft: '16px' }}>0</span></td>
                      </tr>
                      <tr>
                        <td style={pdfStyles.td}>CGST</td>
                        <td style={pdfStyles.tdRight}>9% <span style={{ marginLeft: '16px' }}>{formatCurrency(item.cgst)}</span></td>
                      </tr>
                      <tr>
                        <td style={pdfStyles.td}>SGST</td>
                        <td style={pdfStyles.tdRight}>9% <span style={{ marginLeft: '16px' }}>{formatCurrency(item.sgst)}</span></td>
                      </tr>
                      <tr style={{ fontWeight: 700 }}>
                        <td style={{ ...pdfStyles.td, fontWeight: 700 }}>Total With GST</td>
                        <td style={{ ...pdfStyles.tdRight, fontWeight: 700 }}>{formatCurrency(item.totalWithGst)}</td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div style={{ marginTop: '15px' }}>
                    <p style={{ color: '#666', fontSize: '11px' }}>Sales Manager</p>
                    <p style={{ fontWeight: 500 }}>{quotation.salesManager}</p>
                  </div>
                  
                  <p style={{ marginTop: '10px', textAlign: 'right', fontSize: '11px' }}>
                    Quotation <span style={{ fontWeight: 700, marginLeft: '8px' }}>{index + 1}</span>
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div style={pdfStyles.footer}>
                <p>(+91) 7066 46 6060</p>
                <p>info@esipl.in</p>
              </div>
            </div>
          </div>
        ))}

        {/* Terms & Conditions Page */}
        <div style={pdfStyles.page}>
          <div style={pdfStyles.border}>
            {/* Header */}
            <div style={pdfStyles.header}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>ecstatics.</h1>
                <p style={{ margin: '4px 0 0', fontSize: '11px' }}>Ecstatics Spaces India Pvt. Ltd.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Terms & Conditions</h2>
              </div>
            </div>

            <div style={{ fontSize: '11px', lineHeight: '1.8' }}>
              <ol style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '10px' }}>All prices are exclusive of GST unless otherwise mentioned.</li>
                <li style={{ marginBottom: '10px' }}>Payment Terms: 50% advance with order, balance before delivery.</li>
                <li style={{ marginBottom: '10px' }}>Delivery timeline: 6-8 weeks from the date of order confirmation.</li>
                <li style={{ marginBottom: '10px' }}>Quotation validity: 15 days from the date of issue.</li>
                <li style={{ marginBottom: '10px' }}>Any design changes after order confirmation may incur additional charges.</li>
                <li style={{ marginBottom: '10px' }}>Images shown are for reference only. Actual products may vary slightly.</li>
                <li style={{ marginBottom: '10px' }}>Installation charges are extra unless specifically included in the quotation.</li>
                <li style={{ marginBottom: '10px' }}>Warranty: 1 year manufacturing warranty on all furniture items.</li>
                <li style={{ marginBottom: '10px' }}>Cancellation policy: Orders once confirmed cannot be cancelled.</li>
                <li style={{ marginBottom: '10px' }}>All disputes are subject to Pune jurisdiction only.</li>
              </ol>
            </div>

            {/* Footer */}
            <div style={{ ...pdfStyles.footer, position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm' }}>
              <p>(+91) 7066 46 6060</p>
              <p>info@esipl.in</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
