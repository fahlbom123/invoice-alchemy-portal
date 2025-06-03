import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceFormData, SupplierInvoiceLine } from "@/types/invoice";

interface InvoiceHeaderViewProps {
  formData: InvoiceFormData;
  registeredTotals?: {
    totalActualCost: number;
    totalActualVat: number;
  } | null;
  supplierInvoiceLines?: SupplierInvoiceLine[];
  invoiceId: string;
  selectedProject?: {
    id: string;
    project_number: string;
    description: string;
  } | null;
}

const InvoiceHeaderView = ({ 
  formData, 
  registeredTotals, 
  supplierInvoiceLines = [], 
  invoiceId,
  selectedProject 
}: InvoiceHeaderViewProps) => {
  // Calculate registered totals from supplier invoice lines
  const calculateRegisteredTotals = () => {
    const totalActualCost = supplierInvoiceLines.reduce((sum, line) => sum + line.actualCost, 0);
    const totalActualVat = supplierInvoiceLines.reduce((sum, line) => sum + line.actualVat, 0);
    return { totalActualCost, totalActualVat };
  };

  const { totalActualCost, totalActualVat } = registeredTotals || calculateRegisteredTotals();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                <p className="text-sm">{formData.invoiceNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Reference</label>
                <p className="text-sm">{formData.reference}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Invoice Date</label>
                <p className="text-sm">
                  {formData.invoiceDate ? new Date(formData.invoiceDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Due Date</label>
                <p className="text-sm">
                  {formData.dueDate ? new Date(formData.dueDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-sm capitalize">{formData.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Currency</label>
                <p className="text-sm">{formData.currency || 'USD'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Account</label>
                <p className="text-sm">{formData.account || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">VAT Account</label>
                <p className="text-sm">{formData.vatAccount || 'Not set'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Periodization Year</label>
                <p className="text-sm">{formData.periodizationYear || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Periodization Month</label>
                <p className="text-sm">
                  {formData.periodizationMonth ? 
                    new Date(2000, formData.periodizationMonth - 1).toLocaleString('default', { month: 'long' }) 
                    : 'Not set'
                  }
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Project</label>
              <p className="text-sm">
                {selectedProject ? `${selectedProject.project_number} - ${selectedProject.description}` : 'No project selected'}
              </p>
            </div>

            {formData.source && (
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <p className="text-sm">{formData.source}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">OCR</label>
              <p className="text-sm">{formData.ocr || 'Not set'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Notes (Optional)</label>
              <p className="text-sm">{formData.notes || 'No notes'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-3">Financial Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-medium">{formatCurrency(formData.totalAmount || 0, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT Amount:</span>
                  <span className="font-medium">{formatCurrency(formData.vat || 0, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total VAT:</span>
                  <span className="font-medium">{formatCurrency(formData.totalVat || 0, formData.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Registered Total Actual Cost:</span>
                  <span className={totalActualCost > 0 ? "text-green-600" : "text-gray-500"}>
                    {formatCurrency(totalActualCost, formData.currency)}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Registered Total Actual VAT:</span>
                  <span className={totalActualVat > 0 ? "text-green-600" : "text-gray-500"}>
                    {formatCurrency(totalActualVat, formData.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceHeaderView;
