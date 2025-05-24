
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

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

interface SearchResultRowProps {
  line: SearchResultLine;
  editingLine: string | null;
  editingCost: string;
  editingVat: string;
  onSelectLine: (id: string, checked: boolean) => void;
  onEditActualCost: (lineId: string) => void;
  onSaveActualCost: (lineId: string) => void;
  onCancelEdit: () => void;
  onToggleFullyPaid: (lineId: string, isPaid: boolean) => void;
  setEditingCost: (cost: string) => void;
  setEditingVat: (vat: string) => void;
  isMobile?: boolean;
}

const SearchResultRow = ({
  line,
  editingLine,
  editingCost,
  editingVat,
  onSelectLine,
  onEditActualCost,
  onSaveActualCost,
  onCancelEdit,
  onToggleFullyPaid,
  setEditingCost,
  setEditingVat,
  isMobile = false,
}: SearchResultRowProps) => {
  const navigate = useNavigate();

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

  // Calculate VAT amount (changed to display as currency)
  const calculateVatAmount = (cost: number, vatRate?: number) => {
    if (vatRate === undefined) return "-";
    return formatCurrency((cost * vatRate) / 100, undefined);
  };

  if (isMobile) {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={line.selected} 
              onCheckedChange={(checked) => onSelectLine(line.id, !!checked)} 
            />
            <div>
              <div className="font-medium text-sm">{line.invoiceNumber}</div>
              <div className="text-xs text-gray-500">{line.supplierName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderPaymentStatusBadge(line.paymentStatus)}
            <Switch 
              checked={line.paymentStatus === "paid"}
              onCheckedChange={(checked) => onToggleFullyPaid(line.id, checked)}
            />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-500">Description:</span>
              <div className="font-medium">{line.description}</div>
            </div>
            <div>
              <span className="text-gray-500">Qty:</span>
              <div>{line.quantity}</div>
            </div>
          </div>

          {line.bookingNumber && (
            <div>
              <span className="text-gray-500">Booking:</span>
              <div>{line.bookingNumber}</div>
            </div>
          )}

          {line.confirmationNumber && (
            <div>
              <span className="text-gray-500">Confirmation:</span>
              <div>{line.confirmationNumber}</div>
            </div>
          )}

          {line.departureDate && (
            <div>
              <span className="text-gray-500">Departure:</span>
              <div>{line.departureDate}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <span className="text-gray-500 text-xs">Estimated Cost:</span>
              <div className="font-medium">{formatCurrency(line.estimatedCost, undefined)}</div>
              <span className="text-gray-500 text-xs">Estimated VAT:</span>
              <div className="text-sm">{calculateVatAmount(line.estimatedCost, line.estimatedVat)}</div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Actual Cost:</span>
              {editingLine === `${line.id}-cost` ? (
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingCost}
                    onChange={(e) => setEditingCost(e.target.value)}
                    className="w-20 h-8 text-xs"
                    placeholder="Cost"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSaveActualCost(line.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelEdit}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="cursor-pointer hover:bg-blue-50 transition-colors p-1 rounded text-sm font-medium"
                  onClick={() => onEditActualCost(`${line.id}-cost`)}
                  title="Click to edit actual cost"
                >
                  {line.actualCost ? formatCurrency(line.actualCost, undefined) : "Click to edit"}
                </div>
              )}
              
              <span className="text-gray-500 text-xs">Actual VAT:</span>
              {editingLine === `${line.id}-vat` ? (
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingVat}
                    onChange={(e) => setEditingVat(e.target.value)}
                    className="w-20 h-8 text-xs"
                    placeholder="VAT"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSaveActualCost(line.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelEdit}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="cursor-pointer hover:bg-blue-50 transition-colors p-1 rounded text-sm"
                  onClick={() => onEditActualCost(`${line.id}-vat`)}
                  title="Click to edit actual VAT"
                >
                  {line.actualVat && line.actualCost 
                    ? calculateVatAmount(line.actualCost, line.actualVat)
                    : "Click to edit"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Checkbox 
          checked={line.selected} 
          onCheckedChange={(checked) => onSelectLine(line.id, !!checked)} 
        />
      </TableCell>
      <TableCell>{line.invoiceNumber}</TableCell>
      <TableCell>{line.description}</TableCell>
      <TableCell>{line.supplierName}</TableCell>
      <TableCell>{line.bookingNumber}</TableCell>
      <TableCell>{line.confirmationNumber}</TableCell>
      <TableCell>{line.departureDate}</TableCell>
      <TableCell>{line.quantity}</TableCell>
      <TableCell>{line.currency || "USD"}</TableCell>
      <TableCell className="font-medium">
        {formatCurrency(line.estimatedCost, undefined)}
      </TableCell>
      <TableCell>
        {calculateVatAmount(line.estimatedCost, line.estimatedVat)}
      </TableCell>
      <TableCell>
        {editingLine === `${line.id}-cost` ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editingCost}
              onChange={(e) => setEditingCost(e.target.value)}
              className="w-24"
              placeholder="Cost"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSaveActualCost(line.id)}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="cursor-pointer hover:bg-blue-50 transition-colors p-1 rounded"
            onClick={() => onEditActualCost(`${line.id}-cost`)}
            title="Click to edit actual cost"
          >
            {line.actualCost ? formatCurrency(line.actualCost, undefined) : "Click to edit"}
          </div>
        )}
      </TableCell>
      <TableCell>
        {editingLine === `${line.id}-vat` ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editingVat}
              onChange={(e) => setEditingVat(e.target.value)}
              className="w-24"
              placeholder="VAT"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSaveActualCost(line.id)}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="cursor-pointer hover:bg-blue-50 transition-colors p-1 rounded"
            onClick={() => onEditActualCost(`${line.id}-vat`)}
            title="Click to edit actual VAT"
          >
            {line.actualVat && line.actualCost 
              ? calculateVatAmount(line.actualCost, line.actualVat)
              : "Click to edit"}
          </div>
        )}
      </TableCell>
      <TableCell>
        {renderPaymentStatusBadge(line.paymentStatus)}
      </TableCell>
      <TableCell>
        <Switch 
          checked={line.paymentStatus === "paid"}
          onCheckedChange={(checked) => onToggleFullyPaid(line.id, checked)}
        />
      </TableCell>
    </TableRow>
  );
};

export default SearchResultRow;
