
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReportModalProps {
  children: React.ReactNode;
}

type ReportType = {
  id: string;
  name: string;
  description: string;
  parameters: {
    id: string;
    name: string;
    type: 'date' | 'select' | 'text' | 'number';
    required: boolean;
    options?: { value: string; label: string; }[];
  }[];
};

const availableReports: ReportType[] = [
  {
    id: "invoice-summary",
    name: "Invoice Summary Report",
    description: "Summary of invoices by status, supplier, or date range",
    parameters: [
      {
        id: "dateFrom",
        name: "From Date",
        type: "date",
        required: true
      },
      {
        id: "dateTo", 
        name: "To Date",
        type: "date",
        required: true
      },
      {
        id: "status",
        name: "Status Filter",
        type: "select",
        required: false,
        options: [
          { value: "all", label: "All Statuses" },
          { value: "pending", label: "Pending" },
          { value: "paid", label: "Paid" },
          { value: "overdue", label: "Overdue" }
        ]
      }
    ]
  },
  {
    id: "supplier-performance",
    name: "Supplier Performance Report",
    description: "Analysis of supplier payment patterns and invoice volumes",
    parameters: [
      {
        id: "dateFrom",
        name: "From Date", 
        type: "date",
        required: true
      },
      {
        id: "dateTo",
        name: "To Date",
        type: "date", 
        required: true
      },
      {
        id: "minAmount",
        name: "Minimum Invoice Amount",
        type: "number",
        required: false
      }
    ]
  },
  {
    id: "cost-analysis",
    name: "Cost Analysis Report",
    description: "Detailed breakdown of estimated vs actual costs",
    parameters: [
      {
        id: "dateFrom",
        name: "From Date",
        type: "date",
        required: true
      },
      {
        id: "dateTo",
        name: "To Date", 
        type: "date",
        required: true
      },
      {
        id: "currency",
        name: "Currency",
        type: "select",
        required: false,
        options: [
          { value: "all", label: "All Currencies" },
          { value: "SEK", label: "SEK" },
          { value: "USD", label: "USD" },
          { value: "EUR", label: "EUR" }
        ]
      }
    ]
  },
  {
    id: "periodization",
    name: "Periodization Report",
    description: "Invoice periodization breakdown by year and month",
    parameters: [
      {
        id: "year",
        name: "Year",
        type: "number",
        required: true
      },
      {
        id: "month",
        name: "Month",
        type: "select",
        required: false,
        options: [
          { value: "all", label: "All Months" },
          { value: "1", label: "January" },
          { value: "2", label: "February" },
          { value: "3", label: "March" },
          { value: "4", label: "April" },
          { value: "5", label: "May" },
          { value: "6", label: "June" },
          { value: "7", label: "July" },
          { value: "8", label: "August" },
          { value: "9", label: "September" },
          { value: "10", label: "October" },
          { value: "11", label: "November" },
          { value: "12", label: "December" }
        ]
      }
    ]
  }
];

export default function ReportModal({ children }: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleReportSelect = (reportId: string) => {
    const report = availableReports.find(r => r.id === reportId);
    setSelectedReport(report || null);
    setParameters({});
  };

  const handleParameterChange = (parameterId: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [parameterId]: value
    }));
  };

  const validateParameters = () => {
    if (!selectedReport) return false;
    
    for (const param of selectedReport.parameters) {
      if (param.required && !parameters[param.id]) {
        return false;
      }
    }
    return true;
  };

  const handleGenerateReport = async () => {
    if (!selectedReport || !validateParameters()) {
      toast({
        title: "Invalid Parameters",
        description: "Please fill in all required parameters.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report Generated",
        description: `${selectedReport.name} has been generated successfully.`,
      });
      
      // Here you would typically download the report or navigate to a report view
      console.log("Generated report:", selectedReport.id, "with parameters:", parameters);
      
      setIsOpen(false);
      setSelectedReport(null);
      setParameters({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDefaultFromDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Report Selection */}
          <div className="space-y-2">
            <Label htmlFor="report-select">Select Report Type</Label>
            <Select onValueChange={handleReportSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a report to generate..." />
              </SelectTrigger>
              <SelectContent>
                {availableReports.map(report => (
                  <SelectItem key={report.id} value={report.id}>
                    {report.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Report Description */}
          {selectedReport && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{selectedReport.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {selectedReport.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Parameters */}
          {selectedReport && selectedReport.parameters.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Report Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedReport.parameters.map(param => (
                  <div key={param.id} className="space-y-2">
                    <Label htmlFor={param.id}>
                      {param.name}
                      {param.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {param.type === 'date' && (
                      <Input
                        id={param.id}
                        type="date"
                        value={parameters[param.id] || (param.id === 'dateFrom' ? getDefaultFromDate() : param.id === 'dateTo' ? getCurrentDate() : '')}
                        onChange={(e) => handleParameterChange(param.id, e.target.value)}
                        className="w-full"
                      />
                    )}
                    
                    {param.type === 'select' && param.options && (
                      <Select
                        value={parameters[param.id] || ''}
                        onValueChange={(value) => handleParameterChange(param.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${param.name.toLowerCase()}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {param.type === 'text' && (
                      <Input
                        id={param.id}
                        type="text"
                        value={parameters[param.id] || ''}
                        onChange={(e) => handleParameterChange(param.id, e.target.value)}
                        placeholder={`Enter ${param.name.toLowerCase()}...`}
                      />
                    )}
                    
                    {param.type === 'number' && (
                      <Input
                        id={param.id}
                        type="number"
                        value={parameters[param.id] || ''}
                        onChange={(e) => handleParameterChange(param.id, e.target.value)}
                        placeholder={`Enter ${param.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {selectedReport && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={!validateParameters() || isGenerating}
                className="min-w-[120px]"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
