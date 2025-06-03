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
import { ArrowLeft, Edit, Trash2, Save, X, Lock, Send } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Define a simple interface for the raw Supabase data
interface RawSupplierInvoiceLine {
  id: string;
  invoice_line_id: string;
  actual_cost: number;
  actual_vat: number;
  currency: string;
  created_at: string;
  created_by: string | null;
  description: string;
  supplier_name: string;
}

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

  // Update formData state to populate with invoice data
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

  // Populate formData when invoice data is loaded
  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.reference,
        status: invoice.status,
        dueDate: invoice.dueDate,
        invoiceDate: invoice.invoiceDate || "",
        supplierId: invoice.supplier.id,
        notes: invoice.notes || "",
        invoiceLines: invoice.invoiceLines,
        currency: invoice.currency || "USD",
        totalAmount: invoice.totalAmount,
        totalVat: invoice.totalVat || 0,
        vat: invoice.vat || 0,
        ocr: invoice.ocr || "",
        source: invoice.source,
        account: invoice.account || "",
        vatAccount: invoice.vatAccount || "",
        periodizationYear: invoice.periodizationYear,
        periodizationMonth: invoice.periodizationMonth,
        projectId: invoice.projectId,
      });
    }
  }, [invoice]);

  // Add function to send invoice to accounting
  const handleSendToAccounting = async () => {
    if (!invoice) return;

    try {
      const updatedInvoice = {
        ...invoice,
        status: "sent_to_accounting",
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);
      setIsSentToAccounting(true);
      
      toast({
        title: "Invoice Sent to Accounting",
        description: "Supplier invoice has been sent to accounting successfully.",
      });
      
      // Refresh the data instead of full page reload
      await refreshInvoiceData();
    } catch (error) {
      console.error("Error sending invoice to accounting:", error);
      toast({
        title: "Error",
        description: "Failed to send supplier invoice to accounting.",
        variant: "destructive",
      });
    }
  };

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

  // Get supplier invoice lines that are actually connected to THIS invoice
  const [connectedSupplierInvoiceLines, setConnectedSupplierInvoiceLines] = useState<SupplierInvoiceLine[]>([]);

  // Load supplier invoice lines that are connected to this specific invoice
  useEffect(() => {
    const loadConnectedSupplierInvoiceLines = async () => {
      if (!invoice || !invoice.id) return;

      try {
        // Get supplier invoice lines that are directly linked to this supplier invoice
        const { data, error } = await supabase
          .from('supplier_invoice_lines')
          .select('*')
          .eq('supplier_invoice_id', invoice.id)
          .order('created_at', { ascending: true }); // Order by creation time to maintain consistency

        if (error) {
          console.error('Error loading connected supplier invoice lines:', error);
          return;
        }

        // Transform the data with simple type conversion
        const transformedLines: SupplierInvoiceLine[] = (data || []).map((line: any) => ({
          id: String(line.id),
          invoiceLineId: String(line.invoice_line_id),
          actualCost: Number(line.actual_cost),
          actualVat: Number(line.actual_vat),
          currency: String(line.currency),
          createdAt: String(line.created_at),
          createdBy: line.created_by ? String(line.created_by) : 'System',
          description: String(line.description),
          supplierName: String(line.supplier_name),
        }));

        console.log('Connected supplier invoice lines for this invoice:', transformedLines);
        setConnectedSupplierInvoiceLines(transformedLines);
      } catch (error) {
        console.error('Error in loadConnectedSupplierInvoiceLines:', error);
      }
    };

    loadConnectedSupplierInvoiceLines();
  }, [invoice?.id, dataRefreshKey]);

  // Add function to refresh invoice data
  const refreshInvoiceData = async () => {
    setDataRefreshKey(prev => prev + 1);
    // Also trigger a page reload to ensure fresh data
    window.location.reload();
  };

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

  // Function to get estimated costs and currency for a booking number
  const getEstimatedCostsForBooking = (bookingNumber: string) => {
    const originalLines = allInvoiceLines.filter(line => 
      line.bookingNumber === bookingNumber || 
      (!line.bookingNumber && getBookingNumberForSupplierLine({ id: line.id } as SupplierInvoiceLine) === bookingNumber)
    );
    
    // Get the currency from the first line (they should all have the same currency for a booking)
    const lineCurrency = originalLines.length > 0 ? originalLines[0].currency || 'USD' : 'USD';
    
    return originalLines.reduce((acc, line) => ({
      estimatedCost: acc.estimatedCost + (line.estimatedCost || 0),
      estimatedVat: acc.estimatedVat + (line.estimatedVat || 0),
      currency: lineCurrency
    }), { estimatedCost: 0, estimatedVat: 0, currency: lineCurrency });
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

  // Add function to check if this is the first occurrence of an invoice line ID within a booking
  const isFirstOccurrenceOfInvoiceLine = (supplierLines: SupplierInvoiceLine[], currentLine: SupplierInvoiceLine, currentIndex: number) => {
    // Check if this is the first supplier line that references this invoice line ID within this booking group
    const previousLinesWithSameInvoiceLineId = supplierLines
      .slice(0, currentIndex)
      .filter(line => line.invoiceLineId === currentLine.invoiceLineId);
    
    return previousLinesWithSameInvoiceLineId.length === 0;
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

  // Add function to handle fully paid checkbox changes
  const handleFullyPaidChange = (bookingNumber: string, isChecked: boolean) => {
    setFullyPaidStatus(prev => ({
      ...prev,
      [bookingNumber]: isChecked
    }));
  };

  // Add missing search and registration functions
  const handleClear = () => {
    setSupplierId("all");
    setDescription("");
    setBookingNumber("");
    setConfirmationNumber("");
    setDepartureDateStart("");
    setDepartureDateEnd("");
    setPaymentStatus("all");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSearch = () => {
    console.log("Executing search with criteria:", {
      supplierId,
      description,
      bookingNumber,
      confirmationNumber,
      departureDateStart,
      departureDateEnd,
      paymentStatus,
      totalLines: allInvoiceLines.length
    });
    
    // Filter invoice lines based on search criteria
    const filtered = allInvoiceLines.filter(line => {
      const matchesSupplier = supplierId === "all" || line.supplierId === supplierId;
      const matchesDescription = !description || 
        line.description.toLowerCase().includes(description.toLowerCase());
      
      const matchesBookingNumber = !bookingNumber || 
        (line.bookingNumber && line.bookingNumber.toLowerCase().includes(bookingNumber.toLowerCase()));
      
      const matchesConfirmationNumber = !confirmationNumber || 
        (line.confirmationNumber && line.confirmationNumber.toLowerCase().includes(confirmationNumber.toLowerCase()));
      
      // Date range check
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
    
    console.log("Search results:", filtered.length, "lines found from", allInvoiceLines.length, "total lines");
    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleRegistration = async (selectedLines: { lineId: string; actualCost: number; actualVat: number; description: string }[]) => {
    if (!invoice) return;

    try {
      console.log("Registering lines to supplier invoice:", selectedLines);
      
      // Insert supplier invoice lines into Supabase
      const linesToInsert = selectedLines.map(line => ({
        supplier_invoice_id: invoice.id,
        invoice_line_id: line.lineId,
        actual_cost: line.actualCost,
        actual_vat: line.actualVat,
        description: line.description,
        supplier_name: invoice.supplier.name,
        currency: invoice.currency || 'USD',
        created_by: 'User', // This should ideally come from auth context
      }));

      const { error } = await supabase
        .from('supplier_invoice_lines')
        .insert(linesToInsert);

      if (error) {
        console.error('Error registering supplier invoice lines:', error);
        toast({
          title: "Error",
          description: "Failed to register invoice lines.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Lines Registered",
        description: `Successfully registered ${selectedLines.length} invoice lines.`,
      });
      
      // Refresh the data
      await refreshInvoiceData();
    } catch (error) {
      console.error("Error in handleRegistration:", error);
      toast({
        title: "Error",
        description: "Failed to register invoice lines.",
        variant: "destructive",
      });
    }
  };

  const handleLineStatusUpdate = async (lineUpdates: { lineId: string; paymentStatus: "paid" | "unpaid" | "partial" }[]) => {
    try {
      console.log("Updating line statuses:", lineUpdates);
      
      // Update payment status in Supabase for each line
      for (const update of lineUpdates) {
        const { error } = await supabase
          .from('invoice_lines')
          .update({ payment_status: update.paymentStatus })
          .eq('id', update.lineId);

        if (error) {
          console.error('Error updating line status:', error);
          throw error;
        }
      }

      toast({
        title: "Status Updated",
        description: "Invoice line payment status has been updated.",
      });
      
      // Refresh search results if we have searched
      if (hasSearched) {
        handleSearch();
      }
    } catch (error) {
      console.error("Error updating line status:", error);
      toast({
        title: "Error",
        description: "Failed to update line status.",
        variant: "destructive",
      });
    }
  };

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

  // Use the connected supplier invoice lines instead of all supplier invoice lines
  const groupedSupplierLines = groupSupplierLinesByBooking(connectedSupplierInvoiceLines);

  const currency = invoice.currency || 'USD';

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
                supplierInvoiceLines={connectedSupplierInvoiceLines}
                invoiceId={invoice.id}
                selectedProject={transformedSelectedProject}
                onSendToAccounting={handleSendToAccounting}
                isSentToAccounting={isSentToAccounting}
                isCancelled={isCancelled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registered Supplier Invoice Lines - Show this section prominently */}
        {connectedSupplierInvoiceLines && connectedSupplierInvoiceLines.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-green-700">
                Registered Supplier Invoice Lines ({connectedSupplierInvoiceLines.length} lines)
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
                      <TableHead>Currency</TableHead>
                      <TableHead>Estimated Cost</TableHead>
                      <TableHead>Estimated VAT</TableHead>
                      <TableHead>Currency</TableHead>
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
                            <TableCell colSpan={!isSentToAccounting ? 13 : 12} className="font-semibold text-blue-800">
                              Booking: {bookingNumber}
                            </TableCell>
                          </TableRow>
                          {/* Lines for this booking */}
                          {lines.map((line, index) => {
                            const isFirstOccurrence = isFirstOccurrenceOfInvoiceLine(lines, line, index);
                            return (
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
                                  {new Date(line.createdAt).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </TableCell>
                                <TableCell className="text-blue-600">{estimatedCosts.currency}</TableCell>
                                <TableCell className="text-blue-600">
                                  {isFirstOccurrence ? formatCurrency(estimatedCosts.estimatedCost / lines.length) : formatCurrency(0)}
                                </TableCell>
                                <TableCell className="text-blue-600">
                                  {isFirstOccurrence ? formatCurrency(estimatedCosts.estimatedVat / lines.length) : formatCurrency(0)}
                                </TableCell>
                                <TableCell className="text-green-600">{currency}</TableCell>
                                <TableCell>
                                  {editingLineId === line.id ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editingLine?.actualCost || 0}
                                      onChange={(e) => setEditingLine(prev => prev ? { ...prev, actualCost: parseFloat(e.target.value) || 0 } : null)}
                                    />
                                  ) : (
                                    formatCurrency(line.actualCost)
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
                                    formatCurrency(line.actualVat)
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
                                            disabled={isFullyPaid}
                                          >
                                            <Save className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            disabled={isFullyPaid}
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
                                            disabled={isFullyPaid}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteSupplierLine(line.id)}
                                            disabled={isFullyPaid}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                          {/* Subtotal row for this booking */}
                          <TableRow className="bg-gray-100 font-medium border-b-2">
                            <TableCell colSpan={6} className="text-right">
                              Subtotal for Booking {bookingNumber}:
                            </TableCell>
                            <TableCell className="text-blue-600">{estimatedCosts.currency}</TableCell>
                            <TableCell className="text-blue-600">
                              {formatCurrency(estimatedCosts.estimatedCost)}
                            </TableCell>
                            <TableCell className="text-blue-600">
                              {formatCurrency(estimatedCosts.estimatedVat)}
                            </TableCell>
                            <TableCell className="text-green-600">{currency}</TableCell>
                            <TableCell className="text-green-600">
                              {formatCurrency(
                                lines.reduce((sum, line) => sum + line.actualCost, 0)
                              )}
                            </TableCell>
                            <TableCell className="text-green-600">
                              {formatCurrency(
                                lines.reduce((sum, line) => sum + line.actualVat, 0)
                              )}
                            </TableCell>
                            {!isSentToAccounting && (
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
                            )}
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
                      {currency} {formatCurrency(
                        connectedSupplierInvoiceLines.reduce((sum, line) => sum + line.actualCost, 0)
                      )} + {formatCurrency(
                        connectedSupplierInvoiceLines.reduce((sum, line) => sum + line.actualVat, 0)
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
                      allSupplierInvoiceLines={connectedSupplierInvoiceLines}
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
