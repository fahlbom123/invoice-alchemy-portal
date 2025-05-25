
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInvoiceById, useSaveInvoice } from "@/hooks/useInvoices";
import { InvoiceFormData } from "@/types/invoice";
import SupplierSelector from "@/components/invoice/SupplierSelector";
import SupplierDetails from "@/components/invoice/SupplierDetails";
import InvoiceHeaderForm from "@/components/invoice/InvoiceHeaderForm";

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
    status: "unpaid",
    dueDate: new Date().toISOString().split('T')[0],
    supplierId: "",
    notes: "",
    invoiceLines: [],
    invoiceDate: new Date().toISOString().split('T')[0],
    currency: "USD",
    totalAmount: 0,
    totalVat: 0,
    ocr: "",
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
        totalAmount: invoice.totalAmount || 0,
        totalVat: invoice.totalVat || 0,
        ocr: invoice.ocr || "",
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

  const handleSupplierChange = (supplierId: string) => {
    setFormData(prev => ({ ...prev, supplierId }));
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
      // Ensure status is "unpaid" for new invoices
      status: isEditing ? formData.status : "unpaid",
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
        currencyRate: supplier.currencyRate,
        address: supplier.address,
        zipCode: supplier.zipCode,
        city: supplier.city,
        country: supplier.country
      }
    };

    try {
      await saveInvoice(completeFormData);
      toast.success(isEditing ? "Invoice updated successfully" : "Invoice created successfully");
      
      if (isEditing && id) {
        navigate(`/invoices/view/${id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error("Failed to save invoice. Please try again.");
    }
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/invoices/view/${id}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={handleCancel}>
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
                <SupplierSelector 
                  supplierId={formData.supplierId}
                  suppliers={suppliers}
                  onSelectSupplier={handleSupplierChange}
                />

                {selectedSupplier && <SupplierDetails supplier={selectedSupplier} />}

                <InvoiceHeaderForm 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleNumberInputChange={handleNumberInputChange}
                  handleSelectChange={handleSelectChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
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
