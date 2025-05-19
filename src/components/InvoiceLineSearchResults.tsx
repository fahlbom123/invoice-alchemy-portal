
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceLine } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Extend InvoiceLine to include invoice reference
interface SearchResultLine extends InvoiceLine {
  invoiceId?: string;
  invoiceNumber?: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  departureDate?: string;
}

interface InvoiceLineSearchResultsProps {
  invoiceLines: SearchResultLine[];
}

const InvoiceLineSearchResults = ({ invoiceLines }: InvoiceLineSearchResultsProps) => {
  const navigate = useNavigate();
  
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
