
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceFormData } from "@/types/invoice";

interface InvoiceHeaderFormProps {
  formData: InvoiceFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNumberInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

const InvoiceHeaderForm = ({
  formData,
  handleInputChange,
  handleNumberInputChange,
  handleSelectChange,
}: InvoiceHeaderFormProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="invoiceNumber">Invoice Number</Label>
        <Input
          id="invoiceNumber"
          name="invoiceNumber"
          value={formData.invoiceNumber}
          onChange={handleInputChange}
          placeholder="INV-001"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference (Optional)</Label>
        <Input
          id="reference"
          name="reference"
          value={formData.reference}
          onChange={handleInputChange}
          placeholder="Purchase Order #"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoiceDate">Invoice Date</Label>
        <Input
          id="invoiceDate"
          name="invoiceDate"
          type="date"
          value={formData.invoiceDate}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Payment Date</Label>
        <Input
          id="dueDate"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleSelectChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={formData.currency || "USD"}
          onValueChange={(value) => handleSelectChange('currency', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
            <SelectItem value="CAD">CAD</SelectItem>
            <SelectItem value="AUD">AUD</SelectItem>
            <SelectItem value="JPY">JPY</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="totalAmount">Total Amount incl VAT</Label>
        <Input
          id="totalAmount"
          name="totalAmount"
          type="number"
          min="0"
          step="0.01"
          value={formData.totalAmount || ""}
          onChange={handleNumberInputChange}
          placeholder="0.00"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="totalVat">Total VAT</Label>
        <Input
          id="totalVat"
          name="totalVat"
          type="number"
          min="0"
          step="0.01"
          value={formData.totalVat || ""}
          onChange={handleNumberInputChange}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ocr">OCR</Label>
        <Input
          id="ocr"
          name="ocr"
          value={formData.ocr || ""}
          onChange={handleInputChange}
          placeholder="OCR number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Additional notes..."
        />
      </div>
    </div>
  );
};

export default InvoiceHeaderForm;
