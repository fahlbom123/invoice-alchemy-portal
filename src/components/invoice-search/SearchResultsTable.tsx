
import React, { useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SearchResultRow from "./SearchResultRow";
import { formatCurrency } from "@/lib/formatters";
import { Edit, Save, X } from "lucide-react";
import { mockBookings } from "@/data/mockData";

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
  firstName?: string;
  lastName?: string;
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
  // State for booking subtotal editing
  const [editingBookingCost, setEditingBookingCost] = useState<string | null>(null);
  const [editingBookingCostValue, setEditingBookingCostValue] = useState<string>("");

  // State for booking currency editing
  const [editingBookingCurrency, setEditingBookingCurrency] = useState<string | null>(null);
  const [editingBookingCurrencyValue, setEditingBookingCurrencyValue] = useState<string>("");

  // Helper function to get booking details from booking number
  const getBookingDetails = (bookingNumber?: string) => {
    console.log('Getting booking details for:', bookingNumber);
    console.log('Available bookings:', mockBookings.map(b => ({ number: b.bookingNumber, firstName: b.firstName, lastName: b.lastName })));
    
    if (!bookingNumber) return { firstName: '', lastName: '', fullName: '-' };
    const booking = mockBookings.find(b => b.bookingNumber === bookingNumber);
    if (!booking) {
      console.log('No booking found for number:', bookingNumber);
      return { firstName: '', lastName: '', fullName: '-' };
    }
    
    const fullName = [booking.firstName, booking.lastName].filter(Boolean).join(' ') || '-';
    console.log('Found booking:', { bookingNumber, firstName: booking.firstName, lastName: booking.lastName, fullName });
    return {
      firstName: booking.firstName || '',
      lastName: booking.lastName || '',
      fullName
    };
  };

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

  // Handle booking cost editing - now edits actual cost
  const handleEditBookingCost = (bookingNumber: string, currentActualCost: number) => {
    setEditingBookingCost(bookingNumber);
    setEditingBookingCostValue(currentActualCost.toString());
  };

  const handleSaveBookingCost = (bookingNumber: string, bookingLines: SearchResultLine[]) => {
    const newTotalActualCost = parseFloat(editingBookingCostValue) || 0;
    const currentTotalActualCost = bookingLines.reduce((sum, line) => sum + (line.actualCost || 0), 0);
    
    if (newTotalActualCost === currentTotalActualCost) {
      setEditingBookingCost(null);
      setEditingBookingCostValue("");
      return;
    }

    // Distribute the new total actual cost proportionally among the lines based on their estimated costs
    const totalEstimatedCost = bookingLines.reduce((sum, line) => sum + line.estimatedCost, 0);
    
    if (totalEstimatedCost > 0) {
      bookingLines.forEach(line => {
        const proportion = line.estimatedCost / totalEstimatedCost;
        const newActualCost = newTotalActualCost * proportion;
        
        // Trigger the line edit to update the actual cost
        // We need to simulate the editing process for each line
        onEditActualCost(`${line.id}-cost`);
        setEditingCost(newActualCost.toString());
        onSaveActualCost(line.id);
      });
    }

    setEditingBookingCost(null);
    setEditingBookingCostValue("");
  };

  const handleCancelBookingEdit = () => {
    setEditingBookingCost(null);
    setEditingBookingCostValue("");
  };

  // Handle booking currency editing
  const handleEditBookingCurrency = (bookingNumber: string, currentCurrency: string) => {
    setEditingBookingCurrency(bookingNumber);
    setEditingBookingCurrencyValue(currentCurrency);
  };

  const handleSaveBookingCurrency = (bookingNumber: string, bookingLines: SearchResultLine[]) => {
    const newCurrency = editingBookingCurrencyValue.trim() || 'SEK';
    
    // Update currency for all lines in the booking
    bookingLines.forEach(line => {
      // We would need a callback to update currency, but for now we'll just close the editor
      // In a real implementation, you'd need to add a currency update callback
      console.log(`Would update currency for line ${line.id} to ${newCurrency}`);
    });

    setEditingBookingCurrency(null);
    setEditingBookingCurrencyValue("");
  };

  const handleCancelBookingCurrencyEdit = () => {
    setEditingBookingCurrency(null);
    setEditingBookingCurrencyValue("");
  };

  const BookingHeaderRow = () => (
    <TableRow className="bg-gray-200 font-semibold">
      <TableHead className="w-12">
        <Checkbox 
          onCheckedChange={(checked) => onSelectAll(!!checked)} 
        />
      </TableHead>
      <TableHead>Booking Number</TableHead>
      <TableHead>First Name</TableHead>
      <TableHead>Last Name</TableHead>
      <TableHead>Supplier</TableHead>
      <TableHead>Departure Date</TableHead>
      <TableHead>Est. Curr.</TableHead>
      <TableHead>Est. Cost</TableHead>
      <TableHead>Actual Curr.</TableHead>
      <TableHead>Actual Cost</TableHead>
      <TableHead>Reg. Curr.</TableHead>
      <TableHead>Reg. Cost</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  );

  const BookingSubtotalRow = ({ bookingNumber, bookingLines, totals }: { 
    bookingNumber: string; 
    bookingLines: SearchResultLine[];
    totals: ReturnType<typeof calculateTotals> 
  }) => {
    const isSelected = isBookingSelected(bookingLines);
    const isPartiallySelected = isBookingPartiallySelected(bookingLines);
    const hasUnpaidLines = bookingLines.some(line => line.paymentStatus !== "paid");
    const isEditingThisBookingCost = editingBookingCost === bookingNumber;
    const isEditingThisBookingCurrency = editingBookingCurrency === bookingNumber;
    
    // Get booking details from the bookings array
    const bookingDetails = getBookingDetails(bookingNumber);
    const firstLine = bookingLines[0];
    const isPaid = bookingLines.every(line => line.paymentStatus === "paid");
    const status = isPaid ? "Paid" : bookingLines.some(line => line.paymentStatus === "paid") ? "Partial" : "Unpaid";

    return (
      <TableRow className="bg-blue-50 font-medium border-t border-blue-200">
        <TableCell>
          {hasUnpaidLines && (
            <Checkbox 
              checked={isSelected}
              ref={(el) => {
                if (el) {
                  const checkboxEl = el as HTMLInputElement;
                  checkboxEl.indeterminate = isPartiallySelected && !isSelected;
                }
              }}
              onCheckedChange={(checked) => handleBookingSelection(bookingLines, !!checked)}
              disabled={!hasUnpaidLines}
            />
          )}
        </TableCell>
        <TableCell className="text-blue-800 font-medium">{bookingNumber}</TableCell>
        <TableCell className="text-blue-800">{bookingDetails.firstName}</TableCell>
        <TableCell className="text-blue-800">{bookingDetails.lastName}</TableCell>
        <TableCell className="text-blue-800">{firstLine.supplierName}</TableCell>
        <TableCell className="text-blue-800">{firstLine.departureDate || '-'}</TableCell>
        <TableCell className="text-blue-800">{firstLine.currency || 'SEK'}</TableCell>
        <TableCell className="text-right text-blue-800">{formatCurrency(totals.estimatedCost)}</TableCell>
        <TableCell className="text-blue-800">
          {isEditingThisBookingCurrency ? (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={editingBookingCurrencyValue}
                onChange={(e) => setEditingBookingCurrencyValue(e.target.value)}
                className="w-16 h-8"
                placeholder="SEK"
              />
              <Button
                size="sm"
                variant="default"
                onClick={() => handleSaveBookingCurrency(bookingNumber, bookingLines)}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelBookingCurrencyEdit}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{firstLine.currency || 'SEK'}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditBookingCurrency(bookingNumber, firstLine.currency || 'SEK')}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </TableCell>
        <TableCell className="text-right text-blue-800">
          {isEditingThisBookingCost ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                value={editingBookingCostValue}
                onChange={(e) => setEditingBookingCostValue(e.target.value)}
                className="w-24 h-8"
              />
              <Button
                size="sm"
                variant="default"
                onClick={() => handleSaveBookingCost(bookingNumber, bookingLines)}
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelBookingEdit}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{formatCurrency(totals.actualCost)}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditBookingCost(bookingNumber, totals.actualCost)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </TableCell>
        <TableCell className="text-blue-800">{firstLine.currency || 'SEK'}</TableCell>
        <TableCell className="text-right text-blue-800">{formatCurrency(totals.registeredCost)}</TableCell>
        <TableCell className="text-blue-800">{status}</TableCell>
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
      <TableCell className="text-right">{formatCurrency(totals.estimatedCost)}</TableCell>
      <TableCell></TableCell>
      <TableCell className="text-right">{formatCurrency(totals.actualCost)}</TableCell>
      <TableCell></TableCell>
      <TableCell className="text-right">{formatCurrency(totals.registeredCost)}</TableCell>
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
    const isEditingThisBookingCost = editingBookingCost === bookingNumber;
    const isEditingThisBookingCurrency = editingBookingCurrency === bookingNumber;
    const bookingDetails = getBookingDetails(bookingNumber);
    const firstLine = bookingLines[0];

    return (
      <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
        <div className="flex items-center gap-2 mb-2">
          {hasUnpaidLines && (
            <Checkbox 
              checked={isSelected}
              ref={(el) => {
                if (el) {
                  const checkboxEl = el as HTMLInputElement;
                  checkboxEl.indeterminate = isPartiallySelected && !isSelected;
                }
              }}
              onCheckedChange={(checked) => handleBookingSelection(bookingLines, !!checked)}
              disabled={!hasUnpaidLines}
            />
          )}
          <h5 className="font-medium text-blue-800">Booking {bookingNumber}</h5>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>First Name: <span className="font-medium">{bookingDetails.firstName || '-'}</span></div>
          <div>Last Name: <span className="font-medium">{bookingDetails.lastName || '-'}</span></div>
          <div>Supplier: {firstLine.supplierName}</div>
          <div>Departure: {firstLine.departureDate || '-'}</div>
          <div>Est. Cost: {formatCurrency(totals.estimatedCost)}</div>
          <div className="flex items-center gap-2">
            Actual Curr.: 
            {isEditingThisBookingCurrency ? (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  value={editingBookingCurrencyValue}
                  onChange={(e) => setEditingBookingCurrencyValue(e.target.value)}
                  className="w-16 h-6 text-xs"
                  placeholder="SEK"
                />
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSaveBookingCurrency(bookingNumber, bookingLines)}
                  className="h-6 w-6 p-0"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelBookingCurrencyEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>{firstLine.currency || 'SEK'}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditBookingCurrency(bookingNumber, firstLine.currency || 'SEK')}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            Actual Cost: 
            {isEditingThisBookingCost ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  value={editingBookingCostValue}
                  onChange={(e) => setEditingBookingCostValue(e.target.value)}
                  className="w-20 h-6 text-xs"
                />
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSaveBookingCost(bookingNumber, bookingLines)}
                  className="h-6 w-6 p-0"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelBookingEdit}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>{formatCurrency(totals.actualCost)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditBookingCost(bookingNumber, totals.actualCost)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
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
            <BookingHeaderRow />
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
                      <BookingSubtotalRow 
                        key={`${supplierKey}-${bookingNumber}`}
                        bookingNumber={bookingNumber} 
                        bookingLines={bookingLines}
                        totals={bookingTotals} 
                      />
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
                  <MobileBookingSubtotal 
                    key={`${supplierKey}-${bookingNumber}`}
                    bookingNumber={bookingNumber} 
                    bookingLines={bookingLines}
                    totals={bookingTotals} 
                  />
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
