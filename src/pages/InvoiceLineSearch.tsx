
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceLine } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import InvoiceLineSearchResults from "@/components/InvoiceLineSearchResults";
import { formatCurrency } from "@/lib/formatters";

const InvoiceLineSearch = () => {
  const navigate = useNavigate();
  const { invoices, isLoading } = useInvoices();
  const { suppliers } = useSuppliers();
  const [supplierId, setSupplierId] = useState<string>("");
  const [minCost, setMinCost] = useState<string>("");
  const [maxCost, setMaxCost] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [searchResults, setSearchResults] = useState<InvoiceLine[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Extract all invoice lines from all invoices
  const allInvoiceLines = invoices.flatMap(invoice => 
    invoice.invoiceLines.map(line => ({
      ...line,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber
    }))
  );

  const handleSearch = () => {
    // Filter invoice lines based on search criteria
    const filtered = allInvoiceLines.filter(line => {
      const matchesSupplier = !supplierId || line.supplierId === supplierId;
      const matchesMinCost = !minCost || line.estimatedCost >= parseFloat(minCost);
      const matchesMaxCost = !maxCost || line.estimatedCost <= parseFloat(maxCost);
      const matchesDescription = !description || 
        line.description.toLowerCase().includes(description.toLowerCase());
      
      return matchesSupplier && matchesMinCost && matchesMaxCost && matchesDescription;
    });
    
    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleClear = () => {
    setSupplierId("");
    setMinCost("");
    setMaxCost("");
    setDescription("");
    setSearchResults([]);
    setHasSearched(false);
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
                    <SelectItem value="">All Suppliers</SelectItem>
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
                <Label htmlFor="minCost">Minimum Cost</Label>
                <Input
                  id="minCost"
                  type="number"
                  value={minCost}
                  onChange={(e) => setMinCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxCost">Maximum Cost</Label>
                <Input
                  id="maxCost"
                  type="number"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                  placeholder="0.00"
                />
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
                <InvoiceLineSearchResults invoiceLines={searchResults} />
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
