import { useState } from "react";
import { toast } from "sonner";
import { InvoiceLine } from "@/types/invoice";
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
  invoiceTotalAmount?: number; // Add this field
}

interface InvoiceLineSearchResultsProps {
  invoiceLines: SearchResultLine[];
  onRegister?: (selectedLines: SearchResultLine[], totals: { totalActualCost: number; totalActualVat: number; }) => void;
}

const InvoiceLineSearchResults = ({ invoiceLines, onRegister }: InvoiceLineSearchResultsProps) => {
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
              updatedLine.actualVat = line.estimatedVat;
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
            updatedLine.actualVat = line.estimatedVat;
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
      if (line.estimatedVat) {
        return sum + (line.estimatedCost * line.estimatedVat) / 100;
      }
      return sum;
    }, 0);

    const totalActualCost = selectedLinesData.reduce((sum, line) => {
      return sum + (line.actualCost || 0);
    }, 0);
    
    const totalActualVat = selectedLinesData.reduce((sum, line) => {
      if (line.actualCost && line.actualVat) {
        return sum + (line.actualCost * line.actualVat) / 100;
      }
      return sum;
    }, 0);

    // Calculate total invoiced amount from unique invoices
    const uniqueInvoices = new Map();
    selectedLinesData.forEach(line => {
      if (line.invoiceId && line.invoiceTotalAmount) {
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
        // Display the actual VAT amount for editing, not the percentage
        const currentVatAmount = line.actualVat && line.actualCost 
          ? (line.actualCost * line.actualVat) / 100 
          : 0;
        setEditingVat(currentVatAmount.toString());
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
      // Save the VAT amount directly, then calculate the rate for storage
      const actualVatAmount = parseFloat(editingVat);
      
      setLines(currentLines => 
        currentLines.map(line => {
          if (line.id === lineId) {
            // Calculate and store the VAT rate based on the entered amount
            const vatRate = line.actualCost ? (actualVatAmount / line.actualCost) * 100 : 0;
            return { ...line, actualVat: vatRate };
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
    const actualVat = registerVatValue ? parseFloat(registerVatValue) : undefined;

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
    
    // Call the onRegister callback with selected lines and totals
    if (onRegister) {
      onRegister(selectedLines, { totalActualCost, totalActualVat });
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
