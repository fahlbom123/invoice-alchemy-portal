import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useInvoiceById, useInvoices, useSaveInvoice } from "@/hooks/useInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Invoice, InvoiceFormData, InvoiceLine, SupplierInvoiceLine } from "@/types/invoice";
import SupplierDetails from "@/components/invoice/SupplierDetails";
import InvoiceHeaderView from "@/components/invoice/InvoiceHeaderView";
import InvoiceLineSearchResults from "@/components/InvoiceLineSearchResults";
import { ArrowLeft, Edit, Trash2, Save, X, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const { invoice, isLoading } = useInvoiceById(id || "");
  const { invoices, isLoading: isLoadingInvoices } = useInvoices();
  const { suppliers } = useSuppliers();
  const { saveInvoice } = useSaveInvoice();
  const navigate = useNavigate();

  // Add state to track if invoice is cancelled
  const [isCancelled, setIsCancelled] = useState(false);

  // Add state to track if invoice is sent to accounting
  const [isSentToAccounting, setIsSentToAccounting] = useState(false);

  // Check if invoice is cancelled or sent to accounting when component loads
  useEffect(() => {
    if (invoice) {
      setIsCancelled(invoice.status === "cancelled");
      setIsSentToAccounting(invoice.status === "sent_to_accounting");
    }
  }, [invoice]);

  // Determine the locked cost type based on existing supplier invoice lines
  const getLockedCostType = (): "Invoice lines" | "Booking Supplier" | null => {
    // If invoice is cancelled or sent to accounting, lock cost type
    if (isCancelled || isSentToAccounting) {
      return "Invoice lines"; // Default lock when cancelled or sent to accounting
    }

    if (!invoice?.supplierInvoiceLines || invoice.supplierInvoiceLines.length === 0) {
      return null;
    }

    // Check if any supplier invoice line has a summary ID (booking supplier)
    const hasBookingSupplierLines = invoice.supplierInvoiceLines.some(line => 
      line.invoiceLineId && line.invoiceLineId.startsWith('summary-')
    );

    if (hasBookingSupplierLines) {
      return "Booking Supplier";
    }

    // Check if any supplier invoice line references individual invoice lines
    const hasIndividualLines = invoice.supplierInvoiceLines.some(line => 
      line.invoiceLineId && !line.invoiceLineId.startsWith('summary-')
    );

    if (hasIndividualLines) {
      return "Invoice lines";
    }

    // Default fallback (shouldn't happen but just in case)
    return "Invoice lines";
  };

  const lockedCostType = getLockedCostType();
  const isCostTypeLocked = lockedCostType !== null;

  // Check if cancel button should be enabled (no lines connected)
  const canCancelInvoice = !invoice?.supplierInvoiceLines || invoice.supplierInvoiceLines.length === 0;

  // Add cost type state - remove Project option, use locked type if available
  const [costType, setCostType] = useState<"Invoice lines" | "Booking Supplier">(
    lockedCostType || "Invoice lines"
  );

  // Update cost type when invoice changes
  useEffect(() => {
    if (invoice) {
      const locked = getLockedCostType();
      if (locked) {
        setCostType(locked);
      }
    }
  }, [invoice]);

  // Add the missing formData state
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: "",
    reference: "",
    status: "",
    dueDate: "",
    invoiceDate: "",
    supplierId: "",
    notes: "",
    invoiceLines: [],
    currency: "USD",
    totalAmount: 0,
    totalVat: 0,
    ocr: "",
  });

  // Add state for registered totals
  const [registeredTotals, setRegisteredTotals] = useState<{
    totalActualCost: number;
    totalActualVat: number;
  } | null>(null);

  // Add state for editing supplier invoice lines
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<SupplierInvoiceLine | null>(null);

  // Search state - initialize supplierId with invoice supplier if available
  const [supplierId, setSupplierId] = useState<string>(invoice?.supplier.id || "all");
  const [description, setDescription] = useState<string>("");
  const [bookingNumber, setBookingNumber] = useState<string>("");
  const [confirmationNumber, setConfirmationNumber] = useState<string>("");
  const [departureDateStart, setDepartureDateStart] = useState<string>("");
  const [departureDateEnd, setDepartureDateEnd] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<InvoiceLine[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Add state for booking supplier summary
  const [selectedSummaryLines, setSelectedSummaryLines] = useState<Set<string>>(new Set());
  const [editingSummaryLine, setEditingSummaryLine] = useState<string | null>(null);
  const [editingActualCost, setEditingActualCost] = useState<string>("");
  const [editingActualVat, setEditingActualVat] = useState<string>("");
  const [summaryActualCosts, setSummaryActualCosts] = useState<Map<string, number>>(new Map());
  const [summaryActualVats, setSummaryActualVats] = useState<Map<string, number>>(new Map());

  // Extract all invoice lines from all invoices - now include invoice total amount
  const allInvoiceLines = invoices.flatMap(invoice => 
    invoice.invoiceLines.map(line => ({
      ...line,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      bookingNumber: line.bookingNumber || "",
      confirmationNumber: line.confirmationNumber || "",
      departureDate: line.departureDate || "",
      paymentStatus: line.paymentStatus || "unpaid",
      invoiceTotalAmount: invoice.totalAmount || 0
    }))
  );

  // Get all supplier invoice lines from all invoices
  const allSupplierInvoiceLines = invoices.flatMap(invoice => 
    invoice.supplierInvoiceLines || []
  );

  // Function to get booking number for supplier invoice line by matching with original invoice line
  const getBookingNumberForSupplierLine = (supplierLine: SupplierInvoiceLine) => {
    // Find the original invoice line that this supplier line references
    const originalLine = allInvoiceLines.find(line => line.id === supplierLine.invoiceLineId);
    
    if (originalLine?.bookingNumber) {
      return originalLine.bookingNumber;
    }
    
    // Fallback: generate consistent random number if no booking number exists
    const seed = supplierLine.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const random = Math.abs(seed) % 90000000;
    return (10000000 + random).toString();
  };

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.reference,
        status: invoice.status,
        dueDate: invoice.dueDate 
          ? new Date(invoice.dueDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        invoiceDate: invoice.invoiceDate 
          ? new Date(invoice.invoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        supplierId: invoice.supplier.id,
        notes: invoice.notes || "",
        invoiceLines: invoice.invoiceLines,
        currency: invoice.currency || "USD",
        totalAmount: invoice.totalAmount || 0,
        totalVat: invoice.totalVat || 0,
        ocr: invoice.ocr || "",
      });
      
      // Set the supplier search filter to match the current invoice's supplier
      setSupplierId(invoice.supplier.id);
    }
  }, [invoice]);

  // Add function to start editing a supplier invoice line
  const handleEditSupplierLine = (line: SupplierInvoiceLine) => {
    setEditingLineId(line.id);
    setEditingLine({ ...line });
  };

  // Add function to cancel editing
  const handleCancelEdit = () => {
    setEditingLineId(null);
    setEditingLine(null);
  };

  // Add function to save edited supplier invoice line
  const handleSaveSupplierLine = async () => {
    if (!invoice || !editingLine) return;

    try {
      // Update the supplier invoice line in the invoice
      const updatedSupplierInvoiceLines = (invoice.supplierInvoiceLines || []).map(line =>
        line.id === editingLine.id ? editingLine : line
      );

      const updatedInvoice = {
        ...invoice,
        supplierInvoiceLines: updatedSupplierInvoiceLines,
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);
      
      toast({
        title: "Line Updated",
        description: "Supplier invoice line has been updated successfully.",
      });
      
      setEditingLineId(null);
      setEditingLine(null);
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating supplier invoice line:", error);
      toast({
        title: "Error",
        description: "Failed to update supplier invoice line.",
        variant: "destructive",
      });
    }
  };

  // Add function to delete supplier invoice line
  const handleDeleteSupplierLine = async (supplierLineId: string) => {
    if (!invoice) return;

    try {
      // Remove the supplier invoice line from the invoice
      const updatedSupplierInvoiceLines = (invoice.supplierInvoiceLines || []).filter(
        line => line.id !== supplierLineId
      );

      const updatedInvoice = {
        ...invoice,
        supplierInvoiceLines: updatedSupplierInvoiceLines,
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);
      
      toast({
        title: "Line Deleted",
        description: "Supplier invoice line has been deleted successfully.",
      });
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error deleting supplier invoice line:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier invoice line.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    const filtered = allInvoiceLines.filter(line => {
      const matchesSupplier = supplierId === "all" || line.supplierId === supplierId;
      const matchesDescription = !description || 
        line.description.toLowerCase().includes(description.toLowerCase());
      
      const matchesBookingNumber = !bookingNumber || 
        (line.bookingNumber && line.bookingNumber.toLowerCase().includes(bookingNumber.toLowerCase()));
      
      const matchesConfirmationNumber = !confirmationNumber || 
        (line.confirmationNumber && line.confirmationNumber.toLowerCase().includes(confirmationNumber.toLowerCase()));
      
      let matchesDepartureDate = true;
      if (line.departureDate) {
        if (departureDateStart && new Date(line.departureDate) < new Date(departureDateStart)) {
          matchesDepartureDate = false;
        }
        if (departureDateEnd && new Date(line.departureDate) > new Date(departureDateEnd)) {
          matchesDepartureDate = false;
        }
      } else if (departureDateStart || departureDateEnd) {
        matchesDepartureDate = false;
      }

      const matchesPaymentStatus = paymentStatus === "all" || line.paymentStatus === paymentStatus;
      
      return matchesSupplier && matchesDescription && 
             matchesBookingNumber && matchesConfirmationNumber && matchesDepartureDate && 
             matchesPaymentStatus;
    });
    
    setSearchResults(filtered);
    setHasSearched(true);
    // Reset selections when new search is performed
    setSelectedSummaryLines(new Set());
    setSummaryActualCosts(new Map());
    setSummaryActualVats(new Map());
  };

  // Function to group and summarize search results for Booking Supplier
  const getBookingSupplierSummary = () => {
    const grouped = new Map();
    
    searchResults.forEach(line => {
      const key = `${line.supplierId}-${line.currency || 'USD'}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: `summary-${key}`,
          supplierName: line.supplierName,
          bookingNumbers: new Set(),
          confirmationNumbers: new Set(),
          departureDates: new Set(),
          totalEstimatedCost: 0,
          totalEstimatedVat: 0,
          paymentStatuses: new Set(),
          currency: line.currency || "USD",
          lines: [],
          supplierId: line.supplierId
        });
      }
      
      const group = grouped.get(key);
      if (line.bookingNumber) group.bookingNumbers.add(line.bookingNumber);
      if (line.confirmationNumber) group.confirmationNumbers.add(line.confirmationNumber);
      if (line.departureDate) group.departureDates.add(line.departureDate);
      group.totalEstimatedCost += line.estimatedCost;
      group.totalEstimatedVat += (line.estimatedVat || 0);
      group.paymentStatuses.add(line.paymentStatus);
      group.lines.push(line);
    });
    
    return Array.from(grouped.values()).map(group => {
      // Calculate registered amounts from supplier invoice lines
      const registeredLines = allSupplierInvoiceLines.filter(sil => 
        group.lines.some(line => line.id === sil.invoiceLineId)
      );
      const registeredActualCost = registeredLines.reduce((sum, sil) => sum + sil.actualCost, 0);
      const registeredActualVat = registeredLines.reduce((sum, sil) => sum + sil.actualVat, 0);

      return {
        ...group,
        bookingNumbers: Array.from(group.bookingNumbers).join(", "),
        confirmationNumbers: Array.from(group.confirmationNumbers).join(", "),
        departureDates: Array.from(group.departureDates).map(date => 
          new Date(date as string).toLocaleDateString()
        ).join(", "),
        paymentStatus: group.paymentStatuses.has("paid") ? "paid" : 
                     group.paymentStatuses.has("partial") ? "partial" : "unpaid",
        // Set actual values from summary state or default to estimated
        actualCost: summaryActualCosts.get(group.id) || group.totalEstimatedCost,
        actualVat: summaryActualVats.get(group.id) || group.totalEstimatedVat,
        estimatedCost: group.totalEstimatedCost,
        estimatedVat: group.totalEstimatedVat,
        registeredActualCost,
        registeredActualVat,
        selected: selectedSummaryLines.has(group.id)
      };
    });
  };

  const handleClear = () => {
    // Reset to invoice supplier instead of "all"
    setSupplierId(invoice?.supplier.id || "all");
    setDescription("");
    setBookingNumber("");
    setConfirmationNumber("");
    setDepartureDateStart("");
    setDepartureDateEnd("");
    setPaymentStatus("all");
    setSearchResults([]);
    setHasSearched(false);
    setSelectedSummaryLines(new Set());
    setSummaryActualCosts(new Map());
    setSummaryActualVats(new Map());
  };

  // Handle summary line selection
  const handleSummaryLineSelect = (lineId: string, checked: boolean) => {
    const newSelected = new Set(selectedSummaryLines);
    if (checked) {
      newSelected.add(lineId);
    } else {
      newSelected.delete(lineId);
    }
    setSelectedSummaryLines(newSelected);
  };

  // Handle editing actual cost/vat for summary lines
  const handleEditSummaryActual = (lineId: string, type: 'cost' | 'vat') => {
    setEditingSummaryLine(`${lineId}-${type}`);
    if (type === 'cost') {
      const currentCost = summaryActualCosts.get(lineId) || 0;
      setEditingActualCost(currentCost.toString());
    } else {
      const currentVat = summaryActualVats.get(lineId) || 0;
      setEditingActualVat(currentVat.toString());
    }
  };

  // Save edited actual cost/vat for summary lines
  const handleSaveSummaryActual = (lineId: string) => {
    if (editingSummaryLine?.includes('-cost')) {
      const newCost = parseFloat(editingActualCost) || 0;
      setSummaryActualCosts(prev => new Map(prev.set(lineId, newCost)));
      toast({
        title: "Actual Cost Updated",
        description: "The actual cost has been updated successfully.",
      });
    } else if (editingSummaryLine?.includes('-vat')) {
      const newVat = parseFloat(editingActualVat) || 0;
      setSummaryActualVats(prev => new Map(prev.set(lineId, newVat)));
      toast({
        title: "Actual VAT Updated",
        description: "The actual VAT has been updated successfully.",
      });
    }
    setEditingSummaryLine(null);
    setEditingActualCost("");
    setEditingActualVat("");
  };

  // Add function to handle line status updates
  const handleLineStatusUpdate = async (lineUpdates: { lineId: string; paymentStatus: "paid" | "unpaid" | "partial" }[]) => {
    try {
      // Update all invoices that contain the updated lines
      const updatedInvoices = invoices.map(inv => {
        const hasUpdatedLines = inv.invoiceLines.some(line => 
          lineUpdates.find(update => update.lineId === line.id)
        );
        
        if (hasUpdatedLines) {
          const updatedInvoiceLines = inv.invoiceLines.map(line => {
            const update = lineUpdates.find(u => u.lineId === line.id);
            return update ? { ...line, paymentStatus: update.paymentStatus } : line;
          });
          
          return {
            ...inv,
            invoiceLines: updatedInvoiceLines,
            updatedAt: new Date().toISOString(),
          };
        }
        
        return inv;
      });
      
      // Save all updated invoices to localStorage
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      toast({
        title: "Status Updated",
        description: "Invoice line payment status has been updated and saved.",
      });
      
    } catch (error) {
      console.error("Error updating line status:", error);
      toast({
        title: "Error",
        description: "Failed to update line status.",
        variant: "destructive",
      });
    }
  };

  // Add function to handle registration
  const handleRegistration = async (selectedLines: any[], totals: { totalActualCost: number; totalActualVat: number; }, supplierInvoiceLines: SupplierInvoiceLine[], allLinesPaid?: boolean) => {
    if (!invoice) return;

    try {
      console.log("Registering supplier invoice lines:", supplierInvoiceLines);
      console.log("Selected lines with actual values:", selectedLines.map(line => ({
        id: line.id,
        description: line.description,
        actualCost: line.actualCost,
        actualVat: line.actualVat
      })));

      // Determine new status based on whether all lines are paid
      const newStatus = allLinesPaid ? "paid" : invoice.status;

      // Update the invoice with supplier invoice lines and potentially change status to paid
      const updatedInvoice = {
        ...invoice,
        status: newStatus,
        supplierInvoiceLines: [...(invoice.supplierInvoiceLines || []), ...supplierInvoiceLines],
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);
      setRegisteredTotals(totals);
      
      // Only update invoices in localStorage for individual invoice lines, not booking supplier summaries
      if (costType === "Invoice lines") {
        // Update the invoices in localStorage to mark selected lines as registered
        const savedInvoices = localStorage.getItem('invoices');
        let allInvoices = savedInvoices ? JSON.parse(savedInvoices) : [];
        
        // Mark the selected invoice lines as registered by updating their fullyInvoiced status
        const selectedLineIds = selectedLines.map(line => line.id);
        allInvoices = allInvoices.map((inv: Invoice) => {
          if (inv.invoiceLines.some(line => selectedLineIds.includes(line.id))) {
            return {
              ...inv,
              invoiceLines: inv.invoiceLines.map(line => 
                selectedLineIds.includes(line.id) 
                  ? { ...line, fullyInvoiced: true }
                  : line
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return inv;
        });
        
        // Save updated invoices back to localStorage
        localStorage.setItem('invoices', JSON.stringify(allInvoices));
        
        // Dispatch custom event to notify other components of the update
        window.dispatchEvent(new CustomEvent('invoicesUpdated'));
      }
      
      if (allLinesPaid) {
        toast({
          title: "Invoice Status Updated",
          description: "All lines are now fully paid. Invoice status updated to 'paid'.",
        });
      } else {
        const registrationType = costType === "Booking Supplier" ? "booking supplier groups" : "invoice lines";
        toast({
          title: `${costType} Registered`,
          description: `Selected ${registrationType} have been successfully registered to this supplier invoice.`,
        });
      }
      
      // Refresh the page or update the local state
      window.location.reload();
    } catch (error) {
      console.error("Error saving invoice:", error);
      const registrationType = costType === "Booking Supplier" ? "booking supplier groups" : "invoice lines";
      toast({
        title: "Error",
        description: `Failed to register ${registrationType}.`,
        variant: "destructive",
      });
    }
  };

  // Add function to cancel supplier invoice
  const handleCancelInvoice = async () => {
    if (!invoice) return;

    try {
      const updatedInvoice = {
        ...invoice,
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);
      setIsCancelled(true);
      
      toast({
        title: "Invoice Cancelled",
        description: "Supplier invoice has been cancelled successfully.",
      });
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast({
        title: "Error",
        description: "Failed to cancel supplier invoice.",
        variant: "destructive",
      });
    }
  };

  // Add function to cancel editing summary lines
  const handleCancelSummaryEdit = () => {
    setEditingSummaryLine(null);
    setEditingActualCost("");
    setEditingActualVat("");
  };

  if (isLoading || isLoadingInvoices) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invoice not found</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCancelInvoice}
              disabled={!canCancelInvoice || isCancelled || isSentToAccounting}
            >
              Cancel Supplier Invoice
            </Button>
            <Button 
              onClick={() => navigate(`/invoices/edit/${id}`)} 
              disabled={isCancelled || isSentToAccounting}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Supplier Invoice
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {isCancelled || isSentToAccounting ? "Invoice Details" : "View Supplier Invoice"}
                {isCancelled && (
                  <span className="ml-2 text-sm font-normal text-red-600">
                    (Status: Cancelled)
                  </span>
                )}
                {isSentToAccounting && (
                  <span className="ml-2 text-sm font-normal text-green-600">
                    (Status: Sent to Accounting)
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Supplier Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Supplier</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p className="font-medium text-lg">{invoice.supplier.name}</p>
                </div>
              </div>

              {/* Supplier Details */}
              <SupplierDetails supplier={invoice.supplier} />

              {/* Invoice Header Information */}
              <InvoiceHeaderView 
                formData={formData} 
                registeredTotals={registeredTotals}
                supplierInvoiceLines={invoice.supplierInvoiceLines || []}
                invoiceId={invoice.id}
                selectedProject={null}
              />

              {/* Supplier Invoice Lines */}
              {invoice.supplierInvoiceLines && invoice.supplierInvoiceLines.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Supplier Invoice Lines</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Booking Number</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Register Datetime</TableHead>
                          <TableHead>Actual Cost</TableHead>
                          <TableHead>Actual VAT</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.supplierInvoiceLines.map((line, index) => (
                          <TableRow key={line.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {editingLineId === line.id ? (
                                <Input
                                  value={editingLine?.description || ""}
                                  onChange={(e) => setEditingLine(prev => prev ? { ...prev, description: e.target.value } : null)}
                                />
                              ) : (
                                line.description
                              )}
                            </TableCell>
                            <TableCell>{line.supplierName}</TableCell>
                            <TableCell>{getBookingNumberForSupplierLine(line)}</TableCell>
                            <TableCell>{line.createdBy || "Unknown"}</TableCell>
                            <TableCell>
                              {new Date(line.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {editingLineId === line.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingLine?.actualCost || 0}
                                  onChange={(e) => setEditingLine(prev => prev ? { ...prev, actualCost: parseFloat(e.target.value) || 0 } : null)}
                                />
                              ) : (
                                formatCurrency(line.actualCost, line.currency)
                              )}
                            </TableCell>
                            <TableCell>
                              {editingLineId === line.id ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingLine?.actualVat || 0}
                                  onChange={(e) => setEditingLine(prev => prev ? { ...prev, actualVat: parseFloat(e.target.value) || 0 } : null)}
                                />
                              ) : (
                                formatCurrency(line.actualVat, line.currency)
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {editingLineId === line.id ? (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={handleSaveSupplierLine}
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditSupplierLine(line)}
                                      disabled={isSentToAccounting}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteSupplierLine(line.id)}
                                      disabled={isSentToAccounting}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Only show cost type selection and search forms if not cancelled or sent to accounting */}
        {!isCancelled && !isSentToAccounting && (
          <>
            {/* Cost Type Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Cost Type
                  {isCostTypeLocked && (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label>Select Cost Type</Label>
                  {isCostTypeLocked && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <Lock className="inline h-4 w-4 mr-1" />
                        Cost type is locked to "{lockedCostType}" because there are already registered lines. To change the cost type, you must first delete all supplier invoice lines.
                      </p>
                    </div>
                  )}
                  <RadioGroup 
                    className="flex space-x-4"
                    value={costType}
                    onValueChange={(value: "Invoice lines" | "Booking Supplier") => {
                      if (!isCostTypeLocked) {
                        setCostType(value);
                      }
                    }}
                    disabled={isCostTypeLocked}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="Invoice lines" 
                        id="invoice-lines" 
                        disabled={isCostTypeLocked}
                      />
                      <Label 
                        htmlFor="invoice-lines" 
                        className={isCostTypeLocked ? "text-gray-400" : ""}
                      >
                        Invoice lines
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="Booking Supplier" 
                        id="booking-supplier" 
                        disabled={isCostTypeLocked}
                      />
                      <Label 
                        htmlFor="booking-supplier" 
                        className={isCostTypeLocked ? "text-gray-400" : ""}
                      >
                        Booking Supplier
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Search Forms for Invoice lines and Booking Supplier */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {costType === "Booking Supplier" ? "Search Booking Supplier" : "Search Invoice Lines"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select
                      value={supplierId}
                      onValueChange={setSupplierId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Suppliers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Search by description..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingNumber">Booking Number</Label>
                    <Input
                      id="bookingNumber"
                      value={bookingNumber}
                      onChange={(e) => setBookingNumber(e.target.value)}
                      placeholder="Search by booking number..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmationNumber">Confirmation Number</Label>
                    <Input
                      id="confirmationNumber"
                      value={confirmationNumber}
                      onChange={(e) => setConfirmationNumber(e.target.value)}
                      placeholder="Search by confirmation number..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departureDateStart">Departure Date (From)</Label>
                    <Input
                      id="departureDateStart"
                      type="date"
                      value={departureDateStart}
                      onChange={(e) => setDepartureDateStart(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departureDateEnd">Departure Date (To)</Label>
                    <Input
                      id="departureDateEnd"
                      type="date"
                      value={departureDateEnd}
                      onChange={(e) => setDepartureDateEnd(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3 col-span-2">
                    <Label>Payment Status</Label>
                    <RadioGroup 
                      className="flex space-x-4"
                      value={paymentStatus}
                      onValueChange={setPaymentStatus}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">All</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paid" id="paid" />
                        <Label htmlFor="paid">Paid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unpaid" id="unpaid" />
                        <Label htmlFor="unpaid">Unpaid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partial" id="partial" />
                        <Label htmlFor="partial">Partial Paid</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                  <Button onClick={handleSearch}>
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results for both Invoice lines and Booking Supplier */}
            {hasSearched && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Search Results
                    {searchResults.length > 0 && (
                      <span className="text-sm font-normal ml-2 text-gray-500">
                        ({costType === "Booking Supplier" ? getBookingSupplierSummary().length + " groups found from " : ""}{searchResults.length} items found)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResults.length > 0 ? (
                    costType === "Invoice lines" ? (
                      <InvoiceLineSearchResults 
                        invoiceLines={searchResults} 
                        onRegister={handleRegistration}
                        onLineStatusUpdate={handleLineStatusUpdate}
                        invoiceTotalAmount={invoice.totalAmount || 0}
                        allSupplierInvoiceLines={allSupplierInvoiceLines}
                      />
                    ) : (
                      <div className="space-y-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>
                                <Checkbox 
                                  checked={selectedSummaryLines.size > 0 && selectedSummaryLines.size === getBookingSupplierSummary().length}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSummaryLines(new Set(getBookingSupplierSummary().map(s => s.id)));
                                    } else {
                                      setSelectedSummaryLines(new Set());
                                    }
                                  }}
                                />
                              </TableHead>
                              <TableHead>Supplier</TableHead>
                              <TableHead>Booking</TableHead>
                              <TableHead>Confirmation</TableHead>
                              <TableHead>Departure Date</TableHead>
                              <TableHead>Currency</TableHead>
                              <TableHead>Est. Cost</TableHead>
                              <TableHead>Est. VAT</TableHead>
                              <TableHead>Actual Cost</TableHead>
                              <TableHead>Actual VAT</TableHead>
                              <TableHead>Registered Cost</TableHead>
                              <TableHead>Registered VAT</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Fully Paid</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getBookingSupplierSummary().map((summary) => (
                              <TableRow key={summary.id}>
                                <TableCell>
                                  <Checkbox 
                                    checked={selectedSummaryLines.has(summary.id)}
                                    onCheckedChange={(checked) => handleSummaryLineSelect(summary.id, checked as boolean)}
                                  />
                                </TableCell>
                                <TableCell>{summary.supplierName}</TableCell>
                                <TableCell>{summary.bookingNumbers}</TableCell>
                                <TableCell>{summary.confirmationNumbers}</TableCell>
                                <TableCell>{summary.departureDates}</TableCell>
                                <TableCell>{summary.currency}</TableCell>
                                <TableCell>{formatCurrency(summary.totalEstimatedCost, summary.currency)}</TableCell>
                                <TableCell>{formatCurrency(summary.totalEstimatedVat, summary.currency)}</TableCell>
                                <TableCell>
                                  {editingSummaryLine === `${summary.id}-cost` ? (
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={editingActualCost}
                                        onChange={(e) => setEditingActualCost(e.target.value)}
                                        className="w-24"
                                      />
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleSaveSummaryActual(summary.id)}
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelSummaryEdit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                      onClick={() => handleEditSummaryActual(summary.id, 'cost')}
                                    >
                                      {formatCurrency(summary.actualCost, summary.currency)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingSummaryLine === `${summary.id}-vat` ? (
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={editingActualVat}
                                        onChange={(e) => setEditingActualVat(e.target.value)}
                                        className="w-24"
                                      />
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleSaveSummaryActual(summary.id)}
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancelSummaryEdit}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                      onClick={() => handleEditSummaryActual(summary.id, 'vat')}
                                    >
                                      {formatCurrency(summary.actualVat, summary.currency)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{formatCurrency(summary.registeredActualCost, summary.currency)}</TableCell>
                                <TableCell>{formatCurrency(summary.registeredActualVat, summary.currency)}</TableCell>
                                <TableCell>
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    summary.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                    summary.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {summary.paymentStatus}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Checkbox 
                                    checked={summary.paymentStatus === "paid"}
                                    onCheckedChange={(checked) => {
                                      // Update all lines in this summary group
                                      const lineUpdates = summary.lines.map(line => ({
                                        lineId: line.id,
                                        paymentStatus: (checked ? "paid" : "unpaid") as "paid" | "unpaid" | "partial"
                                      }));
                                      handleLineStatusUpdate(lineUpdates);
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {selectedSummaryLines.size > 0 && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Selected: {selectedSummaryLines.size} groups</p>
                                <p className="text-sm text-gray-600">
                                  Total Actual Cost: {formatCurrency(
                                    getBookingSupplierSummary()
                                      .filter(s => selectedSummaryLines.has(s.id))
                                      .reduce((sum, s) => sum + s.actualCost, 0),
                                    "USD"
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Total Actual VAT: {formatCurrency(
                                    getBookingSupplierSummary()
                                      .filter(s => selectedSummaryLines.has(s.id))
                                      .reduce((sum, s) => sum + s.actualVat, 0),
                                    "USD"
                                  )}
                                </p>
                              </div>
                              <Button 
                                onClick={() => {
                                  const selectedSummaries = getBookingSupplierSummary().filter(s => selectedSummaryLines.has(s.id));
                                  
                                  // Create supplier invoice lines based on the summaries, not individual lines
                                  const supplierInvoiceLines: SupplierInvoiceLine[] = selectedSummaries.map(summary => ({
                                    id: `sil-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    invoiceLineId: summary.id, // Use summary ID instead of individual line ID
                                    actualCost: summary.actualCost,
                                    actualVat: summary.actualVat,
                                    currency: summary.currency,
                                    createdAt: new Date().toISOString(),
                                    createdBy: "Current User",
                                    description: `Booking Supplier - ${summary.supplierName} (${summary.lines.length} items)`,
                                    supplierName: summary.supplierName,
                                  }));
                                  
                                  const totals = {
                                    totalActualCost: selectedSummaries.reduce((sum, s) => sum + s.actualCost, 0),
                                    totalActualVat: selectedSummaries.reduce((sum, s) => sum + s.actualVat, 0)
                                  };
                                  
                                  // Pass the summaries as selected lines, not individual invoice lines
                                  if (handleRegistration) {
                                    handleRegistration(selectedSummaries, totals, supplierInvoiceLines);
                                  }
                                }}
                              >
                                Register Selected Groups
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No invoice lines found matching your criteria.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceView;
