
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useInvoiceById } from "@/hooks/useInvoices";
import { InvoiceFormData } from "@/types/invoice";
import SupplierDetails from "@/components/invoice/SupplierDetails";
import InvoiceHeaderView from "@/components/invoice/InvoiceHeaderView";
import { ArrowLeft, Edit } from "lucide-react";

const InvoiceView = () => {
  const { id } = useParams<{ id: string }>();
  const { invoice, isLoading } = useInvoiceById(id || "");
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
    ocr: "",
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.reference,
        status: invoice.status,
        dueDate: invoice.dueDate 
          ? new Date(invoice.dueDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
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
  }, [invoice]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invoice not found</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate(`/invoices/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Supplier Invoice
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>View Supplier Invoice</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Supplier Information */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Supplier</h3>
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <p className="font-medium text-lg">{invoice.supplier.name}</p>
                </div>
              </div>

              {/* Supplier Details */}
              <SupplierDetails supplier={invoice.supplier} />

              {/* Invoice Header Information */}
              <InvoiceHeaderView formData={formData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceView;
