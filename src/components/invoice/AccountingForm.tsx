
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface AccountEntry {
  id: string;
  account: string;
  amount: number;
}

interface VatEntry {
  id: string;
  vatAccount: string;
  vatAmount: number;
}

interface AccountingFormProps {
  totalAmount: number;
  totalVat: number;
  currency: string;
  disabled?: boolean;
  defaultAccount?: string;
  defaultVatAccount?: string;
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

const AccountingForm = ({ totalAmount, totalVat, currency, disabled = false, defaultAccount = '', defaultVatAccount = '' }: AccountingFormProps) => {
  const [accountEntries, setAccountEntries] = useState<AccountEntry[]>([
    { id: '1', account: defaultAccount, amount: totalAmount }
  ]);
  
  const [vatEntries, setVatEntries] = useState<VatEntry[]>([
    { id: '1', vatAccount: defaultVatAccount, vatAmount: totalVat }
  ]);

  // Update the first entries when defaults change
  useEffect(() => {
    setAccountEntries(prevEntries => {
      if (prevEntries.length === 0) {
        return [{ id: '1', account: defaultAccount, amount: totalAmount }];
      }
      
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
    
    setVatEntries(prevEntries => {
      if (prevEntries.length === 0) {
        return [{ id: '1', vatAccount: defaultVatAccount, vatAmount: totalVat }];
      }
      
      const updatedEntries = [...prevEntries];
      if (updatedEntries[0]) {
        updatedEntries[0] = {
          ...updatedEntries[0],
          vatAccount: defaultVatAccount,
          vatAmount: totalVat
        };
      }
      return updatedEntries;
    });
  }, [defaultAccount, defaultVatAccount, totalAmount, totalVat]);

  const totalAccountAmount = accountEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalVatAmount = vatEntries.reduce((sum, entry) => sum + entry.vatAmount, 0);
  const remainingAmount = totalAmount - totalAccountAmount;
  const remainingVat = totalVat - totalVatAmount;

  const addAccountEntry = () => {
    const newEntry: AccountEntry = {
      id: Date.now().toString(),
      account: '',
      amount: 0
    };
    setAccountEntries([...accountEntries, newEntry]);
  };

  const addVatEntry = () => {
    const newEntry: VatEntry = {
      id: Date.now().toString(),
      vatAccount: defaultVatAccount,
      vatAmount: 0
    };
    setVatEntries([...vatEntries, newEntry]);
  };

  const removeAccountEntry = (id: string) => {
    if (accountEntries.length > 1) {
      setAccountEntries(accountEntries.filter(entry => entry.id !== id));
    }
  };

  const removeVatEntry = (id: string) => {
    if (vatEntries.length > 1) {
      setVatEntries(vatEntries.filter(entry => entry.id !== id));
    }
  };

  const updateAccountEntry = (id: string, field: keyof AccountEntry, value: string | number) => {
    setAccountEntries(accountEntries.map(entry => {
      if (entry.id === id) {
        if (field === 'amount') {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const maxAmount = totalAmount - (totalAccountAmount - entry.amount);
          const clampedAmount = Math.min(Math.max(0, numValue), maxAmount);
          return { ...entry, [field]: clampedAmount };
        }
        return { ...entry, [field]: String(value) };
      }
      return entry;
    }));
  };

  const updateVatEntry = (id: string, field: keyof VatEntry, value: string | number) => {
    setVatEntries(vatEntries.map(entry => {
      if (entry.id === id) {
        if (field === 'vatAmount') {
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

  const isAmountValid = totalAccountAmount <= totalAmount;
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

      {/* Account Entries */}
      <div className="space-y-3 mb-4">
        <h5 className="font-medium text-sm">Account Entries</h5>
        {accountEntries.map((entry, index) => (
          <div key={entry.id} className="bg-white p-3 rounded border">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <label className="text-xs font-medium text-gray-500 mb-1 block">Account</label>
                <Select
                  value={entry.account}
                  onValueChange={(value) => updateAccountEntry(entry.id, 'account', value)}
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
                  onChange={(e) => updateAccountEntry(entry.id, 'amount', e.target.value)}
                  placeholder="0.00"
                  disabled={disabled}
                  className="text-sm text-right"
                  min="0"
                  max={totalAmount}
                  step="0.01"
                />
              </div>
              <div className="col-span-2 flex justify-center gap-1">
                {!disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAccountEntry}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
                {accountEntries.length > 1 && !disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAccountEntry(entry.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="col-span-1"></div>
            </div>
          </div>
        ))}

        {/* Account Totals */}
        <div className="grid grid-cols-12 gap-2 text-sm">
          <div className="col-span-6 font-medium">Total Allocated:</div>
          <div className={`col-span-3 font-medium text-right ${isAmountValid ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalAccountAmount)}
          </div>
          <div className="col-span-3"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-2 text-sm">
          <div className="col-span-6 font-medium">Remaining:</div>
          <div className={`col-span-3 font-medium text-right ${remainingAmount >= 0 ? "text-gray-600" : "text-red-600"}`}>
            {formatCurrency(remainingAmount)}
          </div>
          <div className="col-span-3"></div>
        </div>
      </div>

      <Separator className="my-4" />

      {/* VAT Entries */}
      <div className="space-y-3 mb-4">
        <h5 className="font-medium text-sm">VAT Entries</h5>
        {vatEntries.map((entry, index) => (
          <div key={entry.id} className="bg-white p-3 rounded border">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6">
                <label className="text-xs font-medium text-gray-500 mb-1 block">VAT Account</label>
                <Select
                  value={entry.vatAccount}
                  onValueChange={(value) => updateVatEntry(entry.id, 'vatAccount', value)}
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
                  onChange={(e) => updateVatEntry(entry.id, 'vatAmount', e.target.value)}
                  placeholder="0.00"
                  disabled={disabled}
                  className="text-sm text-right"
                  min="0"
                  max={totalVat}
                  step="0.01"
                />
              </div>
              <div className="col-span-2 flex justify-center gap-1">
                {!disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addVatEntry}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
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
              <div className="col-span-1"></div>
            </div>
          </div>
        ))}

        {/* VAT Totals */}
        <div className="grid grid-cols-12 gap-2 text-sm">
          <div className="col-span-6 font-medium">Total Allocated:</div>
          <div className={`col-span-3 font-medium text-right ${isVatAmountValid ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalVatAmount)}
          </div>
          <div className="col-span-3"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-2 text-sm">
          <div className="col-span-6 font-medium">Remaining:</div>
          <div className={`col-span-3 font-medium text-right ${remainingVat >= 0 ? "text-gray-600" : "text-red-600"}`}>
            {formatCurrency(remainingVat)}
          </div>
          <div className="col-span-3"></div>
        </div>
        
        {(!isAmountValid || !isVatAmountValid) && (
          <div className="text-xs text-red-600 mt-1">
            Total allocated amounts cannot exceed invoice totals
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingForm;
