import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface AccountEntry {
  id: string;
  type: 'account';
  account: string;
  amount: number;
}

interface VatAccountEntry {
  id: string;
  type: 'vatAccount';
  vatAccount: string;
  vatAmount: number;
}

type AccountingEntry = AccountEntry | VatAccountEntry;

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
  { code: "2641", description: "Input VAT 25%" },
  { code: "2645", description: "Input VAT 12%" },
  { code: "2649", description: "Input VAT 6%" },
  { code: "2611", description: "Input VAT 0%" },
];

const AccountingForm = ({ totalAmount, totalVat, currency, disabled = false, defaultAccount = '', defaultVatAccount = '' }: AccountingFormProps) => {
  const [entries, setEntries] = useState<AccountingEntry[]>([]);

  // Initialize with default entries
  useEffect(() => {
    const initialEntries: AccountingEntry[] = [];
    
    if (defaultAccount && totalAmount > 0) {
      initialEntries.push({
        id: 'default-account',
        type: 'account',
        account: defaultAccount,
        amount: totalAmount
      });
    }
    
    if (defaultVatAccount && totalVat > 0) {
      initialEntries.push({
        id: 'default-vat',
        type: 'vatAccount',
        vatAccount: defaultVatAccount,
        vatAmount: totalVat
      });
    }
    
    setEntries(initialEntries);
  }, [defaultAccount, defaultVatAccount, totalAmount, totalVat]);

  const accountEntries = entries.filter((entry): entry is AccountEntry => entry.type === 'account');
  const vatAccountEntries = entries.filter((entry): entry is VatAccountEntry => entry.type === 'vatAccount');

  const totalEntryAmount = accountEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalVatAmount = vatAccountEntries.reduce((sum, entry) => sum + entry.vatAmount, 0);
  const remainingAmount = totalAmount - totalEntryAmount;
  const remainingVat = totalVat - totalVatAmount;

  const addAccountEntry = () => {
    const newEntry: AccountEntry = {
      id: `account-${Date.now()}`,
      type: 'account',
      account: defaultAccount,
      amount: 0
    };
    setEntries([...entries, newEntry]);
  };

  const addVatAccountEntry = () => {
    const newEntry: VatAccountEntry = {
      id: `vat-${Date.now()}`,
      type: 'vatAccount',
      vatAccount: defaultVatAccount,
      vatAmount: 0
    };
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const updateAccountEntry = (id: string, field: keyof AccountEntry, value: string | number) => {
    setEntries(entries.map(entry => {
      if (entry.id === id && entry.type === 'account') {
        if (field === 'amount') {
          const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const maxAmount = totalAmount - (totalEntryAmount - entry.amount);
          const clampedAmount = Math.min(Math.max(0, numValue), maxAmount);
          return { ...entry, [field]: clampedAmount };
        }
        return { ...entry, [field]: String(value) };
      }
      return entry;
    }));
  };

  const updateVatAccountEntry = (id: string, field: keyof VatAccountEntry, value: string | number) => {
    setEntries(entries.map(entry => {
      if (entry.id === id && entry.type === 'vatAccount') {
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

      {/* Account Entries - Single Header for all entries */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <h5 className="font-medium text-sm">Account Entries</h5>
          <div className="flex gap-2">
            {!disabled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAccountEntry}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Account
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVatAccountEntry}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add VAT
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Headers - only show once at the top */}
        {accountEntries.length > 0 && (
          <div className="grid grid-cols-12 gap-1 items-center text-xs font-medium text-gray-500 pb-1">
            <div className="col-span-6">Account</div>
            <div className="col-span-5 text-right">Amount</div>
            <div className="col-span-1"></div>
          </div>
        )}
        
        {/* Regular Account Entries */}
        {accountEntries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-12 gap-1 items-center py-1">
            <div className="col-span-6">
              <Select
                value={entry.account}
                onValueChange={(value) => updateAccountEntry(entry.id, 'account', value)}
                disabled={disabled}
              >
                <SelectTrigger className="text-sm bg-transparent border-gray-300">
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
            <div className="col-span-5">
              <Input
                type="number"
                value={entry.amount}
                onChange={(e) => updateAccountEntry(entry.id, 'amount', e.target.value)}
                placeholder="0.00"
                disabled={disabled}
                className="text-sm text-right bg-transparent border-gray-300"
                min="0"
                max={totalAmount}
                step="0.01"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              {!disabled && (
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

        {/* VAT Amount Header - only show when there are VAT entries */}
        {vatAccountEntries.length > 0 && (
          <div className="grid grid-cols-12 gap-1 items-center text-xs font-medium text-gray-500 pb-1 mt-2">
            <div className="col-span-6">VAT Account</div>
            <div className="col-span-5 text-right">VAT Amount</div>
            <div className="col-span-1"></div>
          </div>
        )}

        {/* VAT Account Entries */}
        {vatAccountEntries.map((entry) => (
          <div key={entry.id} className="grid grid-cols-12 gap-1 items-center py-1">
            <div className="col-span-6">
              <Select
                value={entry.vatAccount}
                onValueChange={(value) => updateVatAccountEntry(entry.id, 'vatAccount', value)}
                disabled={disabled}
              >
                <SelectTrigger className="text-sm bg-transparent border-gray-300">
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
            <div className="col-span-5">
              <Input
                type="number"
                value={entry.vatAmount}
                onChange={(e) => updateVatAccountEntry(entry.id, 'vatAmount', e.target.value)}
                placeholder="0.00"
                disabled={disabled}
                className="text-sm text-right bg-transparent border-gray-300"
                min="0"
                max={totalVat}
                step="0.01"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              {!disabled && (
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
      </div>

      {/* Totals */}
      <Separator className="my-3" />
      <div className="space-y-2 text-sm">
        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-6 font-medium">Total Allocated:</div>
          <div className="col-span-1"></div>
          <div className={`col-span-4 font-medium text-right ${isAmountValid ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalEntryAmount)}
          </div>
          <div className="col-span-1"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-6"></div>
          <div className="col-span-1"></div>
          <div className={`col-span-4 font-medium text-right ${isVatAmountValid ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(totalVatAmount)}
          </div>
          <div className="col-span-1"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-6 font-medium">Remaining:</div>
          <div className="col-span-1"></div>
          <div className={`col-span-4 font-medium text-right ${remainingAmount >= 0 ? "text-gray-600" : "text-red-600"}`}>
            {formatCurrency(remainingAmount)}
          </div>
          <div className="col-span-1"></div>
        </div>
        
        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-6"></div>
          <div className="col-span-1"></div>
          <div className={`col-span-4 font-medium text-right ${remainingVat >= 0 ? "text-gray-600" : "text-red-600"}`}>
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
  );
};

export default AccountingForm;
