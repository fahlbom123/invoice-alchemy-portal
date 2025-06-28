
import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import SearchResultRow from "./SearchResultRow";
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
  // Group lines by supplier, then by booking number
  const groupedLines = lines.reduce((groups, line) => {
    const supplierKey = `${line.supplierId}-${line.supplierName}`;
    if (!groups[supplierKey]) {
      groups[supplierKey] = {
        supplierName: line.supplierName,
        bookings: {}
      };
    }
    
    const bookingKey = line.bookingNumber || 'No Booking';
    if (!groups[supplierKey].bookings[bookingKey]) {
      groups[supplierKey].bookings[bookingKey] = [];
    }
    groups[supplierKey].bookings[bookingKey].push(line);
    return groups;
  }, {} as Record<string, { supplierName: string; bookings: Record<string, SearchResultLine[]> }>);

  // Calculate totals for a group of lines
  const calculateTotals = (lineGroup: SearchResultLine[]) => {
    return lineGroup.reduce((totals, line) => {
      totals.estimatedCost += line.estimatedCost;
      totals.actualCost += line.actualCost || 0;
      totals.registeredCost += line.registeredActualCost || 0;
      return totals;
    }, {
      estimatedCost: 0,
      actualCost: 0,
      registeredCost: 0
    });
  };

  // Handle booking selection - select/deselect all lines in a booking
  const handleBookingSelection = (bookingLines: SearchResultLine[], checked: boolean) => {
    bookingLines.forEach(line => {
      // Don't allow selection of paid lines
      if (line.paymentStatus !== "paid") {
        onSelectLine(line.id, checked);
      }
    });
  };

  // Check if all lines in a booking are selected
  const isBookingSelected = (bookingLines: SearchResultLine[]) => {
    const unpaidLines = bookingLines.filter(line => line.paymentStatus !== "paid");
    return unpaidLines.length > 0 && unpaidLines.every(line => line.selected);
  };

  // Check if some lines in a booking are selected
  const isBookingPartiallySelected = (bookingLines: SearchResultLine[]) => {
    const unpaidLines = bookingLines.filter(line => line.paymentStatus !== "paid");
    const selectedUnpaidLines = unpaidLines.filter(line => line.selected);
    return selectedUnpaidLines.length > 0 && selectedUnpaidLines.length < unpaidLines.length;
  };

  const BookingSubtotalRow = ({ bookingNumber, bookingLines, totals }: { 
    bookingNumber: string; 
    bookingLines: SearchResultLine[];
    totals: ReturnType<typeof calculateTotals> 
  }) => {
    const isSelected = isBookingSelected(bookingLines);
    const isPartiallySelected = isBookingPartiallySelected(bookingLines);
    const hasUnpaidLines = bookingLines.some(line => line.paymentStatus !== "paid");

    return (
      <TableRow className="bg-blue-50 font-medium border-t border-blue-200">
        <TableCell>
          {hasUnpaidLines && (
            <Checkbox 
              checked={isSelected}
              ref={(el) => {
                if (el) el.indeterminate = isPartiallySelected && !isSelected;
              }}
              onCheckedChange={(checked) => handleBookingSelection(bookingLines, !!checked)}
              disabled={!hasUnpaidLines}
            />
          )}
        </TableCell>
        <TableCell colSpan={5} className="text-right text-blue-800">
          Subtotal for Booking {bookingNumber}:
        </TableCell>
        <TableCell></TableCell>
        <TableCell></TableCell>
        <TableCell className="text-right text-blue-800">{formatCurrency(totals.estimatedCost)}</TableCell>
        <TableCell className="text-right text-blue-800">{formatCurrency(totals.actualCost)}</TableCell>
        <TableCell className="text-right text-blue-800">{formatCurrency(totals.registeredCost)}</TableCell>
        <TableCell></TableCell>
        <TableCell></TableCell>
      </TableRow>
    );
  };

  const SupplierSubtotalRow = ({ supplierName, totals }: { 
    supplierName: string; 
    totals: ReturnType<typeof calculateTotals> 
  }) => (
    <TableRow className="bg-gray-100 font-semibold border-t-2 border-gray-300">
      <TableCell></TableCell>
      <TableCell colSpan={5} className="text-right">
        Total for {supplierName}:
      </TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell className="text-right">{formatCurrency(totals.estimatedCost)}</TableCell>
      <TableCell className="text-right">{formatCurrency(totals.actualCost)}</TableCell>
      <TableCell className="text-right">{formatCurrency(totals.registeredCost)}</TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
    </TableRow>
  );

  const MobileBookingSubtotal = ({ bookingNumber, bookingLines, totals }: { 
    bookingNumber: string; 
    bookingLines: SearchResultLine[];
    totals: ReturnType<typeof calculateTotals> 
  }) => {
    const isSelected = isBookingSelected(bookingLines);
    const isPartiallySelected = isBookingPartiallySelected(bookingLines);
    const hasUnpaidLines = bookingLines.some(line => line.paymentStatus !== "paid");

    return (
      <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
        <div className="flex items-center gap-2 mb-2">
          {hasUnpaidLines && (
            <Checkbox 
              checked={isSelected}
              ref={(el) => {
                if (el) el.indeterminate = isPartiallySelected && !isSelected;
              }}
              onCheckedChange={(checked) => handleBookingSelection(bookingLines, !!checked)}
              disabled={!hasUnpaidLines}
            />
          )}
          <h5 className="font-medium text-blue-800">Subtotal for Booking {bookingNumber}:</h5>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Est. Cost: {formatCurrency(totals.estimatedCost)}</div>
          <div>Actual Cost: {formatCurrency(totals.actualCost)}</div>
          <div>Reg. Cost: {formatCurrency(totals.registeredCost)}</div>
        </div>
      </div>
    );
  };

  const MobileSupplierSubtotal = ({ supplierName, totals }: { 
    supplierName: string; 
    totals: ReturnType<typeof calculateTotals> 
  }) => (
    <div className="bg-gray-100 p-4 rounded-md border-t-2 border-gray-300 mt-2">
      <h4 className="font-semibold mb-2">Total for {supplierName}:</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Est. Cost: {formatCurrency(totals.estimatedCost)}</div>
        <div>Actual Cost: {formatCurrency(totals.actualCost)}</div>
        <div>Reg. Cost: {formatCurrency(totals.registeredCost)}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-md overflow-hidden">
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
              <TableHead>Curr.</TableHead>
              <TableHead>Est. Cost</TableHead>
              <TableHead>Actual Cost</TableHead>
              <TableHead>Registered Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fully Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedLines).map(([supplierKey, { supplierName, bookings }]) => {
              // Calculate supplier totals from all bookings
              const allSupplierLines = Object.values(bookings).flat();
              const supplierTotals = calculateTotals(allSupplierLines);
              
              return (
                <React.Fragment key={supplierKey}>
                  {Object.entries(bookings).map(([bookingNumber, bookingLines]) => {
                    const bookingTotals = calculateTotals(bookingLines);
                    
                    return (
                      <React.Fragment key={`${supplierKey}-${bookingNumber}`}>
                        {bookingLines.map((line) => (
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
                            hideCheckbox={true}
                          />
                        ))}
                        <BookingSubtotalRow 
                          bookingNumber={bookingNumber} 
                          bookingLines={bookingLines}
                          totals={bookingTotals} 
                        />
                      </React.Fragment>
                    );
                  })}
                  <SupplierSubtotalRow 
                    supplierName={supplierName} 
                    totals={supplierTotals} 
                  />
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-md">
          <Checkbox 
            onCheckedChange={(checked) => onSelectAll(!!checked)} 
          />
          <span className="text-sm font-medium">Select All</span>
        </div>
        
        {Object.entries(groupedLines).map(([supplierKey, { supplierName, bookings }]) => {
          // Calculate supplier totals from all bookings
          const allSupplierLines = Object.values(bookings).flat();
          const supplierTotals = calculateTotals(allSupplierLines);
          
          return (
            <div key={supplierKey} className="space-y-2">
              {Object.entries(bookings).map(([bookingNumber, bookingLines]) => {
                const bookingTotals = calculateTotals(bookingLines);
                
                return (
                  <div key={`${supplierKey}-${bookingNumber}`} className="space-y-2">
                    {bookingLines.map((line) => (
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
                        isMobile={true}
                        hideCheckbox={true}
                      />
                    ))}
                    <MobileBookingSubtotal 
                      bookingNumber={bookingNumber} 
                      bookingLines={bookingLines}
                      totals={bookingTotals} 
                    />
                  </div>
                );
              })}
              <MobileSupplierSubtotal 
                supplierName={supplierName} 
                totals={supplierTotals} 
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default SearchResultsTable;
