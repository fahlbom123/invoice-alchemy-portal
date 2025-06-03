
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceLine, Supplier } from "@/types/invoice";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface InvoiceLineFormProps {
  line: InvoiceLine;
  index: number;
  onUpdate: (index: number, line: InvoiceLine) => void;
  onRemove: (index: number) => void;
  suppliers: Supplier[];
}

const InvoiceLineForm = ({ 
  line, 
  index, 
  onUpdate, 
  onRemove, 
  suppliers 
}: InvoiceLineFormProps) => {
  
  // Calculate the estimated cost whenever quantity or unit price changes
  useEffect(() => {
    const estimatedCost = line.quantity * line.unitPrice;
    if (estimatedCost !== line.estimatedCost) {
      onUpdate(index, { ...line, estimatedCost });
    }
  }, [line.quantity, line.unitPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedLine = { ...line };
    
    if (name === 'quantity' || name === 'unitPrice' || name === 'actualCost') {
      updatedLine[name as keyof Pick<InvoiceLine, 'quantity' | 'unitPrice' | 'actualCost'>] = parseFloat(value) || 0;
    } else {
      // Use type assertion to ensure TypeScript understands this is a valid key
      (updatedLine as any)[name] = value;
    }
    
    onUpdate(index, updatedLine);
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    onUpdate(index, { 
      ...line, 
      supplierId,
      supplierName: supplier ? supplier.name : '',
      currency: supplier?.defaultCurrency || line.currency || 'USD'
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    onUpdate(index, { ...line, [name]: value });
  };

  const handleInvoiceTypeChange = (value: string) => {
    onUpdate(index, { ...line, invoiceType: value as "single" | "multi" });
  };

  const handleFullyInvoicedChange = (value: string) => {
    onUpdate(index, { ...line, fullyInvoiced: value === "yes" });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor={`description-${index}`}>Description</Label>
          <Input
            id={`description-${index}`}
            name="description"
            value={line.description}
            onChange={handleInputChange}
            placeholder="Item description"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`quantity-${index}`}>Quantity</Label>
          <Input
            id={`quantity-${index}`}
            name="quantity"
            type="number"
            min="1"
            step="1"
            value={line.quantity}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`unitPrice-${index}`}>Unit Price</Label>
          <Input
            id={`unitPrice-${index}`}
            name="unitPrice"
            type="number"
            min="0"
            step="0.01"
            value={line.unitPrice}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor={`supplierId-${index}`}>Line Item Supplier</Label>
          <Select
            value={line.supplierId}
            onValueChange={handleSupplierChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(supplier => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`supplierPartNumber-${index}`}>Supplier Part Number</Label>
          <Input
            id={`supplierPartNumber-${index}`}
            name="supplierPartNumber"
            value={line.supplierPartNumber}
            onChange={handleInputChange}
            placeholder="SKU or part number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`currency-${index}`}>Currency</Label>
          <Select
            value={line.currency || "USD"}
            onValueChange={(value) => handleSelectChange('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SEK">SEK</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor={`estimatedCost-${index}`}>Estimated Cost</Label>
          <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center">
            {formatCurrency(line.estimatedCost)}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`actualCost-${index}`}>Actual Cost</Label>
          <Input
            id={`actualCost-${index}`}
            name="actualCost"
            type="number"
            min="0"
            step="0.01"
            value={line.actualCost || ""}
            onChange={handleInputChange}
            placeholder="Actual cost if different"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`invoiceType-${index}`}>Invoice Type</Label>
          <Select
            value={line.invoiceType || "single"}
            onValueChange={handleInvoiceTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="multi">Multi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <Label>Fully Invoiced</Label>
          <RadioGroup
            value={line.fullyInvoiced ? "yes" : "no"}
            onValueChange={handleFullyInvoicedChange}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`fully-invoiced-yes-${index}`} />
              <Label htmlFor={`fully-invoiced-yes-${index}`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`fully-invoiced-no-${index}`} />
              <Label htmlFor={`fully-invoiced-no-${index}`}>No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <div className="flex justify-end mt-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => onRemove(index)}
        >
          Remove Line
        </Button>
      </div>
    </div>
  );
};

export default InvoiceLineForm;
