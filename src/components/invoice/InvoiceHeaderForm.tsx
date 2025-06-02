
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

const costAccounts = [
  { code: "4010", description: "Purchase of goods" },
  { code: "4020", description: "Domestic purchase of goods" },
  { code: "4050", description: "Purchase of goods from EU" },
  { code: "4531", description: "Purchase of services outside EU" },
  { code: "5460", description: "Consumables / Supplies" },
  { code: "6110", description: "Office supplies" },
  { code: "6540", description: "IT services" },
];

const vatAccounts = [
  { code: "2641", description: "Input VAT" },
  { code: "2614", description: "Output VAT (reverse charge)" },
  { code: "2645", description: "Calculated input VAT (reverse charge)" },
];

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const InvoiceHeaderForm = ({
  formData,
  handleInputChange,
  handleNumberInputChange,
  handleSelectChange,
}: InvoiceHeaderFormProps) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

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
        <Label htmlFor="costAccount">Cost Account</Label>
        <Select
          value={formData.account || "4010"}
          onValueChange={(value) => handleSelectChange('account', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select cost account" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {costAccounts.map((account) => (
              <SelectItem key={account.code} value={account.code}>
                {account.code} - {account.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vatAccount">VAT Account</Label>
        <Select
          value={formData.vatAccount || "2641"}
          onValueChange={(value) => handleSelectChange('vatAccount', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select VAT account" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {vatAccounts.map((account) => (
              <SelectItem key={account.code} value={account.code}>
                {account.code} - {account.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodizationYear">Periodization Year</Label>
        <Select
          value={formData.periodizationYear?.toString() || currentYear.toString()}
          onValueChange={(value) => handleSelectChange('periodizationYear', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="periodizationMonth">Periodization Month</Label>
        <Select
          value={formData.periodizationMonth?.toString() || (new Date().getMonth() + 1).toString()}
          onValueChange={(value) => handleSelectChange('periodizationMonth', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value.toString()}>
                {month.label}
              </SelectItem>
            ))}
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
