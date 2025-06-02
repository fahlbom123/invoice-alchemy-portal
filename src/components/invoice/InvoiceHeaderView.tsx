import React, { useState, useEffect } from "react";
import { InvoiceFormData, SupplierInvoiceLine } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InvoiceHeaderViewProps {
  formData: InvoiceFormData;
  registeredTotals?: {
    totalActualCost: number;
    totalActualVat: number;
  } | null;
  supplierInvoiceLines?: SupplierInvoiceLine[];
  invoiceId?: string;
  selectedProject?: {
    id: string;
    projectNumber: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
}

const costAccounts = [
  { code: "4010", description: "Purchase of goods" },
  { code: "4020", description: "Domestic purchase of goods" },
  { code: "4050", description: "Purchase of goods from EU" },
  { code: "4531", description: "Purchase of services outside EU" },
  { code: "5460", description: "Consumables / Supplies" },
  { code: "6110", description: "Office supplies" },
  { code: "6540", description: "IT services" },
];

const vatAccounts = [
  { code: "2641", description: "Input VAT" },
  { code: "2614", description: "Output VAT (reverse charge)" },
  { code: "2645", description: "Calculated input VAT (reverse charge)" },
];

const InvoiceHeaderView = ({ formData, registeredTotals, supplierInvoiceLines = [], invoiceId, selectedProject }: InvoiceHeaderViewProps) => {
  const [source, setSource] = useState<"Fortnox" | "Manual">(formData.source || "Manual");

  // Helper function to capitalize status
  const capitalizeStatus = (status: string) => {
    if (status === "partial") {
      return "Partial Paid";
    }
    if (status === "overpaid") {
      return "Overpaid";
    }
    if (status === "sent_to_accounting") {
      return "Sent to Accounting";
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Helper function to get account description
  const getCostAccountDescription = (code: string) => {
    const account = costAccounts.find(acc => acc.code === code);
    return account ? `${account.code} - ${account.description}` : code;
  };

  const getVatAccountDescription = (code: string) => {
    const account = vatAccounts.find(acc => acc.code === code);
    return account ? `${account.code} - ${account.description}` : code;
  };

  // Calculate registered totals from supplier invoice lines
  const calculateRegisteredTotals = () => {
    if (registeredTotals) {
      return {
        totalRegisteredCost: registeredTotals.totalActualCost,
        totalRegisteredVat: registeredTotals.totalActualVat
      };
    }

    // Calculate from supplier invoice lines instead of regular invoice lines
    const totalRegisteredCost = supplierInvoiceLines.reduce((sum, line) => {
      return sum + (line.actualCost || 0);
    }, 0);
    
    const totalRegisteredVat = supplierInvoiceLines.reduce((sum, line) => {
      return sum + (line.actualVat || 0);
    }, 0);

    return { totalRegisteredCost, totalRegisteredVat };
  };

  const { totalRegisteredCost, totalRegisteredVat } = calculateRegisteredTotals();

  // Calculate the difference between total amount and registered actual cost
  const diffAmount = (formData.totalAmount || 0) - totalRegisteredCost;

  // Calculate total estimated cost from invoice lines that are linked to supplier invoice lines
  const totalEstimatedCost = formData.invoiceLines.reduce((sum, line) => {
    // Only include lines that have corresponding supplier invoice lines
    const hasSupplierInvoiceLine = supplierInvoiceLines.some(
      supplierLine => supplierLine.invoiceLineId === line.id
    );
    
    if (hasSupplierInvoiceLine) {
      return sum + (line.quantity * line.unitPrice);
    }
    
    return sum;
  }, 0);

  // Calculate supplier invoice total minus total estimated cost
  const supplierInvoiceTotalMinusEstimated = (formData.totalAmount || 0) - totalEstimatedCost;

  // Calculate status based on the new requirements
  const calculateStatus = () => {
    const supplierInvoiceTotal = formData.totalAmount || 0;
    
    // If status is already "sent_to_accounting", keep it
    if (formData.status === "sent_to_accounting") {
      return "sent_to_accounting";
    }
    
    // If supplier invoice total equals registered total actual cost, then status is paid
    if (supplierInvoiceTotal === totalRegisteredCost) {
      return "paid";
    }
    
    // If registered total actual cost > supplier invoice total, then overpaid
    if (totalRegisteredCost > supplierInvoiceTotal) {
      return "overpaid";
    }
    
    // If registered total actual cost = 0, then unpaid
    if (totalRegisteredCost === 0) {
      return "unpaid";
    }
    
    // If registered total actual cost > 0 and < Supplier Invoice Total, then partial paid
    if (totalRegisteredCost > 0 && totalRegisteredCost < supplierInvoiceTotal) {
      return "partial";
    }
    
    // Default fallback
    return "unpaid";
  };

  const calculatedStatus = calculateStatus();

  // Update the invoice status in localStorage when it changes
  useEffect(() => {
    if (!invoiceId) return;

    const updateInvoiceStatus = () => {
      try {
        const savedInvoices = localStorage.getItem('invoices');
        if (!savedInvoices) return;

        const invoices = JSON.parse(savedInvoices);
        const updatedInvoices = invoices.map((invoice: any) => {
          if (invoice.id === invoiceId && invoice.status !== calculatedStatus) {
            return {
              ...invoice,
              status: calculatedStatus,
              updatedAt: new Date().toISOString()
            };
          }
          return invoice;
        });

        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('invoicesUpdated'));
      } catch (error) {
        console.error('Error updating invoice status:', error);
      }
    };

    updateInvoiceStatus();
  }, [calculatedStatus, invoiceId]);

  // Handle source change
  const handleSourceChange = (newSource: "Fortnox" | "Manual") => {
    setSource(newSource);
    
    // Update invoice source in localStorage
    if (!invoiceId) return;

    try {
      const savedInvoices = localStorage.getItem('invoices');
      if (!savedInvoices) return;

      const invoices = JSON.parse(savedInvoices);
      const updatedInvoices = invoices.map((invoice: any) => {
        if (invoice.id === invoiceId) {
          return {
            ...invoice,
            source: newSource,
            updatedAt: new Date().toISOString()
          };
        }
        return invoice;
      });

      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('invoicesUpdated'));
    } catch (error) {
      console.error('Error updating invoice source:', error);
    }
  };

  // Handle send to accounting button click
  const handleSendToAccounting = () => {
    if (!invoiceId) return;

    try {
      const savedInvoices = localStorage.getItem('invoices');
      if (!savedInvoices) return;

      const invoices = JSON.parse(savedInvoices);
      const updatedInvoices = invoices.map((invoice: any) => {
        if (invoice.id === invoiceId) {
          return {
            ...invoice,
            status: "sent_to_accounting",
            updatedAt: new Date().toISOString()
          };
        }
        return invoice;
      });

      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('invoicesUpdated'));
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error sending invoice to accounting:', error);
    }
  };

  // Check if invoice is sent to accounting (locked state)
  const isSentToAccounting = formData.status === "sent_to_accounting";

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
            <span className="font-medium">{capitalizeStatus(calculatedStatus)}</span>
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
            <span className="text-sm text-gray-500">Cost Account</span>
            <span className="font-medium">{getCostAccountDescription(formData.account || "4010")}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">VAT Account</span>
            <span className="font-medium">{getVatAccountDescription(formData.vatAccount || "2641")}</span>
          </div>
        </div>

        {selectedProject && (
          <>
            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Project Number</span>
                <span className="font-medium">{selectedProject.projectNumber}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Project Period</span>
                <span className="font-medium">
                  {new Date(selectedProject.startDate).toLocaleDateString()} - {new Date(selectedProject.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Supplier Invoice Total incl VAT</span>
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

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Total Estimated Cost</span>
            <span className="font-medium">{formatCurrency(totalEstimatedCost, formData.currency)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Supplier invoice total incl vat - Total Estimated Cost</span>
            <span className="font-medium">{formatCurrency(supplierInvoiceTotalMinusEstimated, formData.currency)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Remaining</span>
            <span className="font-medium">{formatCurrency(diffAmount, formData.currency)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Send to accounting</span>
            <Button
              onClick={handleSendToAccounting}
              disabled={isSentToAccounting}
              variant={isSentToAccounting ? "secondary" : "default"}
              className="w-fit"
            >
              {isSentToAccounting ? "Sent to Accounting" : "Send to Accounting"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Source</span>
            <Select 
              value={source} 
              onValueChange={handleSourceChange}
              disabled={isSentToAccounting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Fortnox">Fortnox</SelectItem>
              </SelectContent>
            </Select>
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
