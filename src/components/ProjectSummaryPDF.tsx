
import jsPDF from 'jspdf';
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const ProjectSummaryPDF = () => {
  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Supplier Invoice Management System", margin, yPosition);
      doc.text("User Guide & Feature Overview", margin, yPosition + 10);
      
      yPosition += 30;
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");

      // Dashboard Overview
      doc.setFont("helvetica", "bold");
      doc.text("📊 Dashboard Overview", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const dashboardFeatures = [
        "• Invoice Summary Cards: View total amounts for pending, paid, and overdue invoices",
        "• Status Filtering: Filter invoices by status (All, Pending, Paid, Overdue)",
        "• Search Functionality: Search invoices by number, supplier name, or reference",
        "• Report Generation: Generate various business reports with parameters"
      ];
      
      dashboardFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      yPosition += 10;

      // Invoice Management
      doc.setFont("helvetica", "bold");
      doc.text("📋 Invoice Management", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const invoiceFeatures = [
        "• Create New Invoices: Add supplier invoices with comprehensive details",
        "• Invoice Listing: View all invoices in searchable, sortable table format",
        "• Status Tracking: Monitor invoice status with color-coded badges",
        "• Currency Support: Handle multiple currencies (SEK, USD, EUR)",
        "• Source Tracking: Track invoice sources (Manual, Imported, etc.)"
      ];
      
      invoiceFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      yPosition += 10;

      // Supplier Management
      doc.setFont("helvetica", "bold");
      doc.text("🏢 Supplier Management", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const supplierFeatures = [
        "• Supplier Selection: Choose from existing suppliers or add new ones",
        "• Supplier Details: Store comprehensive supplier information",
        "• Supplier Performance: Track payment patterns and volumes"
      ];
      
      supplierFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      } else {
        yPosition += 10;
      }

      // Financial Features
      doc.setFont("helvetica", "bold");
      doc.text("💰 Financial Features", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const financialFeatures = [
        "• Amount Tracking: Monitor estimated vs actual costs",
        "• VAT Calculations: Handle estimated and actual VAT amounts",
        "• Currency Conversion: Support for multiple currencies",
        "• Cost Analysis: Detailed breakdown of costs and expenses"
      ];
      
      financialFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      yPosition += 10;

      // Reporting System
      doc.setFont("helvetica", "bold");
      doc.text("📈 Reporting System", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const reportingFeatures = [
        "• Invoice Summary Reports: Generate summaries by status, supplier, or date range",
        "• Supplier Performance Reports: Analyze supplier payment patterns and volumes",
        "• Cost Analysis Reports: Compare estimated vs actual costs with currency filtering",
        "• Periodization Reports: View invoice breakdowns by year and month",
        "• Custom Parameters: Configure report parameters like date ranges and filters"
      ];
      
      reportingFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      // Check if we need a new page
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 30;
      } else {
        yPosition += 10;
      }

      // Invoice Details & Processing
      doc.setFont("helvetica", "bold");
      doc.text("🔍 Invoice Details & Processing", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const processingFeatures = [
        "• Invoice Lines: Add and manage individual invoice line items",
        "• Line Item Search: Search and select invoice lines from existing data",
        "• Cost Registration: Register costs against specific projects or accounts",
        "• Project Integration: Link invoices to specific projects",
        "• Booking Summary: View booking details and allocations"
      ];
      
      processingFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      yPosition += 10;

      // UI Features
      doc.setFont("helvetica", "bold");
      doc.text("📱 User Interface Features", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const uiFeatures = [
        "• Responsive Design: Works seamlessly on desktop and mobile devices",
        "• Modern UI: Clean, professional interface using Shadcn UI components",
        "• Real-time Updates: Dynamic updates when invoice data changes",
        "• Toast Notifications: User feedback for successful operations and errors",
        "• Modal Dialogs: Streamlined workflows for data entry and configuration"
      ];
      
      uiFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      yPosition += 10;

      // Technical Features
      doc.setFont("helvetica", "bold");
      doc.text("🔧 Technical Features", margin, yPosition);
      yPosition += 10;
      doc.setFont("helvetica", "normal");
      
      const technicalFeatures = [
        "• Data Persistence: Local storage for invoice data",
        "• State Management: React Query for efficient data fetching and caching",
        "• Type Safety: Full TypeScript implementation",
        "• Component Architecture: Modular, reusable components",
        "• Routing: Multi-page application with React Router"
      ];
      
      technicalFeatures.forEach(feature => {
        const lines = doc.splitTextToSize(feature, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += 6;
        });
      });

      // Footer
      yPosition += 20;
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text("This system provides a complete solution for managing supplier invoices,", margin, yPosition);
      doc.text("from creation and tracking to reporting and analysis, with a focus on", margin, yPosition + 5);
      doc.text("usability and comprehensive financial oversight.", margin, yPosition + 10);

      // Save the PDF
      doc.save('supplier-invoice-system-guide.pdf');
      
      toast({
        title: "PDF Generated",
        description: "The project summary has been downloaded as a PDF file.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={generatePDF}
      variant="outline"
      className="bg-white hover:bg-gray-50"
    >
      <FileText className="h-4 w-4 mr-2" />
      Download User Guide PDF
    </Button>
  );
};
