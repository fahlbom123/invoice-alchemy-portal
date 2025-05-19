
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceLine } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Extend InvoiceLine to include invoice reference
interface SearchResultLine extends InvoiceLine {
  invoiceId?: string;
  invoiceNumber?: string;
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
            <TableHead>Part Number</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Estimated Cost</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceLines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.invoiceNumber}</TableCell>
              <TableCell>{line.description}</TableCell>
              <TableCell>{line.supplierName}</TableCell>
              <TableCell>{line.supplierPartNumber}</TableCell>
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
