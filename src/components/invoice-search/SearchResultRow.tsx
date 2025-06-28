
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/formatters";
import { Check, X, Edit3 } from "lucide-react";

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
  registeredActualCost?: number;
  registeredActualVat?: number;
  firstName?: string;
  lastName?: string;
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
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case "partial":
        return <Badge variant="secondary">Partial</Badge>;
      case "unpaid":
      default:
        return <Badge variant="outline">Unpaid</Badge>;
    }
  };

  if (isMobile) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              checked={line.selected || false}
              onCheckedChange={(checked) => onSelectLine(line.id, !!checked)}
              disabled={line.paymentStatus === "paid"}
            />
            <div>
              <p className="font-medium text-sm">{line.description}</p>
              <p className="text-xs text-gray-500">
                Invoice: {line.invoiceNumber || "N/A"}
              </p>
            </div>
          </div>
          {getStatusBadge(line.paymentStatus)}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="font-medium">Supplier:</span> {line.supplierName}</div>
          <div><span className="font-medium">Booking:</span> {line.bookingNumber || "N/A"}</div>
          <div><span className="font-medium">Confirmation:</span> {line.confirmationNumber || "N/A"}</div>
          <div><span className="font-medium">First Name:</span> {line.firstName || "N/A"}</div>
          <div><span className="font-medium">Last Name:</span> {line.lastName || "N/A"}</div>
          <div><span className="font-medium">Departure:</span> {line.departureDate || "N/A"}</div>
          <div><span className="font-medium">Qty:</span> {line.quantity}</div>
          <div><span className="font-medium">Currency:</span> {line.currency || "SEK"}</div>
          <div><span className="font-medium">Est. Cost:</span> {formatCurrency(line.estimatedCost)}</div>
          <div><span className="font-medium">Est. VAT:</span> {formatCurrency(line.estimatedVat || 0)}</div>
          <div><span className="font-medium">Actual Cost:</span> {formatCurrency(line.actualCost || 0)}</div>
          <div><span className="font-medium">Actual VAT:</span> {formatCurrency(line.actualVat || 0)}</div>
          <div><span className="font-medium">Reg. Cost:</span> {formatCurrency(line.registeredActualCost || 0)}</div>
          <div><span className="font-medium">Reg. VAT:</span> {formatCurrency(line.registeredActualVat || 0)}</div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Fully Paid:</span>
            <Switch
              checked={line.paymentStatus === "paid"}
              onCheckedChange={(checked) => onToggleFullyPaid(line.id, checked)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TableRow className={line.selected ? "bg-blue-50" : ""}>
      <TableCell>
        <Checkbox 
          checked={line.selected || false}
          onCheckedChange={(checked) => onSelectLine(line.id, !!checked)}
          disabled={line.paymentStatus === "paid"}
        />
      </TableCell>
      <TableCell className="font-medium">{line.invoiceNumber || "N/A"}</TableCell>
      <TableCell>{line.description}</TableCell>
      <TableCell>{line.supplierName}</TableCell>
      <TableCell>{line.bookingNumber || "N/A"}</TableCell>
      <TableCell>{line.confirmationNumber || "N/A"}</TableCell>
      <TableCell>{line.firstName || "N/A"}</TableCell>
      <TableCell>{line.lastName || "N/A"}</TableCell>
      <TableCell>{line.departureDate || "N/A"}</TableCell>
      <TableCell>{line.quantity}</TableCell>
      <TableCell>{line.currency || "SEK"}</TableCell>
      <TableCell className="text-right">{formatCurrency(line.estimatedCost)}</TableCell>
      <TableCell className="text-right">{formatCurrency(line.estimatedVat || 0)}</TableCell>
      <TableCell className="text-right">
        {editingLine === `${line.id}-cost` ? (
          <div className="flex items-center space-x-1">
            <Input
              value={editingCost}
              onChange={(e) => setEditingCost(e.target.value)}
              className="w-20 h-8 text-xs"
              type="number"
              step="0.01"
            />
            <Button
              size="sm"
              onClick={() => onSaveActualCost(line.id)}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <span>{formatCurrency(line.actualCost || 0)}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditActualCost(`${line.id}-cost`)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">
        {editingLine === `${line.id}-vat` ? (
          <div className="flex items-center space-x-1">
            <Input
              value={editingVat}
              onChange={(e) => setEditingVat(e.target.value)}
              className="w-20 h-8 text-xs"
              type="number"
              step="0.01"
            />
            <Button
              size="sm"
              onClick={() => onSaveActualCost(line.id)}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelEdit}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <span>{formatCurrency(line.actualVat || 0)}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditActualCost(`${line.id}-vat`)}
              className="h-6 w-6 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="text-right">{formatCurrency(line.registeredActualCost || 0)}</TableCell>
      <TableCell className="text-right">{formatCurrency(line.registeredActualVat || 0)}</TableCell>
      <TableCell>{getStatusBadge(line.paymentStatus)}</TableCell>
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
