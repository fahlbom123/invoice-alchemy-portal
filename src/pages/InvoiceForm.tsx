import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInvoiceById, useSaveInvoice, useInvoices } from "@/hooks/useInvoices";
import { useSupabaseProjects } from "@/hooks/useSupabaseProjects";
import { InvoiceFormData } from "@/types/invoice";
import SupplierSelector from "@/components/invoice/SupplierSelector";
import SupplierDetails from "@/components/invoice/SupplierDetails";
import InvoiceHeaderForm from "@/components/invoice/InvoiceHeaderForm";
import ProjectSelector from "@/components/invoice/ProjectSelector";

interface Project {
  id: string;
  projectNumber: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
}

const InvoiceForm = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { invoice, isLoading: isLoadingInvoice } = useInvoiceById(id || "");
  const { invoices } = useInvoices();
  const { suppliers, isLoading: isLoadingSuppliers } = useSuppliers();
  const { projects, isLoading: isLoadingProjects } = useSupabaseProjects();
  const { saveInvoice, isLoading: isSaving } = useSaveInvoice();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: "",
    reference: "",
    status: "unpaid",
    dueDate: new Date().toISOString().split('T')[0],
    supplierId: "",
    notes: "",
    invoiceLines: [],
    invoiceDate: new Date().toISOString().split('T')[0],
    currency: "USD",
    totalAmount: 0,
    totalVat: 0,
    ocr: "",
    account: "4010",
    vatAccount: "2641",
    periodizationYear: new Date().getFullYear(),
    periodizationMonth: new Date().getMonth() + 1,
  });

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);

  // Get the selected supplier details
  const selectedSupplier = formData.supplierId 
    ? suppliers.find(s => s.id === formData.supplierId) 
    : null;

  // Load invoice data when editing
  useEffect(() => {
    if (invoice && isEditing) {
      console.log('Loading invoice data for editing:', {
        vatAccount: invoice.vatAccount,
        account: invoice.account
      });
      
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        reference: invoice.reference,
        status: invoice.status,
        dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
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
        account: invoice.account || "4010",
        vatAccount: invoice.vatAccount || "2641", // Ensure default if null
        periodizationYear: invoice.periodizationYear || new Date().getFullYear(),
        periodizationMonth: invoice.periodizationMonth || new Date().getMonth() + 1,
        projectId: invoice.projectId,
      });
    }
  }, [invoice, isEditing]);

  // Load project when projects are available and we have a projectId
  useEffect(() => {
    if (projects.length > 0 && formData.projectId && !selectedProject) {
      const project = projects.find(p => p.id === formData.projectId);
      if (project) {
        setSelectedProject({
          id: project.id,
          projectNumber: project.projectNumber,
          description: project.description,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate
        });
      }
    }
  }, [projects, formData.projectId, selectedProject]);

  if ((isLoadingInvoice && isEditing) || isLoadingSuppliers || isLoadingProjects) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const checkForDuplicateInvoiceNumber = (invoiceNumber: string, supplierId: string) => {
    if (!invoiceNumber || !supplierId || isEditing) return false;
    
    return invoices.some(invoice => 
      invoice.invoiceNumber === invoiceNumber && 
      invoice.supplier.id === supplierId
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? 0 : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log('handleSelectChange called:', { name, value });
    if (name === 'periodizationYear' || name === 'periodizationMonth') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData(prev => {
        const updatedData = { ...prev, [name]: value };
        console.log('Updated formData after change:', { 
          field: name, 
          newValue: value, 
          vatAccount: updatedData.vatAccount,
          account: updatedData.account 
        });
        return updatedData;
      });
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    setFormData(prev => ({ ...prev, supplierId }));
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setFormData(prev => ({ ...prev, projectId: project.id }));
  };

  const handleProjectRemove = () => {
    setSelectedProject(null);
    setFormData(prev => ({ ...prev, projectId: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    const supplier = suppliers.find(s => s.id === formData.supplierId);
    if (!supplier) {
      toast.error("Invalid supplier selected");
      return;
    }

    // Check for duplicate invoice number only for new invoices
    if (!isEditing && checkForDuplicateInvoiceNumber(formData.invoiceNumber, formData.supplierId)) {
      const completeFormData = {
        ...formData,
        status: "unpaid",
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: selectedProject?.id,
        supplier: {
          id: supplier.id,
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          accountNumber: supplier.accountNumber,
          defaultCurrency: supplier.defaultCurrency,
          currencyRate: supplier.currencyRate,
          address: supplier.address,
          zipCode: supplier.zipCode,
          city: supplier.city,
          country: supplier.country
        }
      };
      
      setPendingSubmitData(completeFormData);
      setShowDuplicateWarning(true);
      return;
    }

    // Proceed with normal submission
    await proceedWithSubmission();
  };

  const proceedWithSubmission = async (forceSave = false) => {
    const supplier = suppliers.find(s => s.id === formData.supplierId)!;
    
    console.log('Submitting with formData - FINAL CHECK:', {
      account: formData.account,
      vatAccount: formData.vatAccount,
      fullFormData: formData
    });
    
    const submitData = {
      ...formData,
      status: isEditing ? formData.status : "unpaid",
      id: isEditing ? id! : crypto.randomUUID(),
      createdAt: isEditing ? invoice!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalAmount: formData.totalAmount || 0,
      invoiceLines: formData.invoiceLines || [],
      dueDate: formData.dueDate,
      projectId: selectedProject?.id,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        accountNumber: supplier.accountNumber,
        defaultCurrency: supplier.defaultCurrency,
        currencyRate: supplier.currencyRate,
        address: supplier.address,
        zipCode: supplier.zipCode,
        city: supplier.city,
        country: supplier.country
      }
    };

    console.log('Complete form data being saved:', {
      account: submitData.account,
      vatAccount: submitData.vatAccount
    });

    try {
      await saveInvoice(submitData);
      toast.success(isEditing ? "Invoice updated successfully" : "Invoice created successfully");
      
      if (isEditing && id) {
        navigate(`/invoices/view/${id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Show user-friendly error message for duplicate invoice numbers
      if (error.message && error.message.includes('already exists')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save invoice. Please try again.");
      }
    } finally {
      setPendingSubmitData(null);
      setShowDuplicateWarning(false);
    }
  };

  const handleCancel = () => {
    if (isEditing && id) {
      navigate(`/invoices/view/${id}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleDuplicateWarningCancel = () => {
    setShowDuplicateWarning(false);
    setPendingSubmitData(null);
  };

  const handleDuplicateWarningContinue = () => {
    proceedWithSubmission(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={handleCancel}>
            Back to Dashboard
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{isEditing ? "Edit Supplier Invoice" : "Create New Supplier Invoice"}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <SupplierSelector 
                  supplierId={formData.supplierId}
                  suppliers={suppliers}
                  onSelectSupplier={handleSupplierChange}
                />

                {selectedSupplier && <SupplierDetails supplier={selectedSupplier} />}

                <InvoiceHeaderForm 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleNumberInputChange={handleNumberInputChange}
                  handleSelectChange={handleSelectChange}
                />

                <Separator />

                <ProjectSelector
                  selectedProject={selectedProject}
                  onProjectSelect={handleProjectSelect}
                  onProjectRemove={handleProjectRemove}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update Supplier Invoice" : "Create Supplier Invoice"}
            </Button>
          </div>
        </form>

        <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Duplicate Invoice Number</AlertDialogTitle>
              <AlertDialogDescription>
                An invoice with the number "{formData.invoiceNumber}" already exists for this supplier. 
                Do you want to continue with this duplicate invoice number or cancel to change it?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleDuplicateWarningCancel}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDuplicateWarningContinue}>
                Continue Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default InvoiceForm;
