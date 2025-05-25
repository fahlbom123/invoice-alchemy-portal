import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

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
  
  // Local state to track the toggle state for immediate UI feedback
  const [localPaymentStatus, setLocalPaymentStatus] = useState(line.paymentStatus);
  
  // Update local state when line prop changes
  useEffect(() => {
    setLocalPaymentStatus(line.paymentStatus);
  }, [line.paymentStatus]);

  // Check if line is paid and should be disabled for editing
  const isPaid = localPaymentStatus === "paid";

  // Generate consistent booking number if not provided (max 8 figures)
  const getBookingNumber = () => {
    if (line.bookingNumber) return line.bookingNumber;
    
    // Generate a consistent 8-digit booking number based on line ID
    const seed = line.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const number = Math.abs(seed) % 90000000;
    return (10000000 + number).toString();
  };

  // Function to handle immediate payment status change and persistence
  const handlePaymentStatusChange = async (isPaid: boolean) => {
    const newStatus = isPaid ? "paid" : "unpaid";
    
    // Update local state immediately for instant UI feedback
    setLocalPaymentStatus(newStatus);
    
    try {
      // Get current invoices from localStorage
      const storedInvoices = localStorage.getItem('invoices');
      if (!storedInvoices) {
        toast.error("No invoices found in storage");
        // Revert local state on error
        setLocalPaymentStatus(line.paymentStatus);
        return;
      }
      
      const invoices = JSON.parse(storedInvoices);
      
      // Find and update the invoice line
      const updatedInvoices = invoices.map((inv: any) => {
        const hasUpdatedLine = inv.invoiceLines.some((invLine: any) => invLine.id === line.id);
        
        if (hasUpdatedLine) {
          const updatedInvoiceLines = inv.invoiceLines.map((invLine: any) => {
            return invLine.id === line.id 
              ? { ...invLine, paymentStatus: newStatus }
              : invLine;
          });
          
          return {
            ...inv,
            invoiceLines: updatedInvoiceLines,
            updatedAt: new Date().toISOString(),
          };
        }
        
        return inv;
      });
      
      // Save back to localStorage
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('invoicesUpdated'));
      
      // Call the parent component's handler to update the UI
      onToggleFullyPaid(line.id, isPaid);
      
      toast.success(`Payment status updated to ${isPaid ? 'paid' : 'unpaid'} and saved`);
      
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Failed to save payment status change");
      // Revert local state on error
      setLocalPaymentStatus(line.paymentStatus);
    }
  };

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
              disabled={isPaid}
            />
            <div>
              <div className="font-medium text-sm">{line.invoiceNumber}</div>
              <div className="text-xs text-gray-500">{line.supplierName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {renderPaymentStatusBadge(localPaymentStatus)}
            <Switch 
              checked={localPaymentStatus === "paid"}
              onCheckedChange={handlePaymentStatusChange}
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

          <div>
            <span className="text-gray-500">Booking:</span>
            <div>{getBookingNumber()}</div>
          </div>

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
              <div className="text-sm">{formatCurrency(line.estimatedVat || 0, undefined)}</div>
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
                    disabled={isPaid}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSaveActualCost(line.id)}
                    className="h-8 w-8 p-0"
                    disabled={isPaid}
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
                  className={`transition-colors p-1 rounded text-sm font-medium ${
                    isPaid 
                      ? "text-gray-500 cursor-not-allowed" 
                      : "cursor-pointer hover:bg-blue-50"
                  }`}
                  onClick={() => !isPaid && onEditActualCost(`${line.id}-cost`)}
                  title={isPaid ? "Cannot edit - invoice is paid" : "Click to edit actual cost"}
                >
                  {line.actualCost ? formatCurrency(line.actualCost, undefined) : (isPaid ? "Locked" : "Click to edit")}
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
                    disabled={isPaid}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSaveActualCost(line.id)}
                    className="h-8 w-8 p-0"
                    disabled={isPaid}
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
                  className={`transition-colors p-1 rounded text-sm ${
                    isPaid 
                      ? "text-gray-500 cursor-not-allowed" 
                      : "cursor-pointer hover:bg-blue-50"
                  }`}
                  onClick={() => !isPaid && onEditActualCost(`${line.id}-vat`)}
                  title={isPaid ? "Cannot edit - invoice is paid" : "Click to edit actual VAT"}
                >
                  {line.actualVat ? formatCurrency(line.actualVat, undefined) : (isPaid ? "Locked" : "Click to edit")}
                </div>
              )}
            </div>
          </div>

          {/* Registered amounts for mobile */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <span className="text-gray-500 text-xs">Registered Cost:</span>
              <div className="text-sm font-medium">
                {line.registeredActualCost ? formatCurrency(line.registeredActualCost, undefined) : "-"}
              </div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Registered VAT:</span>
              <div className="text-sm">
                {line.registeredActualVat ? formatCurrency(line.registeredActualVat, undefined) : "-"}
              </div>
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
          disabled={isPaid}
        />
      </TableCell>
      <TableCell>{line.invoiceNumber}</TableCell>
      <TableCell>{line.description}</TableCell>
      <TableCell>{line.supplierName}</TableCell>
      <TableCell>{getBookingNumber()}</TableCell>
      <TableCell>{line.confirmationNumber}</TableCell>
      <TableCell>{line.departureDate}</TableCell>
      <TableCell>{line.quantity}</TableCell>
      <TableCell>{line.currency || "USD"}</TableCell>
      <TableCell className="font-medium">
        {formatCurrency(line.estimatedCost, undefined)}
      </TableCell>
      <TableCell>
        {formatCurrency(line.estimatedVat || 0, undefined)}
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
              disabled={isPaid}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSaveActualCost(line.id)}
              disabled={isPaid}
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
            className={`transition-colors p-1 rounded ${
              isPaid 
                ? "text-gray-500 cursor-not-allowed" 
                : "cursor-pointer hover:bg-blue-50"
            }`}
            onClick={() => !isPaid && onEditActualCost(`${line.id}-cost`)}
            title={isPaid ? "Cannot edit - invoice is paid" : "Click to edit actual cost"}
          >
            {line.actualCost ? formatCurrency(line.actualCost, undefined) : (isPaid ? "Locked" : "Click to edit")}
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
              disabled={isPaid}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSaveActualCost(line.id)}
              disabled={isPaid}
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
            className={`transition-colors p-1 rounded ${
              isPaid 
                ? "text-gray-500 cursor-not-allowed" 
                : "cursor-pointer hover:bg-blue-50"
            }`}
            onClick={() => !isPaid && onEditActualCost(`${line.id}-vat`)}
            title={isPaid ? "Cannot edit - invoice is paid" : "Click to edit actual VAT"}
          >
            {line.actualVat ? formatCurrency(line.actualVat, undefined) : (isPaid ? "Locked" : "Click to edit")}
          </div>
        )}
      </TableCell>
      <TableCell>
        {line.registeredActualCost ? formatCurrency(line.registeredActualCost, undefined) : "-"}
      </TableCell>
      <TableCell>
        {line.registeredActualVat ? formatCurrency(line.registeredActualVat, undefined) : "-"}
      </TableCell>
      <TableCell>
        {renderPaymentStatusBadge(localPaymentStatus)}
      </TableCell>
      <TableCell>
        <Switch 
          checked={localPaymentStatus === "paid"}
          onCheckedChange={handlePaymentStatusChange}
        />
      </TableCell>
    </TableRow>
  );
};

export default SearchResultRow;
