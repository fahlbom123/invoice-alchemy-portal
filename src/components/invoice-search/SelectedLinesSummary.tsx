
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

interface SelectedLinesSummaryProps {
  count: number;
  totalEstimatedCost: number;
  totalEstimatedVat: number;
  totalActualCost: number;
  totalActualVat: number;
  totalInvoicedAmount: number;
  onRegisterMultipleInvoices: () => void;
}

const SelectedLinesSummary = ({
  count,
  totalEstimatedCost,
  totalEstimatedVat,
  totalActualCost,
  totalActualVat,
  totalInvoicedAmount,
  onRegisterMultipleInvoices,
}: SelectedLinesSummaryProps) => {
  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <span className="font-medium block">{count} lines selected</span>
          <div className="text-sm space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Total Estimated Cost:</span>
                <span className="font-medium">{formatCurrency(totalEstimatedCost, undefined)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Total Actual Cost:</span>
                <span className="font-medium">{formatCurrency(totalActualCost, undefined)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Invoiced:</span>
                <span className="font-medium">{formatCurrency(totalInvoicedAmount, undefined)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Total Estimated VAT:</span>
                <span className="font-medium">{formatCurrency(totalEstimatedVat, undefined)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Total Actual VAT:</span>
                <span className="font-medium">{formatCurrency(totalActualVat, undefined)}</span>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={onRegisterMultipleInvoices}>
          Register Supplier Invoice
        </Button>
      </div>
    </div>
  );
};

export default SelectedLinesSummary;
