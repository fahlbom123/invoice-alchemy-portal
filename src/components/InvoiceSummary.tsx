
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { Invoice } from "@/types/invoice";

interface InvoiceSummaryProps {
  invoices: Invoice[];
}

export function InvoiceSummary({ invoices }: InvoiceSummaryProps) {
  // Calculate totals
  const totalPending = invoices
    .filter(invoice => invoice.status === "pending")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const totalPaid = invoices
    .filter(invoice => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  const totalOverdue = invoices
    .filter(invoice => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <div className="h-5 w-5 rounded-full bg-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <div className="h-5 w-5 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <div className="h-5 w-5 rounded-full bg-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalOverdue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
