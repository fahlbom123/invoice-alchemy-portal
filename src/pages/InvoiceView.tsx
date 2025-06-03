import React, { useState, useEffect } from "react";
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
import { useSupabaseInvoiceById, useSupabaseInvoiceLines } from "@/hooks/useSupabaseInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useSupabaseProjects } from "@/hooks/useSupabaseProjects";
import { Invoice, InvoiceFormData, InvoiceLine, SupplierInvoiceLine } from "@/types/invoice";
import SupplierDetails from "@/components/invoice/SupplierDetails";
import InvoiceHeaderView from "@/components/invoice/InvoiceHeaderView";
import InvoiceLineSearchResults from "@/components/InvoiceLineSearchResults";
import { ArrowLeft, Edit, Trash2, Save, X, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Add key to force re-fetching when data changes
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  
  const { invoice, isLoading } = useSupabaseInvoiceById(id || "");
  const { invoices, isLoading: isLoadingInvoices } = useInvoices();
  const { invoiceLines: supabaseInvoiceLines, isLoading: isLoadingInvoiceLines } = useSupabaseInvoiceLines();
  const { suppliers } = useSuppliers();
  const { saveInvoice } = useSaveInvoice();

  // Fetch projects from Supabase
  const { projects, isLoading: isLoadingProjects } = useSupabaseProjects();
  
  // Find the actual project data if the invoice has a project ID
  const selectedProject = invoice?.projectId ? projects.find(p => p.id === invoice.projectId) : null;

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

  // Check if cancel button should be enabled (no lines connected)
  const canCancelInvoice = !invoice?.supplierInvoiceLines || invoice.supplierInvoiceLines.length === 0;

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
    vat: 0,
    ocr: "",
    source: undefined,
    account: "",
    vatAccount: "",
    periodizationYear: undefined,
    periodizationMonth: undefined,
    projectId: undefined,
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

  // Use Supabase invoice lines instead of invoice lines from invoices
  const allInvoiceLines = supabaseInvoiceLines.map(line => ({
    ...line,
    invoiceId: line.invoiceId || '',
    invoiceNumber: line.invoiceNumber || '',
    bookingNumber: line.bookingNumber || "",
    confirmationNumber: line.confirmationNumber || "",
    departureDate: line.departureDate || "",
    paymentStatus: line.paymentStatus || "unpaid",
    invoiceTotalAmount: 0
  }));

  // Get all supplier invoice lines from Supabase instead of localStorage
  const [allSupplierInvoiceLines, setAllSupplierInvoiceLines] = useState<SupplierInvoiceLine[]>([]);

  // Load supplier invoice lines from Supabase
  useEffect(() => {
    const loadSupplierInvoiceLines = async () => {
      try {
        const { data, error } = await supabase
          .from('supplier_invoice_lines')
          .select('*');

        if (error) {
          console.error('Error loading supplier invoice lines:', error);
          return;
        }

        const transformedLines: SupplierInvoiceLine[] = data.map(line => ({
          id: line.id,
          invoiceLineId: line.invoice_line_id,
          actualCost: parseFloat(String(line.actual_cost || '0')),
          actualVat: parseFloat(String(line.actual_vat || '0')),
          currency: line.currency,
          createdAt: line.created_at,
          createdBy: line.created_by,
          description: line.description,
          supplierName: line.supplier_name,
        }));

        setAllSupplierInvoiceLines(transformedLines);
      } catch (error) {
        console.error('Error in loadSupplierInvoiceLines:', error);
      }
    };

    loadSupplierInvoiceLines();
  }, [dataRefreshKey]); // Add dataRefreshKey as dependency

  // Add function to refresh invoice data
  const refreshInvoiceData = async () => {
    setDataRefreshKey(prev => prev + 1);
    // Also trigger a page reload to ensure fresh data
    window.location.reload();
  };

  useEffect(() => {
    if (invoice) {
      console.log('Invoice data received:', {
        periodizationYear: invoice.periodizationYear,
        periodizationMonth: invoice.periodizationMonth,
        vatAccount: invoice.vatAccount, // Add this debug log
        fullInvoice: invoice
      });
      
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
        vat: invoice.vat || 0,
        ocr: invoice.ocr || "",
        source: invoice.source || undefined,
        account: invoice.account || "",
        vatAccount: invoice.vatAccount || "", // Ensure this is properly set
        periodizationYear: invoice.periodizationYear || undefined,
        periodizationMonth: invoice.periodizationMonth || undefined,
        projectId: invoice.projectId || undefined,
      });
      
      // Set the supplier search filter to match the current invoice's supplier
      setSupplierId(invoice.supplier.id);
    }
  }, [invoice]);

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

  // Function to get estimated costs for a booking number
  const getEstimatedCostsForBooking = (bookingNumber: string) => {
    const originalLines = allInvoiceLines.filter(line => 
      line.bookingNumber === bookingNumber || 
      (!line.bookingNumber && getBookingNumberForSupplierLine({ id: line.id } as SupplierInvoiceLine) === bookingNumber)
    );
    
    return originalLines.reduce((acc, line) => ({
      estimatedCost: acc.estimatedCost + (line.estimatedCost || 0),
      estimatedVat: acc.estimatedVat + (line.estimatedVat || 0)
    }), { estimatedCost: 0, estimatedVat: 0 });
  };

  // Function to group supplier invoice lines by booking number
  const groupSupplierLinesByBooking = (lines: SupplierInvoiceLine[]) => {
    const grouped = lines.reduce((acc, line) => {
      const bookingNumber = getBookingNumberForSupplierLine(line);
      if (!acc[bookingNumber]) {
        acc[bookingNumber] = [];
      }
      acc[bookingNumber].push(line);
      return acc;
    }, {} as Record<string, SupplierInvoiceLine[]>);
    return grouped;
  };

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
      // Update in Supabase
      const { error } = await supabase
        .from('supplier_invoice_lines')
        .update({
          description: editingLine.description,
          actual_cost: editingLine.actualCost,
          actual_vat: editingLine.actualVat,
        })
        .eq('id', editingLine.id);

      if (error) {
        console.error('Error updating supplier invoice line:', error);
        toast({
          title: "Error",
          description: "Failed to update supplier invoice line.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Line Updated",
        description: "Supplier invoice line has been updated successfully.",
      });
      
      setEditingLineId(null);
      setEditingLine(null);
      
      // Refresh the data instead of full page reload
      await refreshInvoiceData();
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
      // Delete from Supabase
      const { error } = await supabase
        .from('supplier_invoice_lines')
        .delete()
        .eq('id', supplierLineId);

      if (error) {
        console.error('Error deleting supplier invoice line:', error);
        toast({
          title: "Error",
          description: "Failed to delete supplier invoice line.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Line Deleted",
        description: "Supplier invoice line has been deleted successfully.",
      });
      
      // Refresh the data instead of full page reload
      await refreshInvoiceData();
    } catch (error) {
      console.error("Error deleting supplier invoice line:", error);
      toast({
        title: "Error",
        description: "Failed to delete supplier invoice line.",
        variant: "destructive",
      });
    }
  };

  // Add function to undo cancel supplier invoice
  const handleUndoCancelInvoice = async () => {
    if (!invoice) return;

    try {
      const updatedInvoice = {
        ...invoice,
        status: "unpaid", // Reset to unpaid status
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);
      setIsCancelled(false);
      
      toast({
        title: "Invoice Restored",
        description: "Supplier invoice has been restored successfully.",
      });
      
      // Refresh the data instead of full page reload
      await refreshInvoiceData();
    } catch (error) {
      console.error("Error restoring invoice:", error);
      toast({
        title: "Error",
        description: "Failed to restore supplier invoice.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    console.log("Searching through", allInvoiceLines.length, "invoice lines");
    
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
    
    console.log("Search found", filtered.length, "results");
    setSearchResults(filtered);
    setHasSearched(true);
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

  // Updated function to handle registration - this creates supplier invoice lines linked to the current invoice
  const handleRegistration = async (selectedLines: any[], totals: { totalActualCost: number; totalActualVat: number; }, supplierInvoiceLines: SupplierInvoiceLine[], allLinesPaid?: boolean) => {
    if (!invoice) return;

    try {
      console.log("Registering supplier invoice lines to invoice:", invoice.id);
      console.log("Supplier invoice lines to register:", supplierInvoiceLines);
      
      // Save each supplier invoice line to Supabase
      const insertPromises = supplierInvoiceLines.map(async (line) => {
        const { error } = await supabase
          .from('supplier_invoice_lines')
          .insert({
            invoice_line_id: line.invoiceLineId,
            actual_cost: line.actualCost,
            actual_vat: line.actualVat,
            currency: line.currency,
            description: line.description,
            supplier_name: line.supplierName,
            created_by: line.createdBy || 'System',
          });

        if (error) {
          console.error('Error inserting supplier invoice line:', error);
          throw error;
        }
      });

      await Promise.all(insertPromises);

      // Determine new status based on whether all lines are paid
      const newStatus = allLinesPaid ? "paid" : invoice.status;

      // Update the invoice status if needed
      if (newStatus !== invoice.status) {
        const updatedInvoice = {
          ...invoice,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
        await saveInvoice(updatedInvoice);
      }

      setRegisteredTotals(totals);
      
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
      
      toast({
        title: "Invoice Lines Registered",
        description: `Successfully registered ${supplierInvoiceLines.length} invoice lines to this supplier invoice.`,
      });
      
      if (allLinesPaid) {
        toast({
          title: "Invoice Status Updated",
          description: "All lines are now fully paid. Invoice status updated to 'paid'.",
        });
      }
      
      // Refresh the data to show new supplier invoice lines immediately
      await refreshInvoiceData();
      
      // Also clear the search to refresh the results
      setSearchResults([]);
      setHasSearched(false);
      
    } catch (error) {
      console.error("Error registering invoice lines:", error);
      toast({
        title: "Error",
        description: "Failed to register invoice lines to this supplier invoice.",
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
      
      // Refresh the data instead of full page reload
      await refreshInvoiceData();
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast({
        title: "Error",
        description: "Failed to cancel supplier invoice.",
        variant: "destructive",
      });
    }
  };

  // Add state for tracking fully paid status for each booking
  const [fullyPaidStatus, setFullyPaidStatus] = useState<Record<string, boolean>>({});

  if (isLoading || isLoadingInvoices || isLoadingInvoiceLines) {
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

  // Transform selectedProject to match expected interface
  const transformedSelectedProject = selectedProject ? {
    id: selectedProject.id,
    project_number: selectedProject.projectNumber || '',
    description: selectedProject.description
  } : null;

  // Group supplier invoice lines by booking number
  const groupedSupplierLines = invoice.supplierInvoiceLines ? groupSupplierLinesByBooking(invoice.supplierInvoiceLines) : {};

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            {isCancelled && (
              <Button 
                variant="outline" 
                onClick={handleUndoCancelInvoice}
                disabled={isSentToAccounting}
              >
                Undo Cancel
              </Button>
            )}
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
                selectedProject={transformedSelectedProject}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registered Supplier Invoice Lines - Show this section prominently */}
        {invoice.supplierInvoiceLines && invoice.supplierInvoiceLines.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-green-700">
                Registered Supplier Invoice Lines ({invoice.supplierInvoiceLines.length} lines)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Booking Number</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Register Datetime</TableHead>
                      <TableHead>Estimated Cost</TableHead>
                      <TableHead>Estimated VAT</TableHead>
                      <TableHead>Actual Cost</TableHead>
                      <TableHead>Actual VAT</TableHead>
                      {!isSentToAccounting && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedSupplierLines).map(([bookingNumber, lines]) => {
                      const estimatedCosts = getEstimatedCostsForBooking(bookingNumber);
                      const isFullyPaid = fullyPaidStatus[bookingNumber] || false;
                      return (
                        <React.Fragment key={bookingNumber}>
                          {/* Booking Group Header */}
                          <TableRow className="bg-blue-50 border-t-2 border-blue-200">
                            <TableCell colSpan={!isSentToAccounting ? 11 : 10} className="font-semibold text-blue-800">
                              Booking: {bookingNumber}
                            </TableCell>
                          </TableRow>
                          {/* Lines for this booking */}
                          {lines.map((line, index) => (
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
                              <TableCell>{bookingNumber}</TableCell>
                              <TableCell>{line.createdBy || "Unknown"}</TableCell>
                              <TableCell>
                                {new Date(line.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-blue-600">
                                {formatCurrency(estimatedCosts.estimatedCost / lines.length, invoice.currency)}
                              </TableCell>
                              <TableCell className="text-blue-600">
                                {formatCurrency(estimatedCosts.estimatedVat / lines.length, invoice.currency)}
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
                              {!isSentToAccounting && (
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
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleDeleteSupplierLine(line.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                          {/* Subtotal row for this booking */}
                          <TableRow className="bg-gray-100 font-medium border-b-2">
                            <TableCell colSpan={4} className="text-right">
                              Subtotal for Booking {bookingNumber}:
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={isFullyPaid}
                                  onCheckedChange={(checked) => handleFullyPaidChange(bookingNumber, checked as boolean)}
                                  disabled={isSentToAccounting}
                                />
                                <span className="text-sm">
                                  Fully paid: {isFullyPaid ? "Yes" : "No"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-blue-600">
                              {formatCurrency(estimatedCosts.estimatedCost, invoice.currency)}
                            </TableCell>
                            <TableCell className="text-blue-600">
                              {formatCurrency(estimatedCosts.estimatedVat, invoice.currency)}
                            </TableCell>
                            <TableCell className="text-green-600">
                              {formatCurrency(
                                lines.reduce((sum, line) => sum + line.actualCost, 0),
                                invoice.currency
                              )}
                            </TableCell>
                            <TableCell className="text-green-600">
                              {formatCurrency(
                                lines.reduce((sum, line) => sum + line.actualVat, 0),
                                invoice.currency
                              )}
                            </TableCell>
                            {!isSentToAccounting && <TableCell></TableCell>}
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="flex justify-between font-semibold">
                    <span>Total Registered:</span>
                    <span className="text-green-600">
                      {formatCurrency(
                        invoice.supplierInvoiceLines.reduce((sum, line) => sum + line.actualCost, 0),
                        invoice.currency
                      )} + {formatCurrency(
                        invoice.supplierInvoiceLines.reduce((sum, line) => sum + line.actualVat, 0),
                        invoice.currency
                      )} VAT
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Only show search forms if not cancelled or sent to accounting */}
        {!isCancelled && !isSentToAccounting && (
          <>
            {/* Search Forms for Invoice lines */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search Invoice Lines to Register ({allInvoiceLines.length} total lines available)</CardTitle>
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

            {/* Search Results for Invoice lines */}
            {hasSearched && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Search Results - Select Lines to Register to This Supplier Invoice
                    {searchResults.length > 0 && (
                      <span className="text-sm font-normal ml-2 text-gray-500">
                        ({searchResults.length} items found)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchResults.length > 0 ? (
                    <InvoiceLineSearchResults 
                      invoiceLines={searchResults} 
                      onRegister={handleRegistration}
                      onLineStatusUpdate={handleLineStatusUpdate}
                      invoiceTotalAmount={invoice.totalAmount || 0}
                      allSupplierInvoiceLines={allSupplierInvoiceLines}
                    />
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
