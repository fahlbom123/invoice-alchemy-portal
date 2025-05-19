
import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceLine, Supplier } from "@/types/invoice";

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
    
    if (name === 'quantity' || name === 'unitPrice') {
      updatedLine[name] = parseFloat(value) || 0;
    } else {
      // Fix for TS2322 error - use type assertion to tell TypeScript this is a valid key
      (updatedLine as any)[name] = value;
    }
    
    onUpdate(index, updatedLine);
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    onUpdate(index, { 
      ...line, 
      supplierId,
      supplierName: supplier ? supplier.name : ''
    });
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label>Estimated Cost</Label>
          <div className="h-10 px-3 py-2 border rounded-md bg-gray-50 flex items-center">
            {formatCurrency(line.estimatedCost)}
          </div>
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
