
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";

interface SelectedLinesSummaryProps {
  count: number;
  totalEstimatedCost: number;
  totalEstimatedVat: number;
  totalActualCost: number;
  totalActualVat: number;
  totalInvoicedAmount: number;
  invoiceTotalAmount: number;
  onRegisterMultipleInvoices: () => void;
}

const SelectedLinesSummary = ({
  count,
  totalEstimatedCost,
  totalEstimatedVat,
  totalActualCost,
  totalActualVat,
  totalInvoicedAmount,
  invoiceTotalAmount,
  onRegisterMultipleInvoices,
}: SelectedLinesSummaryProps) => {
  const totalEstimatedSummary = totalEstimatedCost + totalEstimatedVat;
  const totalActualSummary = totalActualCost + totalActualVat;
  const diffAmount = invoiceTotalAmount - totalActualSummary;

  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <span className="font-medium block">{count} bookings selected</span>
          <div className="text-sm space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600 text-xs">Total Estimated Cost:</span>
                  <span className="font-medium">{formatCurrency(totalEstimatedCost, undefined)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600 text-xs">Total Estimated VAT:</span>
                  <span className="font-medium">{formatCurrency(totalEstimatedVat, undefined)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600 text-xs">Total Actual Cost:</span>
                  <span className="font-medium">{formatCurrency(totalActualCost, undefined)}</span>
                </div>
                <div className="flex flex-col space-y-1">
                  <span className="text-gray-600 text-xs">Total Actual VAT:</span>
                  <span className="font-medium">{formatCurrency(totalActualVat, undefined)}</span>
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600 text-xs">Invoiced:</span>
                <span className="font-medium">{formatCurrency(invoiceTotalAmount, undefined)}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600 text-xs">Diff:</span>
                <span className={`font-medium ${diffAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(diffAmount, undefined)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-200">
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600 font-medium text-xs">Total Estimated:</span>
                <span className="font-bold">{formatCurrency(totalEstimatedSummary, undefined)}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-600 font-medium text-xs">Total Actual:</span>
                <span className="font-bold">{formatCurrency(totalActualSummary, undefined)}</span>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={onRegisterMultipleInvoices}>
          Register Bookings
        </Button>
      </div>
    </div>
  );
};

export default SelectedLinesSummary;
