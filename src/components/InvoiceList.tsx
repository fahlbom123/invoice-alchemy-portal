import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Invoice } from "@/types/invoice";

interface InvoiceListProps {
  invoices: Invoice[];
}

const InvoiceList = ({ invoices }: InvoiceListProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [localInvoices, setLocalInvoices] = useState<Invoice[]>(invoices);
  
  // Listen for invoice updates
  useEffect(() => {
    const handleInvoiceUpdate = () => {
      try {
        const savedInvoices = localStorage.getItem('invoices');
        if (savedInvoices) {
          const updatedInvoices = JSON.parse(savedInvoices);
          setLocalInvoices(updatedInvoices);
        }
      } catch (error) {
        console.error('Error loading updated invoices:', error);
      }
    };

    window.addEventListener('invoicesUpdated', handleInvoiceUpdate);
    return () => {
      window.removeEventListener('invoicesUpdated', handleInvoiceUpdate);
    };
  }, []);

  // Update local invoices when prop changes
  useEffect(() => {
    setLocalInvoices(invoices);
  }, [invoices]);
  
  const filteredInvoices = localInvoices.filter(invoice => 
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    invoice.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No invoices found matching your search.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.supplier.name}</TableCell>
                  <TableCell>{formatDate(invoice.invoiceDate || invoice.createdAt)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>{invoice.currency || "USD"}</TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount, undefined)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {invoice.source || "Manual"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getBadgeVariant(invoice.status)}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/invoices/view/${invoice.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
