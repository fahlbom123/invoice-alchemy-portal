
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface AccountingEntry {
  id: string;
  account: string;
  amount: number;
}

interface AccountingFormProps {
  totalAmount: number;
  totalVat: number;
  currency: string;
  disabled?: boolean;
  defaultAccount?: string;
}

const AccountingForm = ({ totalAmount, totalVat, currency, disabled = false, defaultAccount = '' }: AccountingFormProps) => {
  const [entries, setEntries] = useState<AccountingEntry[]>([
    { id: '1', account: defaultAccount, amount: totalAmount }
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

  const totalEntryAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingAmount = totalAmount - totalEntryAmount;

  const addEntry = () => {
    const newEntry: AccountingEntry = {
      id: Date.now().toString(),
      account: '',
      amount: 0
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(entry => entry.id !== id));
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

  const isAmountValid = totalEntryAmount <= totalAmount;

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
      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600">
          <div className="col-span-6">Account</div>
          <div className="col-span-5">Amount</div>
          <div className="col-span-1"></div>
        </div>
        
        {entries.map((entry, index) => (
          <div key={entry.id} className="grid grid-cols-12 gap-2">
            <div className="col-span-6">
              <Input
                value={entry.account}
                onChange={(e) => updateEntry(entry.id, 'account', e.target.value)}
                placeholder="Account number or name"
                disabled={disabled}
                className="text-sm"
              />
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
      </div>

      {/* Totals */}
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
  );
};

export default AccountingForm;
