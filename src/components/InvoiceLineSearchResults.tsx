
import { useState } from "react";
import { toast } from "sonner";
import { InvoiceLine, SupplierInvoiceLine } from "@/types/invoice";
import SearchResultsTable from "./invoice-search/SearchResultsTable";
import SelectedLinesSummary from "./invoice-search/SelectedLinesSummary";
import CostRegistrationModal from "./invoice-search/CostRegistrationModal";

// Extend InvoiceLine to include invoice reference
interface SearchResultLine extends InvoiceLine {
  invoiceId?: string;
  invoiceNumber?: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  departureDate?: string;
  paymentStatus?: "paid" | "unpaid" | "partial";
  supplier?: {
    accountNumber?: string;
    defaultCurrency?: string;
    currencyRate?: number;
  };
  selected?: boolean;
  invoiceTotalAmount?: number;
}

interface InvoiceLineSearchResultsProps {
  invoiceLines: SearchResultLine[];
  invoiceTotalAmount: number;
  onRegister?: (selectedLines: SearchResultLine[], totals: { totalActualCost: number; totalActualVat: number; }, supplierInvoiceLines: SupplierInvoiceLine[]) => void;
}

const InvoiceLineSearchResults = ({ invoiceLines, invoiceTotalAmount, onRegister }: InvoiceLineSearchResultsProps) => {
  const [lines, setLines] = useState<SearchResultLine[]>(invoiceLines);
  const [selectedLines, setSelectedLines] = useState<SearchResultLine[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerCostValue, setRegisterCostValue] = useState<string>("");
  const [registerVatValue, setRegisterVatValue] = useState<string>("");
  const [registerCostLineId, setRegisterCostLineId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<string>("");
  const [editingVat, setEditingVat] = useState<string>("");

  const handleSelectLine = (id: string, checked: boolean) => {
    setLines(currentLines => 
      currentLines.map(line => {
        if (line.id === id) {
          const updatedLine = { ...line, selected: checked };
          
          // When checking a line, set actual cost and VAT to estimated values only if actual cost has no value
          if (checked) {
            if (!updatedLine.actualCost || updatedLine.actualCost === 0) {
              updatedLine.actualCost = line.estimatedCost;
              // Set actualVat as amount (estimated VAT is already an amount)
              updatedLine.actualVat = line.estimatedVat || 0;
            }
          }
          
          return updatedLine;
        }
        return line;
      })
    );

    const updatedSelectedLines = lines.filter(line => 
      line.id === id ? checked : line.selected
    );
    setSelectedLines(updatedSelectedLines);
  };

  const handleSelectAll = (checked: boolean) => {
    setLines(currentLines => 
      currentLines.map(line => {
        const updatedLine = { ...line, selected: checked };
        
        // When checking all lines, set actual cost and VAT to estimated values only if actual cost has no value
        if (checked) {
          if (!updatedLine.actualCost || updatedLine.actualCost === 0) {
            updatedLine.actualCost = line.estimatedCost;
            // Set actualVat as amount (estimated VAT is already an amount)
            updatedLine.actualVat = line.estimatedVat || 0;
          }
        }
        
        return updatedLine;
      })
    );
    
    setSelectedLines(checked ? [...lines] : []);
  };

  // Calculate totals for selected lines
  const calculateSelectedTotals = () => {
    const selectedLinesData = lines.filter(line => line.selected);
    
    const totalEstimatedCost = selectedLinesData.reduce((sum, line) => sum + line.estimatedCost, 0);
    const totalEstimatedVat = selectedLinesData.reduce((sum, line) => {
      return sum + (line.estimatedVat || 0);
    }, 0);

    const totalActualCost = selectedLinesData.reduce((sum, line) => {
      return sum + (line.actualCost || 0);
    }, 0);
    
    const totalActualVat = selectedLinesData.reduce((sum, line) => {
      return sum + (line.actualVat || 0);
    }, 0);

    // Calculate total invoiced amount from unique invoices - this should show the Total Amount incl VAT from supplier invoice details
    const uniqueInvoices = new Map();
    selectedLinesData.forEach(line => {
      if (line.invoiceId && line.invoiceTotalAmount !== undefined) {
        uniqueInvoices.set(line.invoiceId, line.invoiceTotalAmount);
      }
    });
    const totalInvoicedAmount = Array.from(uniqueInvoices.values()).reduce((sum, amount) => sum + amount, 0);

    return {
      totalEstimatedCost,
      totalEstimatedVat,
      totalActualCost,
      totalActualVat,
      totalInvoicedAmount,
      count: selectedLinesData.length
    };
  };

  const { totalEstimatedCost, totalEstimatedVat, totalActualCost, totalActualVat, totalInvoicedAmount, count } = calculateSelectedTotals();

  const handleEditActualCost = (lineId: string) => {
    if (lineId.includes('-cost')) {
      const actualLineId = lineId.replace('-cost', '');
      const line = lines.find(l => l.id === actualLineId);
      if (line) {
        setEditingLine(lineId);
        setEditingCost(line.actualCost?.toString() || "");
      }
    } else if (lineId.includes('-vat')) {
      const actualLineId = lineId.replace('-vat', '');
      const line = lines.find(l => l.id === actualLineId);
      if (line) {
        setEditingLine(lineId);
        // Display the actual VAT amount for editing
        setEditingVat((line.actualVat || 0).toString());
      }
    }
  };

  const handleSaveActualCost = (lineId: string) => {
    if (editingLine?.includes('-cost')) {
      if (!editingCost) return;
      const actualCost = parseFloat(editingCost);
      
      setLines(currentLines => 
        currentLines.map(line => 
          line.id === lineId 
            ? { ...line, actualCost } 
            : line
        )
      );
      
      toast.success("Actual cost saved successfully");
    } else if (editingLine?.includes('-vat')) {
      if (!editingVat) return;
      // Save the VAT amount directly
      const actualVatAmount = parseFloat(editingVat);
      
      setLines(currentLines => 
        currentLines.map(line => {
          if (line.id === lineId) {
            return { ...line, actualVat: actualVatAmount };
          }
          return line;
        })
      );
      
      toast.success("Actual VAT saved successfully");
    }

    setEditingLine(null);
    setEditingCost("");
    setEditingVat("");
  };

  const handleCancelEdit = () => {
    setEditingLine(null);
    setEditingCost("");
    setEditingVat("");
  };

  const handleSaveRegisteredCost = () => {
    if (!registerCostLineId || !registerCostValue) return;

    const actualCost = parseFloat(registerCostValue);
    const actualVat = registerVatValue ? parseFloat(registerVatValue) : 0;

    setLines(currentLines => 
      currentLines.map(line => 
        line.id === registerCostLineId 
          ? { ...line, actualCost, actualVat } 
          : line
      )
    );

    toast.success("Cost registered successfully");
    setIsRegistering(false);
    setRegisterCostLineId(null);
    setRegisterCostValue("");
    setRegisterVatValue("");
  };

  const handleRegisterMultipleInvoices = () => {
    if (selectedLines.length === 0) {
      toast.error("Please select at least one invoice line");
      return;
    }
    
    console.log("Selected lines for registration:", selectedLines.map(line => ({
      id: line.id,
      description: line.description,
      actualCost: line.actualCost,
      actualVat: line.actualVat
    })));
    
    // Create supplier invoice lines from selected lines - get actual values from the current lines state
    const supplierInvoiceLines: SupplierInvoiceLine[] = lines
      .filter(line => line.selected)
      .map(line => {
        console.log(`Creating supplier invoice line for ${line.id}:`, {
          actualCost: line.actualCost,
          actualVat: line.actualVat
        });
        
        return {
          id: `sil-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          invoiceLineId: line.id,
          actualCost: line.actualCost || 0,
          actualVat: line.actualVat || 0,
          currency: line.currency || "USD",
          createdAt: new Date().toISOString(),
          description: line.description,
          supplierName: line.supplierName,
        };
      });
    
    console.log("Created supplier invoice lines:", supplierInvoiceLines);
    
    // Call the onRegister callback with selected lines, totals, and supplier invoice lines
    if (onRegister) {
      onRegister(selectedLines, { totalActualCost, totalActualVat }, supplierInvoiceLines);
    }
    
    toast.success(`Registered ${selectedLines.length} invoice lines`);
  };

  const handleToggleFullyPaid = (lineId: string, isPaid: boolean) => {
    setLines(currentLines => 
      currentLines.map(line => 
        line.id === lineId 
          ? { ...line, paymentStatus: isPaid ? "paid" : "unpaid" } 
          : line
      )
    );
    
    toast.success(`Payment status ${isPaid ? 'marked as paid' : 'marked as unpaid'}`);
  };

  const handleCloseModal = () => {
    setIsRegistering(false);
    setRegisterCostLineId(null);
  };

  const hasSelectedLines = selectedLines.length > 0;
  
  return (
    <div>
      <CostRegistrationModal
        isOpen={isRegistering}
        registerCostValue={registerCostValue}
        registerVatValue={registerVatValue}
        onClose={handleCloseModal}
        onSave={handleSaveRegisteredCost}
        setRegisterCostValue={setRegisterCostValue}
        setRegisterVatValue={setRegisterVatValue}
      />

      {hasSelectedLines && (
        <SelectedLinesSummary
          count={count}
          totalEstimatedCost={totalEstimatedCost}
          totalEstimatedVat={totalEstimatedVat}
          totalActualCost={totalActualCost}
          totalActualVat={totalActualVat}
          totalInvoicedAmount={totalInvoicedAmount}
          invoiceTotalAmount={invoiceTotalAmount}
          onRegisterMultipleInvoices={handleRegisterMultipleInvoices}
        />
      )}

      <SearchResultsTable
        lines={lines}
        editingLine={editingLine}
        editingCost={editingCost}
        editingVat={editingVat}
        onSelectLine={handleSelectLine}
        onSelectAll={handleSelectAll}
        onEditActualCost={handleEditActualCost}
        onSaveActualCost={handleSaveActualCost}
        onCancelEdit={handleCancelEdit}
        onToggleFullyPaid={handleToggleFullyPaid}
        setEditingCost={setEditingCost}
        setEditingVat={setEditingVat}
      />
    </div>
  );
};

export default InvoiceLineSearchResults;
