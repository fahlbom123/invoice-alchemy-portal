import { useState, useEffect } from "react";
import { toast } from "sonner";
import { InvoiceLine, SupplierInvoiceLine } from "@/types/invoice";
import SearchResultsTable from "./invoice-search/SearchResultsTable";
import SelectedLinesSummary from "./invoice-search/SelectedLinesSummary";
import CostRegistrationModal from "./invoice-search/CostRegistrationModal";
import { supabase } from "@/integrations/supabase/client";
import { mockBookings } from "@/data/mockData";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  registeredActualCost?: number;
}

interface InvoiceLineSearchResultsProps {
  invoiceLines: SearchResultLine[];
  invoiceTotalAmount: number;
  allSupplierInvoiceLines?: SupplierInvoiceLine[];
  onRegister?: (selectedLines: SearchResultLine[], totals: { totalActualCost: number; totalActualVat: number; }, supplierInvoiceLines: SupplierInvoiceLine[], allLinesPaid?: boolean) => void;
  onLineStatusUpdate?: (lineUpdates: { lineId: string; paymentStatus: "paid" | "unpaid" | "partial" }[]) => void;
}

const InvoiceLineSearchResults = ({ invoiceLines, invoiceTotalAmount, allSupplierInvoiceLines = [], onRegister, onLineStatusUpdate }: InvoiceLineSearchResultsProps) => {
  // Helper function to get booking details from booking number
  const getBookingDetails = (bookingNumber?: string) => {
    if (!bookingNumber) return { firstName: '', lastName: '' };
    const booking = mockBookings.find(b => b.bookingNumber === bookingNumber);
    return {
      firstName: booking?.firstName || '',
      lastName: booking?.lastName || ''
    };
  };

  // Calculate registered amounts for each line
  const calculateLinesWithRegistered = (lines: SearchResultLine[]) => {
    return lines.map(line => {
      const registeredLines = allSupplierInvoiceLines.filter(sil => sil.invoiceLineId === line.id);
      const registeredActualCost = registeredLines.reduce((sum, sil) => sum + sil.actualCost, 0);
      
      // Get booking details and add them to the line for compatibility
      const bookingDetails = getBookingDetails(line.bookingNumber);
      
      return {
        ...line,
        registeredActualCost,
        // Ensure actualVat is always a number, never undefined
        actualVat: line.actualVat || 0,
        // Add booking details for backward compatibility with existing components
        firstName: bookingDetails.firstName,
        lastName: bookingDetails.lastName
      };
    });
  };

  const [lines, setLines] = useState<SearchResultLine[]>(() => calculateLinesWithRegistered(invoiceLines));
  const [selectedLines, setSelectedLines] = useState<SearchResultLine[]>([]);
  
  // Update lines when invoiceLines prop changes, but preserve selections and local edits
  useEffect(() => {
    console.log("InvoiceLineSearchResults: invoiceLines prop changed, updating internal state");
    const updatedLines = calculateLinesWithRegistered(invoiceLines);
    
    // Preserve existing selections and local edits by merging with current state
    setLines(currentLines => {
      return updatedLines.map(newLine => {
        const existingLine = currentLines.find(line => line.id === newLine.id);
        if (existingLine) {
          // Preserve selection state and any local edits, but update payment status and other props from the new data
          return {
            ...newLine,
            selected: existingLine.selected,
            actualCost: existingLine.actualCost || newLine.actualCost,
            actualVat: existingLine.actualVat || newLine.actualVat
          };
        }
        return newLine;
      });
    });
    
    // Update selected lines to match the current selections
    setSelectedLines(currentSelected => {
      return currentSelected.map(selectedLine => {
        const updatedLine = updatedLines.find(line => line.id === selectedLine.id);
        return updatedLine ? { ...updatedLine, selected: true } : selectedLine;
      }).filter(line => updatedLines.some(ul => ul.id === line.id));
    });
  }, [invoiceLines, allSupplierInvoiceLines]);

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerCostValue, setRegisterCostValue] = useState<string>("");
  const [registerVatValue, setRegisterVatValue] = useState<string>("");
  const [registerCostLineId, setRegisterCostLineId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<string>("");
  const [editingVat, setEditingVat] = useState<string>("");
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState<boolean>(false);

  const handleSelectLine = (id: string, checked: boolean) => {
    // Don't allow selection of paid lines
    const line = lines.find(l => l.id === id);
    if (line?.paymentStatus === "paid" && checked) {
      toast.error("Cannot select paid booking lines");
      return;
    }

    setLines(currentLines => 
      currentLines.map(line => {
        if (line.id === id) {
          const updatedLine = { ...line, selected: checked };
          
          // When checking a line, set actual cost to estimated cost only if actual cost has no value
          if (checked) {
            if (!updatedLine.actualCost || updatedLine.actualCost === 0) {
              updatedLine.actualCost = line.estimatedCost;
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
    if (checked) {
      // Filter out paid lines when selecting all
      const unpaidLines = lines.filter(line => line.paymentStatus !== "paid");
      
      setLines(currentLines => 
        currentLines.map(line => {
          if (line.paymentStatus === "paid") {
            return line; // Keep paid lines unselected
          }
          
          const updatedLine = { ...line, selected: checked };
          
          // When checking all lines, set actual cost to estimated cost only if actual cost has no value
          if (checked) {
            if (!updatedLine.actualCost || updatedLine.actualCost === 0) {
              updatedLine.actualCost = line.estimatedCost;
            }
          }
          
          return updatedLine;
        })
      );
      
      setSelectedLines(unpaidLines);
    } else {
      setLines(currentLines => 
        currentLines.map(line => ({ ...line, selected: false }))
      );
      setSelectedLines([]);
    }
  };

  // Calculate totals for selected lines
  const calculateSelectedTotals = () => {
    const selectedLinesData = lines.filter(line => line.selected);
    
    const totalEstimatedCost = selectedLinesData.reduce((sum, line) => sum + line.estimatedCost, 0);

    const totalActualCost = selectedLinesData.reduce((sum, line) => {
      return sum + (line.actualCost || 0);
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
      totalActualCost,
      totalInvoicedAmount,
      count: selectedLinesData.length
    };
  };

  const { totalEstimatedCost, totalActualCost, totalInvoicedAmount, count } = calculateSelectedTotals();

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
      toast.error("Please select at least one booking line");
      return;
    }
    
    // Show confirmation dialog instead of immediately registering
    setShowPaymentConfirmation(true);
  };

  const handleConfirmRegistration = async (allLinesPaid: boolean) => {
    setShowPaymentConfirmation(false);
    
    console.log("Selected lines for registration:", selectedLines.map(line => ({
      id: line.id,
      description: line.description,
      actualCost: line.actualCost,
      actualVat: line.actualVat
    })));
    
    // Collect line updates for status changes
    const lineUpdates: { lineId: string; paymentStatus: "paid" | "unpaid" | "partial" }[] = [];
    
    // Update the selected lines status to "paid" if user confirmed all lines are paid
    if (allLinesPaid) {
      setLines(currentLines => 
        currentLines.map(line => {
          if (line.selected) {
            lineUpdates.push({ lineId: line.id, paymentStatus: "paid" });
            return { ...line, paymentStatus: "paid" as const };
          }
          return line;
        })
      );
      
      // Also update the selectedLines to reflect the status change
      setSelectedLines(currentSelectedLines => 
        currentSelectedLines.map(line => ({ ...line, paymentStatus: "paid" as const }))
      );
    }
    
    // Notify parent component about line status updates so they can be persisted
    if (lineUpdates.length > 0 && onLineStatusUpdate) {
      onLineStatusUpdate(lineUpdates);
    }
    
    // Create supplier invoice lines from selected lines - get actual values from the current lines state
    const supplierInvoiceLines: SupplierInvoiceLine[] = lines
      .filter(line => line.selected)
      .map(line => {
        // Ensure actualVat is always a valid number
        const actualVat = typeof line.actualVat === 'number' ? line.actualVat : 0;
        
        console.log(`Creating supplier invoice line for ${line.id}:`, {
          actualCost: line.actualCost,
          actualVat: actualVat
        });
        
        return {
          id: `sil-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          invoiceLineId: line.id,
          actualCost: line.actualCost || 0,
          actualVat: actualVat,
          currency: line.currency || "USD",
          createdAt: new Date().toISOString(),
          createdBy: "Current User", // For now, we'll use a placeholder. In a real app, this would come from authentication
          description: line.description,
          supplierName: line.supplierName,
        };
      });
    
    console.log("Created supplier invoice lines:", supplierInvoiceLines);

    // Save supplier invoice lines to Supabase database
    try {
      const supplierInvoiceLineData = supplierInvoiceLines.map(line => ({
        invoice_line_id: line.invoiceLineId,
        actual_cost: line.actualCost,
        actual_vat: line.actualVat,
        currency: line.currency,
        created_by: line.createdBy,
        description: line.description,
        supplier_name: line.supplierName
      }));

      const { error: insertError } = await supabase
        .from('supplier_invoice_lines')
        .insert(supplierInvoiceLineData);

      if (insertError) {
        console.error('Error saving registered bookings to database:', insertError);
        toast.error("Failed to save registered bookings to database");
        return;
      }

      console.log("Successfully saved registered bookings to database");
    } catch (error) {
      console.error('Error in database operation:', error);
      toast.error("Failed to save registered bookings");
      return;
    }
    
    // Check if all lines are fully paid after registration
    const allInvoiceLinesPaid = lines.every(line => 
      line.paymentStatus === "paid" || line.selected
    );
    
    // Call the onRegister callback with selected lines, totals, supplier invoice lines, and paid status
    if (onRegister) {
      const { totalActualCost } = calculateSelectedTotals();
      onRegister(selectedLines, { totalActualCost, totalActualVat: 0 }, supplierInvoiceLines, allInvoiceLinesPaid);
    }
    
    toast.success(`Registered ${selectedLines.length} booking lines`);
  };

  const handleToggleFullyPaid = (lineId: string, isPaid: boolean) => {
    const newStatus = isPaid ? "paid" : "unpaid";
    
    // Update local state immediately
    setLines(currentLines => 
      currentLines.map(line => 
        line.id === lineId 
          ? { ...line, paymentStatus: newStatus } 
          : line
      )
    );
    
    // Also update selectedLines if the line is selected
    setSelectedLines(currentSelected => 
      currentSelected.map(line => 
        line.id === lineId 
          ? { ...line, paymentStatus: newStatus } 
          : line
      )
    );
    
    // Notify parent component about line status update so it can be persisted
    if (onLineStatusUpdate) {
      onLineStatusUpdate([{ lineId, paymentStatus: newStatus }]);
    }
    
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

      <AlertDialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payment Status Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are all selected booking lines fully paid? This will mark all selected lines as "fully paid" and may update the booking status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleConfirmRegistration(false)}>
              No, not all paid
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmRegistration(true)}>
              Yes, all fully paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {hasSelectedLines && (
        <SelectedLinesSummary
          count={count}
          totalEstimatedCost={totalEstimatedCost}
          totalEstimatedVat={0}
          totalActualCost={totalActualCost}
          totalActualVat={0}
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
