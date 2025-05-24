
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import SearchResultRow from "./SearchResultRow";

interface SearchResultLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  estimatedCost: number;
  actualCost?: number;
  supplierId: string;
  supplierName: string;
  supplierPartNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  departureDate?: string;
  paymentStatus?: "paid" | "unpaid" | "partial";
  supplier?: {
    accountNumber?: string;
    defaultCurrency?: string;
    currencyRate?: number;
  };
  selected?: boolean;
  currency?: string;
  estimatedVat?: number;
  actualVat?: number;
}

interface SearchResultsTableProps {
  lines: SearchResultLine[];
  editingLine: string | null;
  editingCost: string;
  editingVat: string;
  onSelectLine: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEditActualCost: (lineId: string) => void;
  onSaveActualCost: (lineId: string) => void;
  onCancelEdit: () => void;
  onToggleFullyPaid: (lineId: string, isPaid: boolean) => void;
  setEditingCost: (cost: string) => void;
  setEditingVat: (vat: string) => void;
}

const SearchResultsTable = ({
  lines,
  editingLine,
  editingCost,
  editingVat,
  onSelectLine,
  onSelectAll,
  onEditActualCost,
  onSaveActualCost,
  onCancelEdit,
  onToggleFullyPaid,
  setEditingCost,
  setEditingVat,
}: SearchResultsTableProps) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                onCheckedChange={(checked) => onSelectAll(!!checked)} 
              />
            </TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead>Confirmation</TableHead>
            <TableHead>Departure Date</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Est. Cost</TableHead>
            <TableHead>Est. VAT</TableHead>
            <TableHead>Actual Cost</TableHead>
            <TableHead>Actual VAT</TableHead>
            <TableHead>Diff.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fully Paid</TableHead>
            <TableHead className="text-right">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <SearchResultRow
              key={line.id}
              line={line}
              editingLine={editingLine}
              editingCost={editingCost}
              editingVat={editingVat}
              onSelectLine={onSelectLine}
              onEditActualCost={onEditActualCost}
              onSaveActualCost={onSaveActualCost}
              onCancelEdit={onCancelEdit}
              onToggleFullyPaid={onToggleFullyPaid}
              setEditingCost={setEditingCost}
              setEditingVat={setEditingVat}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SearchResultsTable;
