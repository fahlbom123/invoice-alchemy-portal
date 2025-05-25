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
import { ArrowLeft, Edit } from "lucide-react";
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

  // Search state
  const [supplierId, setSupplierId] = useState<string>("all");
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
    }
  }, [invoice]);

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
              />

              {/* Supplier Invoice Lines */}
              {invoice.supplierInvoiceLines && invoice.supplierInvoiceLines.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Supplier Invoice Lines</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Register Datetime</TableHead>
                          <TableHead>Actual Cost</TableHead>
                          <TableHead>Actual VAT</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.supplierInvoiceLines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>{line.description}</TableCell>
                            <TableCell>{line.supplierName}</TableCell>
                            <TableCell>{line.createdBy || "Unknown"}</TableCell>
                            <TableCell>
                              {new Date(line.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(line.actualCost, line.currency)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(line.actualVat, line.currency)}
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
