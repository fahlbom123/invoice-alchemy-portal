import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceLine } from "@/types/invoice";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Extend InvoiceLine to include invoice reference
interface SearchResultLine extends InvoiceLine {
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
}

interface InvoiceLineSearchResultsProps {
  invoiceLines: SearchResultLine[];
  onRegister?: (selectedLines: SearchResultLine[], totals: { totalActualCost: number; totalActualVat: number; }) => void;
}

const InvoiceLineSearchResults = ({ invoiceLines, onRegister }: InvoiceLineSearchResultsProps) => {
  const navigate = useNavigate();
  const [lines, setLines] = useState<SearchResultLine[]>(invoiceLines);
  const [selectedLines, setSelectedLines] = useState<SearchResultLine[]>([]);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerCostValue, setRegisterCostValue] = useState<string>("");
  const [registerVatValue, setRegisterVatValue] = useState<string>("");
  const [registerCostLineId, setRegisterCostLineId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<string>("");
  const [editingVat, setEditingVat] = useState<string>("");

  const handleSelectLine = (id: string, checked: boolean) => {
    setLines(currentLines => 
      currentLines.map(line => {
        if (line.id === id) {
          const updatedLine = { ...line, selected: checked };
          
          // When checking a line, set actual cost and VAT to estimated values
          if (checked) {
            updatedLine.actualCost = line.estimatedCost;
            updatedLine.actualVat = line.estimatedVat;
          }
          
          return updatedLine;
        }
        return line;
      })
    );

    const updatedSelectedLines = lines.filter(line => 
      line.id === id ? checked : line.selected
    );
    setSelectedLines(updatedSelectedLines);
  };

  const handleSelectAll = (checked: boolean) => {
    setLines(currentLines => 
      currentLines.map(line => {
        const updatedLine = { ...line, selected: checked };
        
        // When checking all lines, set actual cost and VAT to estimated values
        if (checked) {
          updatedLine.actualCost = line.estimatedCost;
          updatedLine.actualVat = line.estimatedVat;
        }
        
        return updatedLine;
      })
    );
    
    setSelectedLines(checked ? [...lines] : []);
  };

  // Calculate totals for selected lines
  const calculateSelectedTotals = () => {
    const selectedLinesData = lines.filter(line => line.selected);
    
    const totalEstimatedCost = selectedLinesData.reduce((sum, line) => sum + line.estimatedCost, 0);
    const totalEstimatedVat = selectedLinesData.reduce((sum, line) => {
      if (line.estimatedVat) {
        return sum + (line.estimatedCost * line.estimatedVat) / 100;
      }
      return sum;
    }, 0);

    const totalActualCost = selectedLinesData.reduce((sum, line) => {
      return sum + (line.actualCost || 0);
    }, 0);
    
    const totalActualVat = selectedLinesData.reduce((sum, line) => {
      if (line.actualCost && line.actualVat) {
        return sum + (line.actualCost * line.actualVat) / 100;
      }
      return sum;
    }, 0);

    return {
      totalEstimatedCost,
      totalEstimatedVat,
      totalActualCost,
      totalActualVat,
      count: selectedLinesData.length
    };
  };

  const { totalEstimatedCost, totalEstimatedVat, totalActualCost, totalActualVat, count } = calculateSelectedTotals();

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
  
  // Calculate cost difference
  const calculateCostDifference = (estimated: number, actual?: number) => {
    if (actual === undefined) return null;
    
    const diff = actual - estimated;
    const formattedDiff = formatCurrency(Math.abs(diff), undefined);
    
    if (diff > 0) {
      return <span className="text-red-500">+{formattedDiff}</span>;
    } else if (diff < 0) {
      return <span className="text-green-500">-{formattedDiff}</span>;
    }
    return <span>0</span>;
  };

  // Calculate VAT amount (changed to display as currency)
  const calculateVatAmount = (cost: number, vatRate?: number) => {
    if (vatRate === undefined) return "-";
    return formatCurrency((cost * vatRate) / 100, undefined);
  };

  const handleEditActualCost = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (line) {
      setEditingLine(lineId);
      setEditingCost(line.actualCost?.toString() || "");
      setEditingVat(line.actualVat?.toString() || "");
    }
  };

  const handleSaveActualCost = (lineId: string) => {
    if (!editingCost && !editingVat) return;

    const actualCost = editingCost ? parseFloat(editingCost) : undefined;
    const actualVat = editingVat ? parseFloat(editingVat) : undefined;

    setLines(currentLines => 
      currentLines.map(line => 
        line.id === lineId 
          ? { ...line, actualCost, actualVat } 
          : line
      )
    );

    toast.success("Actual cost and VAT saved successfully");
    setEditingLine(null);
    setEditingCost("");
    setEditingVat("");
  };

  const handleCancelEdit = () => {
    setEditingLine(null);
    setEditingCost("");
    setEditingVat("");
  };

  const handleRegisterCost = (lineId: string) => {
    setRegisterCostLineId(lineId);
    setIsRegistering(true);

    // Get current values to pre-fill
    const line = lines.find(l => l.id === lineId);
    if (line) {
      setRegisterCostValue(line.actualCost?.toString() || line.estimatedCost.toString());
      setRegisterVatValue(line.actualVat?.toString() || "");
    }
  };

  const handleSaveRegisteredCost = () => {
    if (!registerCostLineId || !registerCostValue) return;

    const actualCost = parseFloat(registerCostValue);
    const actualVat = registerVatValue ? parseFloat(registerVatValue) : undefined;

    setLines(currentLines => 
      currentLines.map(line => 
        line.id === registerCostLineId 
          ? { ...line, actualCost, actualVat } 
          : line
      )
    );

    toast.success("Cost registered successfully");
    setIsRegistering(false);
    setRegisterCostLineId(null);
    setRegisterCostValue("");
    setRegisterVatValue("");
  };

  const handleRegisterMultipleInvoices = () => {
    if (selectedLines.length === 0) {
      toast.error("Please select at least one invoice line");
      return;
    }
    
    // Call the onRegister callback with selected lines and totals
    if (onRegister) {
      onRegister(selectedLines, { totalActualCost, totalActualVat });
    }
    
    toast.success(`Registered ${selectedLines.length} invoice lines`);
  };

  // New function to toggle fully paid status
  const handleToggleFullyPaid = (lineId: string, isPaid: boolean) => {
    setLines(currentLines => 
      currentLines.map(line => 
        line.id === lineId 
          ? { ...line, paymentStatus: isPaid ? "paid" : "unpaid" } 
          : line
      )
    );
    
    toast.success(`Payment status ${isPaid ? 'marked as paid' : 'marked as unpaid'}`);
  };

  const hasSelectedLines = selectedLines.length > 0;
  
  return (
    <div>
      {isRegistering && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Register Actual Cost</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="actualCost">Actual Cost</Label>
                <Input
                  id="actualCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={registerCostValue}
                  onChange={(e) => setRegisterCostValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualVat">Actual VAT</Label>
                <Input
                  id="actualVat"
                  type="number"
                  min="0"
                  step="0.01"
                  value={registerVatValue}
                  onChange={(e) => setRegisterVatValue(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRegistering(false);
                  setRegisterCostLineId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRegisteredCost}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {hasSelectedLines && (
        <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="font-medium block">{count} lines selected</span>
              <div className="text-sm grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Total Estimated Cost:</span>
                    <span className="font-medium">{formatCurrency(totalEstimatedCost, undefined)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Total Estimated VAT:</span>
                    <span className="font-medium">{formatCurrency(totalEstimatedVat, undefined)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Total Actual Cost:</span>
                    <span className="font-medium">{formatCurrency(totalActualCost, undefined)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">Total Actual VAT:</span>
                    <span className="font-medium">{formatCurrency(totalActualVat, undefined)}</span>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleRegisterMultipleInvoices}>
              Register Supplier Invoice
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  onCheckedChange={(checked) => handleSelectAll(!!checked)} 
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
              <TableRow key={line.id}>
                <TableCell>
                  <Checkbox 
                    checked={line.selected} 
                    onCheckedChange={(checked) => handleSelectLine(line.id, !!checked)} 
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
                  {editingLine === line.id ? (
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
                        onClick={() => handleSaveActualCost(line.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-blue-50 transition-colors p-1 rounded"
                      onClick={() => handleEditActualCost(line.id)}
                      title="Click to edit actual cost"
                    >
                      {line.actualCost ? formatCurrency(line.actualCost, undefined) : "Click to edit"}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingLine === line.id ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingVat}
                      onChange={(e) => setEditingVat(e.target.value)}
                      className="w-24"
                      placeholder="VAT %"
                    />
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-blue-50 transition-colors p-1 rounded"
                      onClick={() => handleEditActualCost(line.id)}
                      title="Click to edit actual VAT"
                    >
                      {line.actualVat && line.actualCost 
                        ? formatCurrency((line.actualCost * line.actualVat) / 100, undefined) 
                        : "Click to edit"}
                    </div>
                  )}
                </TableCell>
                <TableCell>{calculateCostDifference(line.estimatedCost, line.actualCost)}</TableCell>
                <TableCell>
                  {renderPaymentStatusBadge(line.paymentStatus)}
                </TableCell>
                <TableCell>
                  <Switch 
                    checked={line.paymentStatus === "paid"}
                    onCheckedChange={(checked) => handleToggleFullyPaid(line.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  {line.invoiceId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/invoices/${line.invoiceId}?from=search`)}
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
    </div>
  );
};

export default InvoiceLineSearchResults;
