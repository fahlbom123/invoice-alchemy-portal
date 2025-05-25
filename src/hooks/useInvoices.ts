
import { useState, useEffect } from "react";
import { Invoice, InvoiceLine, InvoiceLineWithReference } from "@/types/invoice";
import { mockInvoices } from "@/data/mockData";

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = () => {
    setIsLoading(true);
    
    try {
      // Load invoices from localStorage or use mock data
      const savedInvoices = localStorage.getItem('invoices');
      const data = savedInvoices ? JSON.parse(savedInvoices) : mockInvoices;
      setInvoices(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices(mockInvoices);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadInvoices();

    // Listen for storage changes (when other tabs/components update localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'invoices') {
        loadInvoices();
      }
    };

    // Listen for custom events (when same tab updates localStorage)
    const handleInvoiceUpdate = () => {
      loadInvoices();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('invoicesUpdated', handleInvoiceUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('invoicesUpdated', handleInvoiceUpdate);
    };
  }, []);

  return { invoices, isLoading };
}

export function useInvoiceById(id: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchInvoice = () => {
      setIsLoading(true);
      
      try {
        // Simulate API delay
        setTimeout(() => {
          // Load invoices from localStorage or use mock data
          const savedInvoices = localStorage.getItem('invoices');
          const invoices = savedInvoices ? JSON.parse(savedInvoices) : mockInvoices;
          const foundInvoice = invoices.find((inv: Invoice) => inv.id === id) || null;
          setInvoice(foundInvoice);
          setIsLoading(false);
        }, 300);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        setInvoice(null);
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  return { invoice, isLoading };
}

export function useSaveInvoice() {
  const [isLoading, setIsLoading] = useState(false);

  const saveInvoice = async (invoiceData: any) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get existing invoices from localStorage
      const savedInvoices = localStorage.getItem('invoices');
      let invoices = savedInvoices ? JSON.parse(savedInvoices) : mockInvoices;
      
      // Check if this is an update or a new invoice
      const index = invoices.findIndex((inv: Invoice) => inv.id === invoiceData.id);
      
      if (index !== -1) {
        // Update existing invoice
        invoices[index] = invoiceData;
      } else {
        // Add new invoice
        invoices.push(invoiceData);
      }
      
      // Save back to localStorage
      localStorage.setItem('invoices', JSON.stringify(invoices));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error saving invoice:', error);
      setIsLoading(false);
      throw error;
    }
  };

  return { saveInvoice, isLoading };
}

export function useInvoiceLines() {
  const { invoices, isLoading } = useInvoices();
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineWithReference[]>([]);
  
  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
      const allLines = invoices.flatMap(invoice => 
        invoice.invoiceLines.map(line => ({
          ...line,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber
        }))
      );
      setInvoiceLines(allLines);
    }
  }, [invoices, isLoading]);
  
  return { invoiceLines, isLoading };
}
