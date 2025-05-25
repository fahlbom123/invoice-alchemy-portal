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
import { useInvoiceById, useInvoices, useSaveInvoice } from "@/hooks/useInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { InvoiceFormData, InvoiceLine, SupplierInvoiceLine } from "@/types/invoice";
import SupplierDetails from "@/components/invoice/SupplierDetails";
import InvoiceHeaderView from "@/components/invoice/InvoiceHeaderView";
import InvoiceLineSearchResults from "@/components/InvoiceLineSearchResults";
import { ArrowLeft, Edit, Trash2, Save, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "@/hooks/use-toast";

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const { invoice, isLoading } = useInvoiceById(id || "");
  const { invoices, isLoading: isLoadingInvoices } = useInvoices();
  const { suppliers } = useSuppliers();
  const { saveInvoice } = useSaveInvoice();
  const navigate = useNavigate();

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
      
      if (allLinesPaid) {
        toast({
          title: "Invoice Status Updated",
          description: "All lines are now fully paid. Invoice status updated to 'paid'.",
        });
      }
      
      // Refresh the page or update the local state
      window.location.reload();
    } catch (error) {
      console.error("Error saving invoice:", error);
    }
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
          <Button onClick={() => navigate(`/invoices/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Supplier Invoice
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>View Supplier Invoice</CardTitle>
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
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteSupplierLine(line.id)}
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

        {/* Search Invoice Lines Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Invoice Lines</CardTitle>
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

        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>
                Search Results
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
      </div>
    </div>
  );
};

export default InvoiceView;
