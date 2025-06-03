import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useInvoiceById, useSaveInvoice } from "@/hooks/useInvoices";
import { useSuppliers } from "@/hooks/useSuppliers";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { InvoiceFormData, SupplierInvoiceLine } from "@/types/invoice";
import InvoiceHeaderView from "@/components/invoice/InvoiceHeaderView";
import { supabase } from "@/integrations/supabase/client";

interface RouteParams {
  id?: string;
}

interface InvoiceViewProps {
  // Define any props the component might receive here
}

const InvoiceView = () => {
  const { id } = useParams<RouteParams>();
  const { invoice, isLoading, refetch } = useInvoiceById(id || "");
  const { suppliers } = useSuppliers();
  const { saveInvoice } = useSaveInvoice();
  const navigate = useNavigate();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUncancelDialog, setShowUncancelDialog] = useState(false);
  const [showSendToAccountingDialog, setShowSendToAccountingDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUncancelling, setIsUncancelling] = useState(false);
  const [isSendingToAccounting, setIsSendingToAccounting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [registeredLines, setRegisteredLines] = useState<SupplierInvoiceLine[]>([]);

  // Check if cancel button should be enabled (no lines connected)
  const canCancelInvoice = !invoice?.supplierInvoiceLines || invoice.supplierInvoiceLines.length === 0;

  // Add the missing formData state
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: "",
    reference: "",
    status: "",
    dueDate: "",
    invoiceDate: "",
    supplierId: "",
    notes: "",
    invoiceLines: [],
    currency: "USD",
    totalAmount: 0,
    totalVat: 0,
    vat: 0,
    ocr: "",
    source: undefined,
    account: "",
    vatAccount: "",
    periodizationYear: undefined,
    periodizationMonth: undefined,
    projectId: undefined,
  });

  // Load registered lines only if invoice exists and has supplier invoice lines
  useEffect(() => {
    const loadRegisteredLines = async () => {
      if (!invoice?.supplierInvoiceLines) {
        setRegisteredLines([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('supplier_invoice_lines')
          .select('*')
          .in('id', invoice.supplierInvoiceLines.map(line => line.id));

        if (error) {
          console.error('Error loading registered lines:', error);
          toast.error("Failed to load registered lines");
          return;
        }

        setRegisteredLines(data || []);
      } catch (error) {
        console.error('Error loading registered lines:', error);
        toast.error("Failed to load registered lines");
      }
    };

    loadRegisteredLines();
  }, [invoice?.supplierInvoiceLines]);

  const handleSendToAccounting = async () => {
    setShowSendToAccountingDialog(true);
  };

  const confirmSendToAccounting = async () => {
    setIsSendingToAccounting(true);
    try {
      if (!id) {
        toast.error("Invoice ID is missing.");
        return;
      }

      // Optimistically update the invoice status
      toast.success("Sending invoice to accounting...");
      await saveInvoice({ ...invoice, status: "sent_to_accounting" });
      toast.success("Invoice sent to accounting successfully");
      refetch(); // Refresh the invoice data
    } catch (error) {
      console.error("Error sending invoice to accounting:", error);
      toast.error("Failed to send invoice to accounting");
    } finally {
      setIsSendingToAccounting(false);
      setShowSendToAccountingDialog(false);
    }
  };

  const handleCancelInvoice = () => {
    setShowCancelDialog(true);
  };

  const confirmCancelInvoice = async () => {
    setIsCancelling(true);
    try {
      if (!id) {
        toast.error("Invoice ID is missing.");
        return;
      }

      // Optimistically update the invoice status
      toast.success("Cancelling invoice...");
      await saveInvoice({ ...invoice, status: "cancelled" });
      toast.success("Invoice cancelled successfully");
      refetch(); // Refresh the invoice data
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast.error("Failed to cancel invoice");
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const handleUncancelInvoice = () => {
    setShowUncancelDialog(true);
  };

  const confirmUncancelInvoice = async () => {
    setIsUncancelling(true);
    try {
      if (!id) {
        toast.error("Invoice ID is missing.");
        return;
      }

      // Optimistically update the invoice status
      toast.success("Uncancelling invoice...");
      await saveInvoice({ ...invoice, status: "unpaid" });
      toast.success("Invoice uncancelled successfully");
      refetch(); // Refresh the invoice data
    } catch (error) {
      console.error("Error uncancelling invoice:", error);
      toast.error("Failed to uncancel invoice");
    } finally {
      setIsUncancelling(false);
      setShowUncancelDialog(false);
    }
  };

  const handleEdit = () => {
    navigate(`/invoices/edit/${id}`);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!invoice) {
    return <div className="flex items-center justify-center h-screen">Invoice not found</div>;
  }

  const supplier = suppliers.find(s => s.id === invoice.supplier.id);
  const isEditable = invoice.status !== "cancelled" && invoice.status !== "sent_to_accounting";

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={handleBackToDashboard}>
            Back to Dashboard
          </Button>
          <div className="space-x-2">
            {invoice.status === "unpaid" && (
              <>
                <Button disabled={!isEditable} onClick={handleEdit}>
                  Edit Invoice
                </Button>
                <Button
                  variant="destructive"
                  disabled={!isEditable || !canCancelInvoice}
                  onClick={handleCancelInvoice}
                >
                  Cancel Invoice
                </Button>
                <Button
                  variant="secondary"
                  disabled={!isEditable}
                  onClick={handleSendToAccounting}
                >
                  Send to Accounting
                </Button>
              </>
            )}
            {invoice.status === "cancelled" && (
              <Button
                variant="secondary"
                onClick={handleUncancelInvoice}
              >
                Uncancel Invoice
              </Button>
            )}
            {invoice.status === "sent_to_accounting" && (
              <Badge variant="outline">Sent to Accounting</Badge>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Supplier Invoice Details</CardTitle>
              <Badge variant="secondary">{invoice.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <InvoiceHeaderView invoice={invoice} supplier={supplier} />

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Registered Supplier Invoice Lines</h3>
                {registeredLines.length === 0 ? (
                  <p>No supplier invoice lines registered for this invoice.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registeredLines.map((line) => (
                      <Card key={line.id} className="bg-gray-50 border">
                        <CardContent className="p-4">
                          <p className="text-sm font-medium">Description: {line.description}</p>
                          <p className="text-sm">Actual Cost: {formatCurrency(line.actualCost, line.currency)}</p>
                          <p className="text-sm">VAT: {formatCurrency(line.actualVat, line.currency)}</p>
                          <p className="text-sm">Supplier: {line.supplierName}</p>
                          <p className="text-sm">Created At: {formatDate(line.createdAt)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this invoice? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowCancelDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled={isCancelling} onClick={confirmCancelInvoice}>
                {isCancelling ? "Cancelling..." : "Confirm Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showUncancelDialog} onOpenChange={setShowUncancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Uncancel Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to uncancel this invoice?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowUncancelDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled={isUncancelling} onClick={confirmUncancelInvoice}>
                {isUncancelling ? "Uncancelling..." : "Confirm Uncancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showSendToAccountingDialog} onOpenChange={setShowSendToAccountingDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send to Accounting</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to send this invoice to accounting?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowSendToAccountingDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction disabled={isSendingToAccounting} onClick={confirmSendToAccounting}>
                {isSendingToAccounting ? "Sending..." : "Confirm Send"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default InvoiceView;
