
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceLine } from "@/types/invoice";
import { Check, X, Divide } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvoiceLinesListProps {
  invoiceLines: InvoiceLine[];
}

const InvoiceLinesList = ({ invoiceLines }: InvoiceLinesListProps) => {
  // Function to render invoice type
  const renderInvoiceType = (type?: string) => {
    switch (type) {
      case "multi":
        return <div className="flex items-center gap-1"><Divide className="h-4 w-4" /> <span>Multi</span></div>;
      case "single":
      default:
        return <span>Single</span>;
    }
  };

  // Function to render fully invoiced status
  const renderFullyInvoicedStatus = (fullyInvoiced?: boolean) => {
    return fullyInvoiced ? 
      <Check className="h-5 w-5 text-green-500" /> : 
      <X className="h-5 w-5 text-red-500" />;
  };

  // Calculate cost difference
  const calculateCostDifference = (estimated: number, actual?: number) => {
    if (actual === undefined) return null;
    
    const diff = actual - estimated;
    const formattedDiff = formatCurrency(Math.abs(diff));
    
    if (diff > 0) {
      return <span className="text-red-500">+{formattedDiff}</span>;
    } else if (diff < 0) {
      return <span className="text-green-500">-{formattedDiff}</span>;
    }
    return <span>0</span>;
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Estimated Cost</TableHead>
            <TableHead>Actual Cost</TableHead>
            <TableHead>Difference</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Part Number</TableHead>
            <TableHead>Fully Invoiced</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceLines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.description}</TableCell>
              <TableCell>{renderInvoiceType(line.invoiceType)}</TableCell>
              <TableCell>{line.quantity}</TableCell>
              <TableCell>{formatCurrency(line.unitPrice)}</TableCell>
              <TableCell>{line.currency || "USD"}</TableCell>
              <TableCell>{formatCurrency(line.estimatedCost)}</TableCell>
              <TableCell>{line.actualCost ? formatCurrency(line.actualCost) : "-"}</TableCell>
              <TableCell>{calculateCostDifference(line.estimatedCost, line.actualCost)}</TableCell>
              <TableCell>{line.supplierName}</TableCell>
              <TableCell>{line.supplierPartNumber}</TableCell>
              <TableCell>{renderFullyInvoicedStatus(line.fullyInvoiced)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoiceLinesList;
