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
import { Invoice, InvoiceFormData, InvoiceLine, SupplierInvoiceLine, SearchResultLine } from "@/types/invoice";
import SupplierDetails from "@/components/invoice/SupplierDetails";
import InvoiceHeaderView from "@/components/invoice/InvoiceHeaderView";
import InvoiceLineSearchResults from "@/components/InvoiceLineSearchResults";
import BookingSummaryPopover from "@/components/invoice/BookingSummaryPopover";
import { ArrowLeft, Edit, Trash2, Save, X, Lock, Send } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mockBookings } from "@/data/mockData";

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

  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  
  const { invoice, isLoading } = useSupabaseInvoiceById(id || "");
  const { invoices, isLoading: isLoadingInvoices } = useInvoices();
  const { invoiceLines: supabaseInvoiceLines, isLoading: isLoadingInvoiceLines } = useSupabaseInvoiceLines();
  const { suppliers } = useSuppliers();
  const { saveInvoice } = useSaveInvoice();

  const { projects, isLoading: isLoadingProjects } = useSupabaseProjects();
  
  const selectedProject = invoice?.projectId ? projects.find(p => p.id === invoice.projectId) : null;

  const [isCancelled, setIsCancelled] = useState(false);
  const [isSentToAccounting, setIsSentToAccounting] = useState(false);

  useEffect(() => {
    if (invoice) {
      setIsCancelled(invoice.status === "cancelled");
      setIsSentToAccounting(invoice.status === "sent_to_accounting");
    }
  }, [invoice]);

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

  const [registeredTotals, setRegisteredTotals] = useState<{
    totalActualCost: number;
    totalActualVat: number;
  } | null>(null);

  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<SupplierInvoiceLine | null>(null);

  const [supplierId, setSupplierId] = useState<string>("all");
  const [description, setDescription] = useState<string>("");
  const [bookingNumber, setBookingNumber] = useState<string>("");
  const [confirmationNumber, setConfirmationNumber] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [departureDateStart, setDepartureDateStart] = useState<string>("");
  const [departureDateEnd, setDepartureDateEnd] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<InvoiceLine[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Set default supplier when invoice is loaded
  useEffect(() => {
    if (invoice && invoice.supplier.id) {
      setSupplierId(invoice.supplier.id);
    }
  }, [invoice]);

  const allInvoiceLines = supabaseInvoiceLines.map(line => {
    const booking = mockBookings.find(b => b.bookingNumber === line.bookingNumber);
    
    return {
      ...line,
      invoiceId: line.invoiceId || '',
      invoiceNumber: line.invoiceNumber || '',
      bookingNumber: line.bookingNumber || "",
      confirmationNumber: line.confirmationNumber || "",
      departureDate: line.departureDate || "",
      paymentStatus: line.paymentStatus || "unpaid",
      invoiceTotalAmount: 0,
      firstName: booking?.firstName || '',
      lastName: booking?.lastName || ''
    };
  });

  const [connectedSupplierInvoiceLines, setConnectedSupplierInvoiceLines] = useState<SupplierInvoiceLine[]>([]);

  // Create a map from invoice line ID to booking number for quick lookup
  const invoiceLineToBookingMap = React.useMemo(() => {
    const map = new Map<string, string>();
    allInvoiceLines.forEach(line => {
      if (line.bookingNumber) {
        map.set(line.id, line.bookingNumber);
      }
    });
    return map;
  }, [allInvoiceLines]);

  useEffect(() => {
    const loadConnectedSupplierInvoiceLines = async () => {
      if (!invoice || !invoice.id) return;

      try {
        const { data, error } = await supabase
          .from('supplier_invoice_lines')
          .select('*')
          .eq('supplier_invoice_id', invoice.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading connected supplier invoice lines:', error);
          return;
        }

        const transformedLines: SupplierInvoiceLine[] = (data || []).map((line: any) => ({
          id: String(line.id),
          invoiceLineId: String(line.invoice_line_id),
          actualCost: Number(line.actual_cost) || 0,
          actualVat: Number(line.actual_vat) || 0,
          currency: String(line.currency),
          createdAt: String(line.created_at),
          createdBy: line.created_by ? String(line.created_by) : 'System',
          description: String(line.description),
          supplierName: String(line.supplier_name),
        }));

        console.log('Connected supplier invoice lines loaded:', transformedLines);
        console.log('Actual costs from supplier lines:', transformedLines.map(l => ({ id: l.id, actualCost: l.actualCost, actualVat: l.actualVat })));
        setConnectedSupplierInvoiceLines(transformedLines);
      } catch (error) {
        console.error('Error in loadConnectedSupplierInvoiceLines:', error);
      }
    };

    loadConnectedSupplierInvoiceLines();
  }, [invoice?.id, dataRefreshKey]);

  const refreshInvoiceData = async () => {
    setDataRefreshKey(prev => prev + 1);
    // Force a fresh load of the data
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const getBookingNumberForSupplierLine = (supplierLine: SupplierInvoiceLine) => {
    // First try to get the actual booking number from the invoice line
    const actualBookingNumber = invoiceLineToBookingMap.get(supplierLine.invoiceLineId);
    if (actualBookingNumber) {
      console.log(`Found actual booking number ${actualBookingNumber} for supplier line ${supplierLine.id}`);
      return actualBookingNumber;
    }
    
    // Fallback to generated booking number if not found
    const seed = supplierLine.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const random = Math.abs(seed) % 90000000;
    const generatedBooking = (10000000 + random).toString();
    console.log(`Generated fallback booking number ${generatedBooking} for supplier line ${supplierLine.id}`);
    return generatedBooking;
  };

  const getEstimatedCostsForBooking = (bookingNumber: string) => {
    console.log('Getting estimated costs for booking:', bookingNumber, 'for supplier:', invoice?.supplier.id);
    
    // Filter lines to only include the current supplier and exact booking number match
    const originalLines = allInvoiceLines.filter(line => {
      const matches = line.bookingNumber === bookingNumber && line.supplierId === invoice?.supplier.id;
      if (matches) {
        console.log('Found matching line for estimated costs:', {
          lineId: line.id,
          description: line.description,
          estimatedCost: line.estimatedCost,
          estimatedVat: line.estimatedVat,
          bookingNumber: line.bookingNumber,
          supplierId: line.supplierId
        });
      }
      return matches;
    });
    
    console.log('Found', originalLines.length, 'lines for booking', bookingNumber);
    
    const lineCurrency = originalLines.length > 0 ? originalLines[0].currency || 'USD' : 'USD';
    
    const totals = originalLines.reduce((acc, line) => ({
      estimatedCost: acc.estimatedCost + (line.estimatedCost || 0),
      estimatedVat: acc.estimatedVat + (line.estimatedVat || 0),
      currency: lineCurrency
    }), { estimatedCost: 0, estimatedVat: 0, currency: lineCurrency });
    
    console.log('Calculated estimated totals for booking', bookingNumber, ':', totals);
    return totals;
  };

  const getEstimatedCostsForSupplierLinesInBooking = (supplierLines: SupplierInvoiceLine[]) => {
    const uniqueInvoiceLineIds = [...new Set(supplierLines.map(line => line.invoiceLineId))];
    
    // Filter to only include lines from the current supplier
    const matchingOriginalLines = allInvoiceLines.filter(line => 
      uniqueInvoiceLineIds.includes(line.id) &&
      line.supplierId === invoice?.supplier.id // Only include lines from current supplier
    );
    
    const lineCurrency = matchingOriginalLines.length > 0 ? matchingOriginalLines[0].currency || 'USD' : 'USD';
    
    return matchingOriginalLines.reduce((acc, line) => ({
      estimatedCost: acc.estimatedCost + (line.estimatedCost || 0),
      estimatedVat: acc.estimatedVat + (line.estimatedVat || 0),
      currency: lineCurrency
    }), { estimatedCost: 0, estimatedVat: 0, currency: lineCurrency });
  };

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

  const isFirstOccurrenceOfInvoiceLine = (supplierLines: SupplierInvoiceLine[], currentLine: SupplierInvoiceLine, currentIndex: number) => {
    const previousLinesWithSameInvoiceLineId = supplierLines
      .slice(0, currentIndex)
      .filter(line => line.invoiceLineId === currentLine.invoiceLineId);
    
    return previousLinesWithSameInvoiceLineId.length === 0;
  };

  const handleEditSupplierLine = (line: SupplierInvoiceLine) => {
    setEditingLineId(line.id);
    setEditingLine({ ...line });
  };

  const handleCancelEdit = () => {
    setEditingLineId(null);
    setEditingLine(null);
  };

  const handleSaveSupplierLine = async () => {
    if (!invoice || !editingLine) return;

    try {
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

  const handleDeleteSupplierLine = async (supplierLineId: string) => {
    if (!invoice) return;

    try {
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

  const handleUndoCancelInvoice = async () => {
    if (!invoice) return;

    try {
      const updatedInvoice = {
        ...invoice,
        status: "unpaid",
        updatedAt: new Date().toISOString(),
      };

      await saveInvoice(updatedInvoice);
      setIsCancelled(false);
      
      toast({
        title: "Invoice Restored",
        description: "Supplier invoice has been restored successfully.",
      });
      
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

  const [fullyPaidStatus, setFullyPaidStatus] = useState<Record<string, boolean>>({});

  const handleFullyPaidChange = (bookingNumber: string, isChecked: boolean) => {
    setFullyPaidStatus(prev => ({
      ...prev,
      [bookingNumber]: isChecked
    }));
  };

  const handleClear = () => {
    setSupplierId(invoice?.supplier.id || "all");
    setDescription("");
    setBookingNumber("");
    setConfirmationNumber("");
    setFirstName("");
    setLastName("");
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
      firstName,
      lastName,
      departureDateStart,
      departureDateEnd,
      paymentStatus,
      totalLines: allInvoiceLines.length,
      currentInvoiceSupplier: invoice?.supplier.id
    });
    
    const filtered = allInvoiceLines.filter(line => {
      // Fix supplier filtering logic
      let matchesSupplier = true;
      if (supplierId !== "all") {
        matchesSupplier = line.supplierId === supplierId;
        console.log(`Line ${line.id} supplier check: ${line.supplierId} === ${supplierId} = ${matchesSupplier}`);
      }
      
      const matchesDescription = !description || 
        line.description.toLowerCase().includes(description.toLowerCase());
      
      const matchesBookingNumber = !bookingNumber || 
        (line.bookingNumber && line.bookingNumber.toLowerCase().includes(bookingNumber.toLowerCase()));
      
      const matchesConfirmationNumber = !confirmationNumber || 
        (line.confirmationNumber && line.confirmationNumber.toLowerCase().includes(confirmationNumber.toLowerCase()));
      
      const matchesFirstName = !firstName || 
        (line.firstName && line.firstName.toLowerCase().includes(firstName.toLowerCase()));
      
      const matchesLastName = !lastName || 
        (line.lastName && line.lastName.toLowerCase().includes(lastName.toLowerCase()));
      
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
      
      const result = matchesSupplier && matchesDescription && 
             matchesBookingNumber && matchesConfirmationNumber && 
             matchesFirstName && matchesLastName && matchesDepartureDate && 
             matchesPaymentStatus;
      
      if (!result && supplierId !== "all") {
        console.log(`Line ${line.id} filtered out - supplier: ${line.supplierId}, expected: ${supplierId}`);
      }
      
      return result;
    });
    
    console.log("Search results:", filtered.length, "lines found from", allInvoiceLines.length, "total lines");
    console.log("Filtered lines by supplier:", filtered.map(line => ({ id: line.id, supplierId: line.supplierId, supplierName: line.supplierName })));
    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleRegistration = async (selectedLines: SearchResultLine[], totals: { totalActualCost: number; totalActualVat: number; }, supplierInvoiceLines: SupplierInvoiceLine[], allLinesPaid?: boolean) => {
    if (!invoice) return;

    try {
      console.log("Registering lines to supplier invoice:", {
        selectedLines: selectedLines.map(l => ({ 
          id: l.id, 
          bookingNumber: l.bookingNumber,
          actualCost: l.actualCost,
          actualVat: l.actualVat,
          description: l.description 
        })),
        totals
      });
      
      // Group selected lines by booking number to handle multiple registrations
      const linesByBooking = selectedLines.reduce((acc, line) => {
        const bookingNumber = line.bookingNumber || getBookingNumberForSupplierLine({ id: line.id } as SupplierInvoiceLine);
        if (!acc[bookingNumber]) {
          acc[bookingNumber] = [];
        }
        acc[bookingNumber].push(line);
        return acc;
      }, {} as Record<string, SearchResultLine[]>);

      for (const [bookingNumber, bookingLines] of Object.entries(linesByBooking)) {
        console.log(`Processing booking ${bookingNumber} with ${bookingLines.length} lines`);
        
        // Check if this booking already has registered lines for this supplier invoice
        const existingSupplierLines = connectedSupplierInvoiceLines.filter(line => 
          getBookingNumberForSupplierLine(line) === bookingNumber
        );

        if (existingSupplierLines.length > 0) {
          console.log(`Updating existing lines for booking ${bookingNumber}`);
          // Update existing supplier invoice lines with new actual costs
          for (const bookingLine of bookingLines) {
            const matchingSupplierLine = existingSupplierLines.find(sl => 
              sl.invoiceLineId === bookingLine.id
            );

            if (matchingSupplierLine) {
              console.log(`Updating existing supplier line ${matchingSupplierLine.id} with actualCost: ${bookingLine.actualCost}, actualVat: ${bookingLine.actualVat}`);
              // Update existing supplier invoice line
              const { error } = await supabase
                .from('supplier_invoice_lines')
                .update({
                  actual_cost: bookingLine.actualCost || 0,
                  actual_vat: bookingLine.actualVat || 0,
                  description: bookingLine.description,
                })
                .eq('id', matchingSupplierLine.id);

              if (error) {
                console.error('Error updating supplier invoice line:', error);
                throw error;
              }
            } else {
              console.log(`Creating new supplier line for booking line ${bookingLine.id} with actualCost: ${bookingLine.actualCost}, actualVat: ${bookingLine.actualVat}`);
              // Create new supplier invoice line for this booking line
              const { error } = await supabase
                .from('supplier_invoice_lines')
                .insert({
                  supplier_invoice_id: invoice.id,
                  invoice_line_id: bookingLine.id,
                  actual_cost: bookingLine.actualCost || 0,
                  actual_vat: bookingLine.actualVat || 0,
                  description: bookingLine.description,
                  supplier_name: invoice.supplier.name,
                  currency: invoice.currency || 'USD',
                  created_by: 'User',
                });

              if (error) {
                console.error('Error creating supplier invoice line:', error);
                throw error;
              }
            }
          }
        } else {
          console.log(`Creating new lines for booking ${bookingNumber}`);
          // Create new supplier invoice lines for this booking
          const linesToInsert = bookingLines.map(line => {
            console.log(`Inserting line ${line.id} with actualCost: ${line.actualCost}, actualVat: ${line.actualVat}`);
            return {
              supplier_invoice_id: invoice.id,
              invoice_line_id: line.id,
              actual_cost: line.actualCost || 0,
              actual_vat: line.actualVat || 0,
              description: line.description,
              supplier_name: invoice.supplier.name,
              currency: invoice.currency || 'USD',
              created_by: 'User',
            };
          });

          const { error } = await supabase
            .from('supplier_invoice_lines')
            .insert(linesToInsert);

          if (error) {
            console.error('Error creating supplier invoice lines:', error);
            throw error;
          }
        }
      }

      toast({
        title: "Lines Registered",
        description: `Successfully registered/updated ${selectedLines.length} invoice lines.`,
      });
      
      console.log("Registration completed, refreshing data...");
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

  const generateLineNumbers = (supplierLines: SupplierInvoiceLine[]) => {
    const lineNumbers: Record<string, string> = {};
    const uniqueLineCounter: Record<string, number> = {};
    const subLineCounter: Record<string, number> = {};
    let mainCounter = 1;

    supplierLines.forEach((line) => {
      const invoiceLineId = line.invoiceLineId;
      
      if (!uniqueLineCounter[invoiceLineId]) {
        uniqueLineCounter[invoiceLineId] = mainCounter;
        subLineCounter[invoiceLineId] = 1;
        lineNumbers[line.id] = mainCounter.toString();
        mainCounter++;
      } else {
        subLineCounter[invoiceLineId]++;
        lineNumbers[line.id] = `${uniqueLineCounter[invoiceLineId]}.${subLineCounter[invoiceLineId] - 1}`;
      }
    });

    return lineNumbers;
  };

  const internalSupplierInvoiceId = invoice ? `SI-${invoice.id.substring(0, 8).toUpperCase()}` : '';

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

  const transformedSelectedProject = selectedProject ? {
    id: selectedProject.id,
    project_number: selectedProject.projectNumber || '',
    description: selectedProject.description
  } : null;

  const groupSupplierLinesByBookingWithTotals = (lines: SupplierInvoiceLine[]) => {
    console.log('=== Starting groupSupplierLinesByBookingWithTotals ===');
    console.log('Input supplier lines:', lines.map(l => ({ 
      id: l.id, 
      invoiceLineId: l.invoiceLineId,
      actualCost: l.actualCost, 
      actualVat: l.actualVat,
      description: l.description
    })));
    
    const grouped = lines.reduce((acc, line) => {
      const bookingNumber = getBookingNumberForSupplierLine(line);
      console.log(`Processing supplier line ${line.id} for booking ${bookingNumber}`);
      
      if (!acc[bookingNumber]) {
        acc[bookingNumber] = {
          bookingNumber,
          lines: [],
          totalActualCost: 0,
          totalActualVat: 0,
          estimatedCost: 0,
          estimatedVat: 0,
          currency: 'USD',
          departureDate: '',
          description: '',
          supplierName: '',
          confirmationNumber: '',
          paymentStatus: 'unpaid' as const,
          registeredAt: ''
        };
      }
      acc[bookingNumber].lines.push(line);
      
      // Make sure we're adding the actual costs from the supplier invoice lines
      const actualCost = Number(line.actualCost) || 0;
      const actualVat = Number(line.actualVat) || 0;
      
      console.log(`Adding costs for booking ${bookingNumber}: actualCost=${actualCost}, actualVat=${actualVat}`);
      acc[bookingNumber].totalActualCost += actualCost;
      acc[bookingNumber].totalActualVat += actualVat;
      
      console.log(`Running totals for booking ${bookingNumber}: totalActualCost=${acc[bookingNumber].totalActualCost}, totalActualVat=${acc[bookingNumber].totalActualVat}`);
      
      // Set registered datetime from the earliest supplier invoice line creation date
      if (!acc[bookingNumber].registeredAt || line.createdAt < acc[bookingNumber].registeredAt) {
        acc[bookingNumber].registeredAt = line.createdAt;
      }
      
      return acc;
    }, {} as Record<string, {
      bookingNumber: string;
      lines: SupplierInvoiceLine[];
      totalActualCost: number;
      totalActualVat: number;
      estimatedCost: number;
      estimatedVat: number;
      currency: string;
      departureDate: string;
      description: string;
      supplierName: string;
      confirmationNumber: string;
      paymentStatus: 'paid' | 'unpaid' | 'partial';
      registeredAt: string;
    }>);
    
    // Now calculate estimated costs for each booking group
    Object.keys(grouped).forEach(bookingNumber => {
      const booking = grouped[bookingNumber];
      
      console.log(`Calculating estimated costs for booking ${bookingNumber}`);
      
      // Get estimated costs from original invoice lines that match this booking
      const estimatedCosts = getEstimatedCostsForBooking(bookingNumber);
      booking.estimatedCost = estimatedCosts.estimatedCost;
      booking.estimatedVat = estimatedCosts.estimatedVat;
      booking.currency = estimatedCosts.currency;
      
      console.log(`Final costs for booking ${bookingNumber}:`, {
        estimatedCost: booking.estimatedCost,
        estimatedVat: booking.estimatedVat,
        actualCost: booking.totalActualCost,
        actualVat: booking.totalActualVat,
        currency: booking.currency
      });
      
      // Get additional booking details from the first invoice line that matches the booking number and supplier
      const originalLine = allInvoiceLines.find(line => 
        line.bookingNumber === bookingNumber &&
        line.supplierId === invoice?.supplier.id
      );
      
      if (originalLine) {
        booking.departureDate = originalLine.departureDate || '';
        booking.description = originalLine.description;
        booking.supplierName = originalLine.supplierName;
        booking.confirmationNumber = originalLine.confirmationNumber || '';
        booking.paymentStatus = originalLine.paymentStatus || 'unpaid';
        console.log(`Set booking details for ${bookingNumber} from original line:`, {
          supplier: booking.supplierName,
          description: booking.description
        });
      } else {
        console.log(`No original line found for booking ${bookingNumber} with supplier ${invoice?.supplier.id}`);
        // Set fallback values from supplier invoice line
        if (booking.lines.length > 0) {
          const firstLine = booking.lines[0];
          booking.supplierName = firstLine.supplierName;
          booking.description = firstLine.description;
          booking.currency = firstLine.currency;
          console.log(`Used fallback values from supplier line for booking ${bookingNumber}`);
        }
      }
    });
    
    const result = Object.values(grouped);
    console.log('=== Final grouped booking totals ===');
    result.forEach(b => {
      console.log(`Booking ${b.bookingNumber}:`, {
        totalActualCost: b.totalActualCost,
        totalActualVat: b.totalActualVat,
        estimatedCost: b.estimatedCost,
        estimatedVat: b.estimatedVat,
        supplierName: b.supplierName,
        registeredTotal: b.totalActualCost + b.totalActualVat,
        estimatedTotal: b.estimatedCost + b.estimatedVat
      });
    });
    
    return result;
  };

  const groupedBookingTotals = groupSupplierLinesByBookingWithTotals(connectedSupplierInvoiceLines);

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
                {isCancelled || isSentToAccounting ? "Supplier Invoice Details" : `Supplier Invoice ${formData.invoiceNumber} (${internalSupplierInvoiceId})`}
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
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Supplier</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p className="font-medium text-lg">{invoice.supplier.name}</p>
                </div>
              </div>

              <SupplierDetails supplier={invoice.supplier} />

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

        {connectedSupplierInvoiceLines && connectedSupplierInvoiceLines.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-green-700">
                Registered Bookings ({groupedBookingTotals.length} bookings)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Checkbox
                          checked={groupedBookingTotals.length > 0 && groupedBookingTotals.every(booking => fullyPaidStatus[booking.bookingNumber])}
                          onCheckedChange={(checked) => {
                            const newStatus = Object.fromEntries(
                              groupedBookingTotals.map(booking => [booking.bookingNumber, checked as boolean])
                            );
                            setFullyPaidStatus(newStatus);
                          }}
                          disabled={isSentToAccounting}
                        />
                      </TableHead>
                      <TableHead>Booking Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Departure Date</TableHead>
                      <TableHead>Reg Date</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Est. Curr.</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Actual Curr.</TableHead>
                      <TableHead>Actual Cost</TableHead>
                      <TableHead>Reg. Cost</TableHead>
                      {!isSentToAccounting && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedBookingTotals.map((booking) => {
                      const isFullyPaid = fullyPaidStatus[booking.bookingNumber] || false;
                      const registeredCost = booking.totalActualCost + booking.totalActualVat;
                      const estimatedTotal = booking.estimatedCost + booking.estimatedVat;
                      return (
                        <TableRow key={booking.bookingNumber}>
                          <TableCell>
                            <Checkbox
                              checked={isFullyPaid}
                              onCheckedChange={(checked) => handleFullyPaidChange(booking.bookingNumber, checked as boolean)}
                              disabled={isSentToAccounting}
                            />
                          </TableCell>
                          <TableCell>
                            <BookingSummaryPopover
                              bookingNumber={booking.bookingNumber}
                              allSupplierInvoiceLines={connectedSupplierInvoiceLines}
                              getEstimatedCostsForBooking={getEstimatedCostsForBooking}
                            >
                              <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                                {booking.bookingNumber}
                              </Button>
                            </BookingSummaryPopover>
                          </TableCell>
                          <TableCell>{booking.supplierName}</TableCell>
                          <TableCell>
                            {booking.departureDate ? new Date(booking.departureDate).toLocaleDateString() : ''}
                          </TableCell>
                          <TableCell>
                            {booking.registeredAt ? new Date(booking.registeredAt).toLocaleString() : ''}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.paymentStatus === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : booking.paymentStatus === 'partial'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {booking.paymentStatus === 'paid' ? 'Paid' : 
                               booking.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                            </span>
                          </TableCell>
                          <TableCell className="text-blue-600">
                            {booking.currency}
                          </TableCell>
                          <TableCell className="text-blue-600">
                            {formatCurrency(estimatedTotal)}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {booking.currency}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {formatCurrency(booking.totalActualCost)}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency(registeredCost)}
                          </TableCell>
                          {!isSentToAccounting && (
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    booking.lines.forEach(line => handleDeleteSupplierLine(line.id));
                                  }}
                                  disabled={isFullyPaid}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="flex justify-between font-semibold">
                    <span>Total Registered:</span>
                    <span className="text-green-600">
                      {currency} {formatCurrency(
                        groupedBookingTotals.reduce((sum, booking) => sum + booking.totalActualCost + booking.totalActualVat, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isCancelled && !isSentToAccounting && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search bookings ({allInvoiceLines.length} total lines available)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Search by first name..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Search by last name..."
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

                  <div className="space-y-3">
                    <Label>Payment Status</Label>
                    <RadioGroup 
                      className="flex flex-col space-y-2"
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
