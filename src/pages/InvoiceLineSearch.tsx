
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InvoiceLine } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import InvoiceLineSearchResults from "@/components/InvoiceLineSearchResults";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

// Extended type for invoice lines with additional properties
interface ExtendedInvoiceLine extends InvoiceLine {
  invoiceId: string;
  invoiceNumber: string;
  bookingNumber: string;
  confirmationNumber: string;
  departureDate: string;
  paymentStatus: "paid" | "unpaid" | "partial";
  invoiceTotalAmount: number;
}

const InvoiceLineSearch = () => {
  const navigate = useNavigate();
  const { invoices, isLoading } = useInvoices();
  const { suppliers } = useSuppliers();
  
  const [supplierId, setSupplierId] = useState<string>("all");
  const [description, setDescription] = useState<string>("");
  const [bookingNumber, setBookingNumber] = useState<string>("");
  const [confirmationNumber, setConfirmationNumber] = useState<string>("");
  const [departureDateStart, setDepartureDateStart] = useState<string>("");
  const [departureDateEnd, setDepartureDateEnd] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<ExtendedInvoiceLine[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchKey, setSearchKey] = useState(0);

  // Extract all invoice lines from all invoices - recalculate when invoices change
  const allInvoiceLines: ExtendedInvoiceLine[] = invoices.flatMap(invoice => 
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

  // Memoized search function
  const performSearch = useCallback(() => {
    console.log("Executing search with criteria:", {
      supplierId,
      description,
      bookingNumber,
      confirmationNumber,
      departureDateStart,
      departureDateEnd,
      paymentStatus
    });
    
    // Filter invoice lines based on search criteria
    const filtered = allInvoiceLines.filter(line => {
      const matchesSupplier = supplierId === "all" || line.supplierId === supplierId;
      const matchesDescription = !description || 
        line.description.toLowerCase().includes(description.toLowerCase());
      
      // New search parameters
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
        // If we're filtering by date but the line has no date, don't include it
        matchesDepartureDate = false;
      }

      // Payment status check
      const matchesPaymentStatus = paymentStatus === "all" || line.paymentStatus === paymentStatus;
      
      return matchesSupplier && matchesDescription && 
             matchesBookingNumber && matchesConfirmationNumber && matchesDepartureDate && 
             matchesPaymentStatus;
    });
    
    console.log("Search results:", filtered.length, "lines found");
    setSearchResults(filtered);
    setHasSearched(true);
    setSearchKey(prev => prev + 1);
  }, [allInvoiceLines, supplierId, description, bookingNumber, confirmationNumber, departureDateStart, departureDateEnd, paymentStatus]);

  // Auto-refresh search results when invoices data changes (including payment status updates)
  useEffect(() => {
    if (hasSearched) {
      console.log("Invoices updated, refreshing search results");
      performSearch();
    }
  }, [performSearch, hasSearched]);

  // Calculate total invoice amount from search results
  const calculateTotalInvoiceAmount = (results: ExtendedInvoiceLine[]) => {
    const uniqueInvoices = new Map();
    results.forEach(line => {
      if (line.invoiceId && line.invoiceTotalAmount !== undefined) {
        uniqueInvoices.set(line.invoiceId, line.invoiceTotalAmount);
      }
    });
    return Array.from(uniqueInvoices.values()).reduce((sum, amount) => sum + amount, 0);
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
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('invoicesUpdated'));
      
      toast.success("Invoice line payment status has been updated and saved.");
      
    } catch (error) {
      console.error("Error updating line status:", error);
      toast.error("Failed to update line status.");
    }
  };

  const handleSearch = () => {
    performSearch();
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
    setSearchKey(prev => prev + 1);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
        
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
                  key={`search-results-${searchKey}`}
                  invoiceLines={searchResults} 
                  invoiceTotalAmount={calculateTotalInvoiceAmount(searchResults)}
                  onLineStatusUpdate={handleLineStatusUpdate}
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

export default InvoiceLineSearch;
