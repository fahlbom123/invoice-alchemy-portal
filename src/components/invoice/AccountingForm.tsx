import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface AccountingEntry {
  id: string;
  account: string;
  vatAccount: string;
  amount: number;
  vatAmount: number;
}

interface AccountingFormProps {
  totalAmount: number;
  totalVat: number;
  currency: string;
  disabled?: boolean;
  defaultAccount?: string;
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
  { code: "2610", description: "Input VAT 25%" },
  { code: "2611", description: "Input VAT 12%" },
  { code: "2612", description: "Input VAT 6%" },
  { code: "2615", description: "Input VAT 0%" },
  { code: "2620", description: "VAT on imports" },
  { code: "2640", description: "Deductible VAT" },
];

const AccountingForm = ({ totalAmount, totalVat, currency, disabled = false, defaultAccount = '' }: AccountingFormProps) => {
  const [entries, setEntries] = useState<AccountingEntry[]>([
    { id: '1', account: defaultAccount, vatAccount: '', amount: totalAmount, vatAmount: totalVat }
  ]);

  // Update the first entry when defaults change
  useEffect(() => {
    setEntries(prevEntries => {
      if (prevEntries.length === 0) {
        return [{ id: '1', account: defaultAccount, vatAccount: '', amount: totalAmount, vatAmount: totalVat }];
      }
      
      const updatedEntries = [...prevEntries];
      if (updatedEntries[0]) {
        updatedEntries[0] = {
          ...updatedEntries[0],
          account: defaultAccount,
          amount: totalAmount,
          vatAmount: totalVat
        };
      }
      return updatedEntries;
    });
  }, [defaultAccount, totalAmount, totalVat]);

  const totalEntryAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalVatAmount = entries.reduce((sum, entry) => sum + entry.vatAmount, 0);
  const remainingAmount = totalAmount - totalEntryAmount;
  const remainingVat = totalVat - totalVatAmount;

  const addEntry = () => {
    const newEntry: AccountingEntry = {
      id: Date.now().toString(),
      account: '',
      vatAccount: '',
      amount: 0,
      vatAmount: 0
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof AccountingEntry, value: string | number) => {
    setEntries(entries.map(entry => {
      if (entry.id === id) {
        if (field === 'amount') {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const maxAmount = totalAmount - (totalEntryAmount - entry.amount);
          const clampedAmount = Math.min(Math.max(0, numValue), maxAmount);
          return { ...entry, [field]: clampedAmount };
        } else if (field === 'vatAmount') {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const maxAmount = totalVat - (totalVatAmount - entry.vatAmount);
          const clampedAmount = Math.min(Math.max(0, numValue), maxAmount);
          return { ...entry, [field]: clampedAmount };
        }
        return { ...entry, [field]: String(value) };
      }
      return entry;
    }));
  };

  const isAmountValid = totalEntryAmount <= totalAmount;
  const isVatAmountValid = totalVatAmount <= totalVat;

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <h4 className="font-medium mb-3">Accounting ({currency})</h4>
      
      {/* Summary */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span>Total Amount:</span>
          <span className="font-medium">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total VAT:</span>
          <span className="font-medium">{formatCurrency(totalVat)}</span>
        </div>
        <Separator />
      </div>

      {/* Account and VAT Entries */}
      <div className="space-y-3 mb-4">
        {entries.map((entry, index) => (
          <div key={entry.id} className="bg-white p-3 rounded border">
            <div className="grid grid-cols-12 gap-2 items-center mb-2">
              <div className="col-span-4">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Account</label>
                <Select
                  value={entry.account}
                  onValueChange={(value) => updateEntry(entry.id, 'account', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {costAccounts.map((account) => (
                      <SelectItem key={account.code} value={account.code}>
                        {account.code} - {account.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Amount</label>
                <Input
                  type="number"
                  value={entry.amount}
                  onChange={(e) => updateEntry(entry.id, 'amount', e.target.value)}
                  placeholder="0.00"
                  disabled={disabled}
                  className="text-sm"
                  min="0"
                  max={totalAmount}
                  step="0.01"
                />
              </div>
              <div className="col-span-4"></div>
              <div className="col-span-1 flex justify-center">
                {entries.length > 1 && !disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4">
                <label className="text-xs font-medium text-gray-500 mb-1 block">VAT Account</label>
                <Select
                  value={entry.vatAccount}
                  onValueChange={(value) => updateEntry(entry.id, 'vatAccount', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select VAT account" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {vatAccounts.map((account) => (
                      <SelectItem key={account.code} value={account.code}>
                        {account.code} - {account.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3">
                <label className="text-xs font-medium text-gray-500 mb-1 block">VAT Amount</label>
                <Input
                  type="number"
                  value={entry.vatAmount}
                  onChange={(e) => updateEntry(entry.id, 'vatAmount', e.target.value)}
                  placeholder="0.00"
                  disabled={disabled}
                  className="text-sm"
                  min="0"
                  max={totalVat}
                  step="0.01"
                />
              </div>
              <div className="col-span-5"></div>
            </div>
          </div>
        ))}
        
        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={addEntry}
            className="mt-2"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Entry
          </Button>
        )}

        {/* Totals */}
        <Separator className="my-3" />
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-7 gap-2">
            <div className="col-span-2 font-medium">Total Allocated:</div>
            <div className={`col-span-2 font-medium ${isAmountValid ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalEntryAmount)}
            </div>
            <div className={`col-span-2 font-medium ${isVatAmountValid ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalVatAmount)}
            </div>
            <div className="col-span-1"></div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            <div className="col-span-2 font-medium">Remaining:</div>
            <div className={`col-span-2 font-medium ${remainingAmount >= 0 ? "text-gray-600" : "text-red-600"}`}>
              {formatCurrency(remainingAmount)}
            </div>
            <div className={`col-span-2 font-medium ${remainingVat >= 0 ? "text-gray-600" : "text-red-600"}`}>
              {formatCurrency(remainingVat)}
            </div>
            <div className="col-span-1"></div>
          </div>
          
          {(!isAmountValid || !isVatAmountValid) && (
            <div className="text-xs text-red-600 mt-1">
              Total allocated amounts cannot exceed invoice totals
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingForm;
