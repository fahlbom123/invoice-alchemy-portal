
import React from "react";
import { InvoiceFormData } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceHeaderViewProps {
  formData: InvoiceFormData;
}

const InvoiceHeaderView = ({ formData }: InvoiceHeaderViewProps) => {
  // Helper function to capitalize status
  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Calculate registered totals from invoice lines
  const calculateRegisteredTotals = () => {
    const totalRegisteredCost = formData.invoiceLines.reduce((sum, line) => {
      return sum + (line.actualCost || 0);
    }, 0);
    
    const totalRegisteredVat = formData.invoiceLines.reduce((sum, line) => {
      if (line.actualCost && line.actualVat) {
        return sum + (line.actualCost * line.actualVat) / 100;
      }
      return sum;
    }, 0);

    return { totalRegisteredCost, totalRegisteredVat };
  };

  const { totalRegisteredCost, totalRegisteredVat } = calculateRegisteredTotals();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Invoice Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Invoice Number</span>
            <span className="font-medium">{formData.invoiceNumber}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Reference</span>
            <span className="font-medium">{formData.reference || "N/A"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Invoice Date</span>
            <span className="font-medium">{formData.invoiceDate}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Payment Date</span>
            <span className="font-medium">{formData.dueDate}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Status</span>
            <span className="font-medium">{capitalizeStatus(formData.status)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Currency</span>
            <span className="font-medium">{formData.currency || "USD"}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Total Amount incl VAT</span>
            <span className="font-medium">{formatCurrency(formData.totalAmount || 0, formData.currency)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Total VAT</span>
            <span className="font-medium">{formatCurrency(formData.totalVat || 0, formData.currency)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Registered Total Actual Cost</span>
            <span className="font-medium">{formatCurrency(totalRegisteredCost, formData.currency)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Registered Total Actual VAT</span>
            <span className="font-medium">{formatCurrency(totalRegisteredVat, formData.currency)}</span>
          </div>
        </div>

        {formData.ocr && (
          <div className="space-y-2">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">OCR</span>
              <span className="font-medium">{formData.ocr}</span>
            </div>
          </div>
        )}

        {formData.notes && (
          <div className="space-y-2 col-span-1 md:col-span-2">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Notes</span>
              <span className="font-medium">{formData.notes}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceHeaderView;
