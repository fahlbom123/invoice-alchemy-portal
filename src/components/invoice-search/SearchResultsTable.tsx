import React, { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface SearchResultLine {
  id: string;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  actualVat?: number;
  estimatedVat?: number;
  currency?: string;
  supplierName: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  departureDate?: string;
  paymentStatus?: "paid" | "unpaid" | "partial";
  firstName?: string;
  lastName?: string;
  selected?: boolean;
  registeredActualCost?: number;
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
  setEditingCost: (value: string) => void;
  setEditingVat: (value: string) => void;
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
  const allSelected = lines.length > 0 && lines.filter(line => line.paymentStatus !== "paid").every(line => line.selected);
  const someSelected = lines.some(line => line.selected);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                disabled={lines.every(line => line.paymentStatus === "paid")}
              />
            </TableHead>
            <TableHead>Booking Number</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Confirmation Number</TableHead>
            <TableHead>Departure Date</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead className="text-right">Est Cost</TableHead>
            <TableHead className="text-right">Est VAT</TableHead>
            <TableHead className="text-right">Reg Cost</TableHead>
            <TableHead className="text-right">Actual Cost</TableHead>
            <TableHead className="text-right">Actual VAT</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>
                <Checkbox
                  checked={line.selected || false}
                  onCheckedChange={(checked) => onSelectLine(line.id, checked as boolean)}
                  disabled={line.paymentStatus === "paid"}
                />
              </TableCell>
              <TableCell>{line.bookingNumber || 'N/A'}</TableCell>
              <TableCell>{line.description}</TableCell>
              <TableCell>{line.supplierName}</TableCell>
              <TableCell>{line.firstName || ''}</TableCell>
              <TableCell>{line.lastName || ''}</TableCell>
              <TableCell>{line.confirmationNumber || 'N/A'}</TableCell>
              <TableCell>
                {line.departureDate ? new Date(line.departureDate).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  line.paymentStatus === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : line.paymentStatus === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {line.paymentStatus === 'paid' ? 'Paid' : 
                   line.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(line.estimatedCost)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(line.estimatedVat || 0)}
              </TableCell>
              <TableCell className="text-right">
                {line.registeredActualCost ? formatCurrency(line.registeredActualCost) : '-'}
              </TableCell>
              <TableCell className="text-right">
                {editingLine === `${line.id}-cost` ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editingCost}
                      onChange={(e) => setEditingCost(e.target.value)}
                      className="w-24"
                      step="0.01"
                    />
                    <Button
                      size="sm"
                      onClick={() => onSaveActualCost(line.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{line.actualCost ? formatCurrency(line.actualCost) : formatCurrency(line.estimatedCost)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditActualCost(`${line.id}-cost`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                {editingLine === `${line.id}-vat` ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editingVat}
                      onChange={(e) => setEditingVat(e.target.value)}
                      className="w-24"
                      step="0.01"
                    />
                    <Button
                      size="sm"
                      onClick={() => onSaveActualCost(line.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{formatCurrency(line.actualVat || 0)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditActualCost(`${line.id}-vat`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={line.paymentStatus === "paid"}
                    onCheckedChange={(checked) => onToggleFullyPaid(line.id, checked as boolean)}
                  />
                  <span className="text-sm">Fully Paid</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SearchResultsTable;
