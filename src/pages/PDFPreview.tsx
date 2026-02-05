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
    return <div className="p-6">Quotation not found</div>;
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

  return (
    <div className="min-h-screen bg-muted">
      {/* Controls */}
      <div className="no-print sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/quotations')} className="p-2 hover:bg-muted rounded-md">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">PDF Preview - {quotation.quotationNo}</h1>
        </div>
        <Button onClick={handlePrint} className="btn-accent">
          <Printer className="h-4 w-4 mr-2" />
          Print PDF
        </Button>
      </div>

      {/* PDF Pages */}
      <div className="p-8 space-y-8">
        {/* Summary Page */}
        <div className="pdf-page">
          <div className="border border-black p-6">
            {/* Header */}
            <div className="border-b border-black pb-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">ecstatics.</h1>
                  <p className="text-sm mt-1">Ecstatics Spaces India Pvt. Ltd.</p>
                  <p className="text-sm">3120, Ganga Trueno, Airport Road, Viman Nagar, Pune</p>
                  <p className="text-sm">GST No: 27AAFCE9942B1ZM</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-semibold">Quotation</h2>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="flex justify-between mb-6">
              <div>
                <p><span className="text-gray-600">Client name</span> <span className="ml-4 font-medium">{customer.name}</span></p>
                <p><span className="text-gray-600">Contact No</span> <span className="ml-4">{customer.mobile}</span></p>
              </div>
              <div className="text-right">
                <p><span className="text-gray-600">Date</span></p>
                <p>{formatDate(quotation.date)}</p>
              </div>
            </div>

            {/* Summary Table */}
            <h3 className="text-center font-semibold mb-4">Quotation Summary</h3>
            <table className="pdf-table mb-6">
              <thead>
                <tr>
                  <th>Sr no</th>
                  <th>Code</th>
                  <th>Final Price</th>
                  <th>Units</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="text-center">{index + 1}</td>
                    <td>{item.productCode}</td>
                    <td className="text-right">{formatCurrency(item.finalPrice)}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={4} className="text-center">Grand Total</td>
                  <td className="text-right">{formatCurrency(quotation.grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            {/* GST Summary */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-gray-600">Sales Manager</p>
                <p className="font-medium">{quotation.salesManager}</p>
              </div>
              <table className="pdf-table w-64">
                <tbody>
                  <tr><td>Grand Total</td><td className="text-right">{formatCurrency(quotation.grandTotal)}</td></tr>
                  <tr><td>IGST</td><td className="text-center">0%</td><td className="text-right">0</td></tr>
                  <tr><td>CGST</td><td className="text-center">9%</td><td className="text-right">{formatCurrency(quotation.cgst)}</td></tr>
                  <tr><td>SGST</td><td className="text-center">9%</td><td className="text-right">{formatCurrency(quotation.sgst)}</td></tr>
                  <tr className="font-bold"><td>Grand Total With GST</td><td className="text-center">18%</td><td className="text-right">{formatCurrency(quotation.grandTotalWithGst)}</td></tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-black flex justify-between text-sm text-gray-600">
              <p>(+91) 7066 46 6060</p>
              <p>info@esipl.in</p>
            </div>
          </div>
        </div>

        {/* Individual Product Pages */}
        {quotation.items.map((item, index) => (
          <div key={item.id} className="pdf-page">
            <div className="border border-black p-6 h-full flex flex-col">
              {/* Header */}
              <div className="border-b border-black pb-4 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">ecstatics.</h1>
                    <p className="text-sm mt-1">Ecstatics Spaces India Pvt. Ltd.</p>
                    <p className="text-sm">3120, Ganga Trueno, Airport Road, Viman Nagar, Pune</p>
                    <p className="text-sm">GST No: 27AAFCE9942B1ZM</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-semibold">Quotation</h2>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border border-black p-3 mb-4 bg-gray-50">
                <p className="font-semibold mb-2">Notes:</p>
                {item.notes.map((note, i) => (
                  <p key={i} className="text-sm">{i + 1}. {note}</p>
                ))}
              </div>

              {/* Client Info */}
              <div className="flex justify-between mb-4">
                <div>
                  <p><span className="text-gray-600">Client name</span> <span className="ml-4 font-medium">{customer.name}</span></p>
                  <p><span className="text-gray-600">Contact No</span> <span className="ml-4">{customer.mobile}</span></p>
                </div>
                <div className="text-right">
                  <p><span className="text-gray-600">Date</span></p>
                  <p>{formatDate(quotation.date)}</p>
                </div>
              </div>

              {/* Product Content */}
              <div className="flex-1 flex gap-6">
                {/* Reference Image */}
                <div className="w-1/2">
                  <table className="pdf-table h-full">
                    <thead><tr><th>Reference Image</th></tr></thead>
                    <tbody>
                      <tr>
                        <td className="p-4 h-64">
                          {item.images[0] ? (
                            <img src={item.images[0]} alt={item.productName} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Details */}
                <div className="w-1/2">
                  <table className="pdf-table">
                    <tbody>
                      <tr><td className="font-semibold">CODE</td><td>{item.productCode}</td></tr>
                      <tr><td>Price</td><td className="text-right">{formatCurrency(item.basePrice)}</td></tr>
                      <tr><td>Discount</td><td className="text-right">{item.discountPercent}% <span className="text-gray-500 ml-2">{formatCurrency(item.discountAmount)}</span></td></tr>
                      <tr><td>Final Price</td><td className="text-right">{formatCurrency(item.finalPrice)}</td></tr>
                      <tr><td>Units</td><td className="text-right">{item.quantity}</td></tr>
                      <tr className="font-semibold"><td>Total</td><td className="text-right">{formatCurrency(item.total)}</td></tr>
                      <tr><td>IGST</td><td className="text-right">0% <span className="ml-4">0</span></td></tr>
                      <tr><td>CGST</td><td className="text-right">9% <span className="ml-4">{formatCurrency(item.cgst)}</span></td></tr>
                      <tr><td>SGST</td><td className="text-right">9% <span className="ml-4">{formatCurrency(item.sgst)}</span></td></tr>
                      <tr className="font-bold"><td>Total With GST</td><td className="text-right">{formatCurrency(item.totalWithGst)}</td></tr>
                    </tbody>
                  </table>
                  <div className="mt-4 text-sm">
                    <p className="text-gray-600">Sales Manager</p>
                    <p className="font-medium">{quotation.salesManager}</p>
                  </div>
                  <p className="mt-2 text-right text-sm">Quotation <span className="font-bold ml-2">{index + 1}</span></p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-black flex justify-between text-sm text-gray-600">
                <p>(+91) 7066 46 6060</p>
                <p>info@esipl.in</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFPreview;
