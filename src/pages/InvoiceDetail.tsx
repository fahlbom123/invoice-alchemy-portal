
import { useParams, useNavigate } from "react-router-dom";
import { useInvoiceById } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/formatters";
import InvoiceLinesList from "@/components/InvoiceLinesList";

const InvoiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { invoice, isLoading } = useInvoiceById(id!);
  const navigate = useNavigate();

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

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate(`/invoices/edit/${id}`)}>
            Edit Invoice
          </Button>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center pb-2">
              <div>
                <CardTitle className="text-2xl">Invoice #{invoice.invoiceNumber}</CardTitle>
                <p className="text-sm text-gray-500">Created on {formatDate(invoice.createdAt)}</p>
              </div>
              <Badge className={`mt-2 sm:mt-0 ${getBadgeVariant(invoice.status)}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Supplier Details</h3>
                  <div className="mt-2">
                    <p className="font-medium">{invoice.supplier.name}</p>
                    <p>{invoice.supplier.email}</p>
                    <p>{invoice.supplier.phone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Invoice Details</h3>
                  <div className="mt-2">
                    <p><span className="font-medium">Due Date:</span> {formatDate(invoice.dueDate)}</p>
                    <p><span className="font-medium">Reference:</span> {invoice.reference}</p>
                    <p><span className="font-medium">Total Amount:</span> {formatCurrency(invoice.totalAmount)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Invoice Lines</h3>
                <InvoiceLinesList invoiceLines={invoice.invoiceLines} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
