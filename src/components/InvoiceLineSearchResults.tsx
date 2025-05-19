
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceLine } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Extend InvoiceLine to include invoice reference
interface SearchResultLine extends InvoiceLine {
  invoiceId?: string;
  invoiceNumber?: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  departureDate?: string;
  paymentStatus?: "paid" | "unpaid" | "partial";
}

interface InvoiceLineSearchResultsProps {
  invoiceLines: SearchResultLine[];
}

const InvoiceLineSearchResults = ({ invoiceLines }: InvoiceLineSearchResultsProps) => {
  const navigate = useNavigate();
  
  // Function to render payment status icon
  const renderPaymentStatus = (status?: string) => {
    switch (status) {
      case "paid":
        return <Check className="h-5 w-5 text-green-500" />;
      case "partial":
        return <Circle className="h-5 w-5 text-amber-500" />;
      case "unpaid":
      default:
        return <X className="h-5 w-5 text-red-500" />;
    }
  };

  // Function to render payment status badge
  const renderPaymentStatusBadge = (status?: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case "partial":
        return <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Partial</Badge>;
      case "unpaid":
      default:
        return <Badge variant="default" className="bg-red-500 hover:bg-red-600">Unpaid</Badge>;
    }
  };
  
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Booking #</TableHead>
            <TableHead>Confirmation #</TableHead>
            <TableHead>Departure Date</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Est. Cost</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceLines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.invoiceNumber}</TableCell>
              <TableCell>{line.description}</TableCell>
              <TableCell>{line.supplierName}</TableCell>
              <TableCell>{line.bookingNumber}</TableCell>
              <TableCell>{line.confirmationNumber}</TableCell>
              <TableCell>{line.departureDate}</TableCell>
              <TableCell>{line.quantity}</TableCell>
              <TableCell>{formatCurrency(line.unitPrice)}</TableCell>
              <TableCell className="font-medium">{formatCurrency(line.estimatedCost)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {renderPaymentStatus(line.paymentStatus)}
                  {renderPaymentStatusBadge(line.paymentStatus)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {line.invoiceId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/invoices/${line.invoiceId}`)}
                  >
                    View Invoice
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceLineSearchResults;
