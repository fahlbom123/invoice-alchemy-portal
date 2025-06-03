
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { SupplierInvoiceLine } from "@/types/invoice";

interface BookingSummaryPopoverProps {
  bookingNumber: string;
  children: React.ReactNode;
  allSupplierInvoiceLines: SupplierInvoiceLine[];
  getEstimatedCostsForBooking: (bookingNumber: string) => {
    estimatedCost: number;
    estimatedVat: number;
    currency: string;
  };
}

const BookingSummaryPopover = ({ 
  bookingNumber, 
  children, 
  allSupplierInvoiceLines,
  getEstimatedCostsForBooking 
}: BookingSummaryPopoverProps) => {
  // Get estimated costs for this booking
  const estimatedCosts = getEstimatedCostsForBooking(bookingNumber);
  
  // Get all supplier invoice lines for this booking across all supplier invoices
  const bookingSupplierLines = allSupplierInvoiceLines.filter(line => {
    // You'll need to implement getBookingNumberForSupplierLine function or pass it as prop
    // For now, assuming we can match by some logic
    return true; // This needs proper implementation based on your existing logic
  });
  
  // Calculate total registered amounts from all supplier invoices for this booking
  const totalRegisteredCost = bookingSupplierLines.reduce((sum, line) => sum + line.actualCost, 0);
  const totalRegisteredVat = bookingSupplierLines.reduce((sum, line) => sum + line.actualVat, 0);
  
  // Get unique suppliers for this booking
  const suppliers = [...new Set(bookingSupplierLines.map(line => line.supplierName))];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[100] bg-white border shadow-lg">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Booking Summary</CardTitle>
            <p className="text-sm text-gray-600">Booking: {bookingNumber}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Suppliers */}
            <div>
              <h4 className="font-medium text-sm mb-2">Suppliers</h4>
              <div className="space-y-1">
                {suppliers.length > 0 ? (
                  suppliers.map((supplier, index) => (
                    <p key={index} className="text-sm text-gray-700">{supplier}</p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No suppliers found</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Estimated Amounts */}
            <div>
              <h4 className="font-medium text-sm mb-2">Total Estimated Amount</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Cost:</span>
                  <span className="text-blue-600">
                    {estimatedCosts.currency} {formatCurrency(estimatedCosts.estimatedCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT:</span>
                  <span className="text-blue-600">
                    {estimatedCosts.currency} {formatCurrency(estimatedCosts.estimatedVat)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-1">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    {estimatedCosts.currency} {formatCurrency(estimatedCosts.estimatedCost + estimatedCosts.estimatedVat)}
                  </span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Registered Amounts */}
            <div>
              <h4 className="font-medium text-sm mb-2">Total Registered Amount</h4>
              <p className="text-xs text-gray-500 mb-2">From all supplier invoices</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Cost:</span>
                  <span className="text-green-600">
                    {estimatedCosts.currency} {formatCurrency(totalRegisteredCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>VAT:</span>
                  <span className="text-green-600">
                    {estimatedCosts.currency} {formatCurrency(totalRegisteredVat)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-1">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {estimatedCosts.currency} {formatCurrency(totalRegisteredCost + totalRegisteredVat)}
                  </span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Summary */}
            <div>
              <h4 className="font-medium text-sm mb-2">Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Difference:</span>
                  <span className={`${
                    (totalRegisteredCost + totalRegisteredVat) - (estimatedCosts.estimatedCost + estimatedCosts.estimatedVat) > 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {estimatedCosts.currency} {formatCurrency(
                      Math.abs((totalRegisteredCost + totalRegisteredVat) - (estimatedCosts.estimatedCost + estimatedCosts.estimatedVat))
                    )}
                    {(totalRegisteredCost + totalRegisteredVat) - (estimatedCosts.estimatedCost + estimatedCosts.estimatedVat) > 0 ? ' over' : ' under'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Invoice lines:</span>
                  <span className="text-gray-600">{bookingSupplierLines.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default BookingSummaryPopover;
