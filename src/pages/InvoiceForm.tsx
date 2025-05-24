
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInvoiceById, useSaveInvoice } from "@/hooks/useInvoices";
import { InvoiceFormData } from "@/types/invoice";
import { formatCurrency } from "@/lib/formatters";

const InvoiceForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { invoice, isLoading: isLoadingInvoice } = useInvoiceById(id || "");
  const { suppliers, isLoading: isLoadingSuppliers } = useSuppliers();
  const { saveInvoice, isLoading: isSaving } = useSaveInvoice();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: "",
    reference: "",
    status: "pending",
    dueDate: new Date().toISOString().split('T')[0],
    supplierId: "",
    notes: "",
    invoiceLines: [],
    invoiceDate: new Date().toISOString().split('T')[0],
    currency: "USD",
    totalAmount: 0,
    totalVat: 0,
  });

  // Get the selected supplier details
  const selectedSupplier = formData.supplierId 
    ? suppliers.find(s => s.id === formData.supplierId) 
    : null;

  useEffect(() => {
    if (invoice && isEditing) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.reference,
        status: invoice.status,
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
        invoiceDate: invoice.invoiceDate 
          ? new Date(invoice.invoiceDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        supplierId: invoice.supplier.id,
        notes: invoice.notes || "",
        invoiceLines: invoice.invoiceLines,
        currency: invoice.currency || "USD",
        vat: invoice.vat,
        totalAmount: invoice.totalAmount || 0,
        totalVat: invoice.totalVat || 0,
      });
    }
  }, [invoice, isEditing]);

  if ((isLoadingInvoice && isEditing) || isLoadingSuppliers) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVatChange = (value: string) => {
    const vatValue = value === "" ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, vat: vatValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);
    if (!supplier) {
      toast.error("Invalid supplier selected");
      return;
    }

    const completeFormData = {
      ...formData,
      id: isEditing ? id : `invoice-${Date.now()}`,
      createdAt: isEditing ? invoice!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        accountNumber: supplier.accountNumber,
        defaultCurrency: supplier.defaultCurrency,
        currencyRate: supplier.currencyRate
      }
    };

    try {
      await saveInvoice(completeFormData);
      toast.success(isEditing ? "Invoice updated successfully" : "Invoice created successfully");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Failed to save invoice. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{isEditing ? "Edit Supplier Invoice" : "Create New Supplier Invoice"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="supplierId">Supplier</Label>
                  <Select
                    value={formData.supplierId}
                    onValueChange={(value) => handleSelectChange('supplierId', value)}
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

                {selectedSupplier && (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h3 className="font-medium mb-2">Supplier Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><span className="font-medium">Email:</span> {selectedSupplier.email}</p>
                        <p><span className="font-medium">Phone:</span> {selectedSupplier.phone}</p>
                      </div>
                    </div>
                  </div>
                )}

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
                    <Label htmlFor="dueDate">Due Date</Label>
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
                    <Label htmlFor="totalAmount">Total Amount</Label>
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
                    <Label htmlFor="vat">VAT Amount</Label>
                    <div className="relative">
                      <Input
                        id="vat"
                        name="vat"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.vat || ""}
                        onChange={(e) => handleVatChange(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
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
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update Supplier Invoice" : "Create Supplier Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
