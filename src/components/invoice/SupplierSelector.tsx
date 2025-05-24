
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Supplier } from "@/types/invoice";

interface SupplierSelectorProps {
  supplierId: string;
  suppliers: Supplier[];
  onSelectSupplier: (supplierId: string) => void;
}

const SupplierSelector = ({ 
  supplierId, 
  suppliers, 
  onSelectSupplier 
}: SupplierSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="supplierId">Supplier</Label>
      <Select
        value={supplierId}
        onValueChange={onSelectSupplier}
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
  );
};

export default SupplierSelector;
