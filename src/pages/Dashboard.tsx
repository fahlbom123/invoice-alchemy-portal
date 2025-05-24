
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import InvoiceList from "@/components/InvoiceList";
import { InvoiceSummary } from "@/components/InvoiceSummary";
import { useInvoices } from "@/hooks/useInvoices";

const Dashboard = () => {
  const navigate = useNavigate();
  const { invoices, isLoading } = useInvoices();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const filteredInvoices = filterStatus === "all" 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filterStatus);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Supplier Invoice Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/invoice-lines/search')}
              variant="outline"
            >
              Search Invoice Lines
            </Button>
            <Button 
              onClick={() => navigate('/invoices/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create New Supplier Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <InvoiceSummary invoices={invoices} />
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle>Filter Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button 
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
              >
                Pending
              </Button>
              <Button 
                variant={filterStatus === "paid" ? "default" : "outline"}
                onClick={() => setFilterStatus("paid")}
              >
                Paid
              </Button>
              <Button 
                variant={filterStatus === "overdue" ? "default" : "outline"}
                onClick={() => setFilterStatus("overdue")}
              >
                Overdue
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Supplier Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceList invoices={filteredInvoices} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
