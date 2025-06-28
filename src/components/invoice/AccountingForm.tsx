
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
  amount: number;
}

interface VatEntry {
  id: string;
  vatAccount: string;
  amount: number;
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
    { id: '1', account: defaultAccount, amount: totalAmount }
  ]);

  const [vatEntries, setVatEntries] = useState<VatEntry[]>([
    { id: '1', vatAccount: '', amount: totalVat }
  ]);

  // Update the first entry when defaultAccount or totalAmount changes
  useEffect(() => {
    setEntries(prevEntries => {
      if (prevEntries.length === 0) {
        return [{ id: '1', account: defaultAccount, amount: totalAmount }];
      }
      
      // Update the first entry with new defaults
      const updatedEntries = [...prevEntries];
      if (updatedEntries[0]) {
        updatedEntries[0] = {
          ...updatedEntries[0],
          account: defaultAccount,
          amount: totalAmount
        };
      }
      return updatedEntries;
    });
  }, [defaultAccount, totalAmount]);

  // Update the first VAT entry when totalVat changes
  useEffect(() => {
    setVatEntries(prevEntries => {
      if (prevEntries.length === 0) {
        return [{ id: '1', vatAccount: '', amount: totalVat }];
      }
      
      // Update the first entry with new defaults
      const updatedEntries = [...prevEntries];
      if (updatedEntries[0]) {
        updatedEntries[0] = {
          ...updatedEntries[0],
          amount: totalVat
        };
      }
      return updatedEntries;
    });
  }, [totalVat]);

  const totalEntryAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingAmount = totalAmount - totalEntryAmount;

  const totalVatEntryAmount = vatEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingVatAmount = totalVat - totalVatEntryAmount;

  const addEntry = () => {
    const newEntry: AccountingEntry = {
      id: Date.now().toString(),
      account: '',
      amount: 0
    };
    setEntries([...entries, newEntry]);
  };

  const addVatEntry = () => {
    const newEntry: VatEntry = {
      id: Date.now().toString(),
      vatAccount: '',
      amount: 0
    };
    setVatEntries([...vatEntries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const removeVatEntry = (id: string) => {
    if (vatEntries.length > 1) {
      setVatEntries(vatEntries.filter(entry => entry.id !== id));
    }
  };

  const updateEntry = (id: string, field: 'account' | 'amount', value: string | number) => {
    setEntries(entries.map(entry => {
      if (entry.id === id) {
        if (field === 'amount') {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          // Prevent individual entry from exceeding total amount
          const maxAmount = totalAmount - (totalEntryAmount - entry.amount);
          const clampedAmount = Math.min(Math.max(0, numValue), maxAmount);
          return { ...entry, [field]: clampedAmount };
        }
        // Ensure account field is always a string
        return { ...entry, [field]: String(value) };
      }
      return entry;
    }));
  };

  const updateVatEntry = (id: string, field: 'vatAccount' | 'amount', value: string | number) => {
    setVatEntries(vatEntries.map(entry => {
      if (entry.id === id) {
        if (field === 'amount') {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          // Prevent individual entry from exceeding total VAT amount
          const maxAmount = totalVat - (totalVatEntryAmount - entry.amount);
          const clampedAmount = Math.min(Math.max(0, numValue), maxAmount);
          return { ...entry, [field]: clampedAmount };
        }
        // Ensure vatAccount field is always a string
        return { ...entry, [field]: String(value) };
      }
      return entry;
    }));
  };

  const isAmountValid = totalEntryAmount <= totalAmount;
  const isVatAmountValid = totalVatEntryAmount <= totalVat;

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

      {/* Account Entries */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
          <div className="col-span-6">Account</div>
          <div className="col-span-5">Amount</div>
          <div className="col-span-1"></div>
        </div>
        
        {entries.map((entry, index) => (
          <div key={entry.id} className="grid grid-cols-12 gap-2">
            <div className="col-span-6">
              <Select
                value={entry.account}
                onValueChange={(value) => updateEntry(entry.id, 'account', value)}
                disabled={disabled}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select account" />
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
            <div className="col-span-5">
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
            <div className="col-span-1">
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
        ))}
        
        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={addEntry}
            className="mt-2"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Account
          </Button>
        )}

        {/* Totals for Accounts */}
        <Separator className="my-3" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-medium">
            <span>Total Allocated:</span>
            <span className={isAmountValid ? "text-green-600" : "text-red-600"}>
              {formatCurrency(totalEntryAmount)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Remaining:</span>
            <span className={remainingAmount >= 0 ? "text-gray-600" : "text-red-600"}>
              {formatCurrency(remainingAmount)}
            </span>
          </div>
          {!isAmountValid && (
            <div className="text-xs text-red-600 mt-1">
              Total allocated amount cannot exceed the invoice total
            </div>
          )}
        </div>
      </div>

      {/* VAT Entries */}
      <div className="space-y-3">
        <h5 className="font-medium text-sm">VAT Allocation</h5>
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
          <div className="col-span-6">VAT Account</div>
          <div className="col-span-5">VAT Amount</div>
          <div className="col-span-1"></div>
        </div>
        
        {vatEntries.map((entry, index) => (
          <div key={entry.id} className="grid grid-cols-12 gap-2">
            <div className="col-span-6">
              <Select
                value={entry.vatAccount}
                onValueChange={(value) => updateVatEntry(entry.id, 'vatAccount', value)}
                disabled={disabled}
              >
                <SelectTrigger className="text-sm">
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
            <div className="col-span-5">
              <Input
                type="number"
                value={entry.amount}
                onChange={(e) => updateVatEntry(entry.id, 'amount', e.target.value)}
                placeholder="0.00"
                disabled={disabled}
                className="text-sm"
                min="0"
                max={totalVat}
                step="0.01"
              />
            </div>
            <div className="col-span-1">
              {vatEntries.length > 1 && !disabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeVatEntry(entry.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {!disabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={addVatEntry}
            className="mt-2"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add VAT Account
          </Button>
        )}

        {/* Totals for VAT */}
        <Separator className="my-3" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-medium">
            <span>Total VAT Allocated:</span>
            <span className={isVatAmountValid ? "text-green-600" : "text-red-600"}>
              {formatCurrency(totalVatEntryAmount)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Remaining VAT:</span>
            <span className={remainingVatAmount >= 0 ? "text-gray-600" : "text-red-600"}>
              {formatCurrency(remainingVatAmount)}
            </span>
          </div>
          {!isVatAmountValid && (
            <div className="text-xs text-red-600 mt-1">
              Total allocated VAT amount cannot exceed the invoice VAT total
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingForm;
