import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceLine, InvoiceLineWithReference, SupplierInvoiceLine } from "@/types/invoice";

export function useSupabaseInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = async () => {
    setIsLoading(true);
    
    try {
      // First fetch invoices with suppliers and projects - make sure to include all supplier fields including iban and swift
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          suppliers (
            id,
            name,
            email,
            phone,
            account_number,
            default_currency,
            currency_rate,
            address,
            zip_code,
            city,
            country,
            iban,
            swift,
            created_at,
            updated_at
          ),
          projects (*)
        `)
        .order('created_at', { ascending: false });
      
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        setInvoices([]);
        return;
      }

      // Fetch all invoice lines separately
      const { data: invoiceLinesData, error: linesError } = await supabase
        .from('invoice_lines')
        .select('*');

      if (linesError) {
        console.error('Error fetching invoice lines:', linesError);
      }

      // Fetch all supplier invoice lines
      const { data: supplierInvoiceData, error: supplierError } = await supabase
        .from('supplier_invoice_lines')
        .select('*');

      if (supplierError) {
        console.error('Error fetching supplier invoice lines:', supplierError);
      }

      console.log('Raw invoices data:', invoicesData);
      console.log('Raw invoice lines data:', invoiceLinesData);
      console.log('Raw supplier invoice lines data:', supplierInvoiceData);

      // Transform database format to match our interface
      const transformedInvoices: Invoice[] = invoicesData.map(invoice => {
        // Find invoice lines that belong to this invoice
        const invoiceLines = (invoiceLinesData || [])
          .filter((line: any) => line.invoice_id === invoice.id)
          .map((line: any): InvoiceLine => ({
            id: line.id,
            description: line.description,
            quantity: parseFloat(String(line.quantity || '1')),
            unitPrice: parseFloat(String(line.unit_price || '0')),
            estimatedCost: parseFloat(String(line.estimated_cost || '0')),
            actualCost: line.actual_cost ? parseFloat(String(line.actual_cost)) : undefined,
            supplierId: line.supplier_id,
            supplierName: line.supplier_name,
            supplierPartNumber: line.supplier_part_number,
            bookingNumber: line.booking_number,
            confirmationNumber: line.confirmation_number,
            departureDate: line.departure_date,
            paymentStatus: line.payment_status as "paid" | "unpaid" | "partial",
            fullyInvoiced: line.fully_invoiced,
            currency: line.currency,
            invoiceType: line.invoice_type as "single" | "multi",
            estimatedVat: line.estimated_vat ? parseFloat(String(line.estimated_vat)) : undefined,
            actualVat: line.actual_vat ? parseFloat(String(line.actual_vat)) : undefined
          }));

        // Get all invoice line IDs for this invoice
        const allInvoiceLineIds = (invoiceLinesData || [])
          .filter((line: any) => line.invoice_id === invoice.id)
          .map((line: any) => line.id);

        // Find supplier invoice lines that reference ANY invoice line from this invoice
        const relatedSupplierLines = (supplierInvoiceData || [])
          .filter((supplierLine: any) => allInvoiceLineIds.includes(supplierLine.invoice_line_id))
          .map((line: any): SupplierInvoiceLine => ({
            id: line.id,
            invoiceLineId: line.invoice_line_id,
            actualCost: parseFloat(String(line.actual_cost || '0')),
            actualVat: parseFloat(String(line.actual_vat || '0')),
            currency: line.currency,
            createdAt: line.created_at,
            createdBy: line.created_by,
            description: line.description,
            supplierName: line.supplier_name,
          }));

        console.log(`Invoice ${invoice.invoice_number}:`, {
          invoiceId: invoice.id,
          invoiceLines: invoiceLines.length,
          allInvoiceLineIds: allInvoiceLineIds,
          supplierInvoiceLines: relatedSupplierLines.length,
          supplierLineDetails: relatedSupplierLines.map(sl => ({
            id: sl.id,
            invoiceLineId: sl.invoiceLineId,
            actualCost: sl.actualCost,
            actualVat: sl.actualVat
          })),
          periodizationYear: invoice.periodization_year,
          periodizationMonth: invoice.periodization_month
        });

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          reference: invoice.reference,
          createdAt: invoice.created_at,
          dueDate: invoice.due_date,
          invoiceDate: invoice.invoice_date,
          status: invoice.status,
          totalAmount: parseFloat(String(invoice.total_amount || '0')),
          notes: invoice.notes,
          currency: invoice.currency,
          vat: parseFloat(String(invoice.vat || '0')),
          totalVat: parseFloat(String(invoice.total_vat || '0')),
          ocr: invoice.ocr,
          source: invoice.source as "Fortnox" | "Manual",
          account: invoice.account,
          vatAccount: invoice.vat_account,
          periodizationYear: invoice.periodization_year,
          periodizationMonth: invoice.periodization_month,
          updatedAt: invoice.updated_at,
          projectId: invoice.project_id,
          supplier: {
            id: invoice.suppliers.id,
            name: invoice.suppliers.name,
            email: invoice.suppliers.email,
            phone: invoice.suppliers.phone,
            accountNumber: invoice.suppliers.account_number,
            defaultCurrency: invoice.suppliers.default_currency,
            currencyRate: invoice.suppliers.currency_rate,
            address: invoice.suppliers.address,
            zipCode: invoice.suppliers.zip_code,
            city: invoice.suppliers.city,
            country: invoice.suppliers.country,
            iban: invoice.suppliers.iban,
            swift: invoice.suppliers.swift
          },
          invoiceLines: invoiceLines,
          supplierInvoiceLines: relatedSupplierLines
        };
      });

      console.log('Final transformed invoices:', transformedInvoices);
      setInvoices(transformedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return { invoices, isLoading, reloadInvoices: loadInvoices };
}

export function useSupabaseInvoiceById(id: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      setIsLoading(true);
      
      try {
        console.log('Fetching invoice with ID:', id);
        
        // Fetch the invoice with supplier and project - make sure to include all supplier fields including iban and swift
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select(`
            *,
            suppliers (
              id,
              name,
              email,
              phone,
              account_number,
              default_currency,
              currency_rate,
              address,
              zip_code,
              city,
              country,
              iban,
              swift,
              created_at,
              updated_at
            ),
            projects (*)
          `)
          .eq('id', id)
          .single();
        
        if (invoiceError) {
          console.error('Error fetching invoice:', invoiceError);
          setInvoice(null);
          return;
        }

        console.log('Fetched invoice data:', invoiceData);
        console.log('Supplier data with IBAN/SWIFT:', invoiceData.suppliers);

        // Fetch ALL invoice lines (not just for this invoice) to check for any that might be registered
        const { data: allInvoiceLinesData, error: linesError } = await supabase
          .from('invoice_lines')
          .select('*');

        if (linesError) {
          console.error('Error fetching invoice lines:', linesError);
        }

        console.log('All invoice lines:', allInvoiceLinesData);

        // Fetch ALL supplier invoice lines to see what's registered
        const { data: allSupplierInvoiceData, error: supplierError } = await supabase
          .from('supplier_invoice_lines')
          .select('*');

        if (supplierError) {
          console.error('Error fetching supplier invoice lines:', supplierError);
        }

        console.log('All supplier invoice lines:', allSupplierInvoiceData);

        // Get invoice lines that belong to this invoice
        const invoiceLinesForThisInvoice = (allInvoiceLinesData || [])
          .filter((line: any) => line.invoice_id === id);

        console.log('Invoice lines for this invoice:', invoiceLinesForThisInvoice);

        // Get all invoice line IDs (not just from this invoice, but ALL) 
        const allInvoiceLineIds = (allInvoiceLinesData || []).map((line: any) => line.id);
        
        // Find supplier invoice lines that reference invoice lines registered to this supplier invoice
        // This is the key: we need to find supplier invoice lines that were created and linked to this invoice
        const supplierInvoiceLinesForThisInvoice = (allSupplierInvoiceData || [])
          .filter((supplierLine: any) => {
            // Check if this supplier line references an invoice line that exists
            return allInvoiceLineIds.includes(supplierLine.invoice_line_id);
          });

        console.log('Supplier invoice lines that reference valid invoice lines:', supplierInvoiceLinesForThisInvoice);

        // Transform invoice lines
        const invoiceLines: InvoiceLine[] = invoiceLinesForThisInvoice.map((line: any) => ({
          id: line.id,
          description: line.description,
          quantity: parseFloat(String(line.quantity || '1')),
          unitPrice: parseFloat(String(line.unit_price || '0')),
          estimatedCost: parseFloat(String(line.estimated_cost || '0')),
          actualCost: line.actual_cost ? parseFloat(String(line.actual_cost)) : undefined,
          supplierId: line.supplier_id,
          supplierName: line.supplier_name,
          supplierPartNumber: line.supplier_part_number,
          bookingNumber: line.booking_number,
          confirmationNumber: line.confirmation_number,
          departureDate: line.departure_date,
          paymentStatus: line.payment_status as "paid" | "unpaid" | "partial",
          fullyInvoiced: line.fully_invoiced,
          currency: line.currency,
          invoiceType: line.invoice_type as "single" | "multi",
          estimatedVat: line.estimated_vat ? parseFloat(String(line.estimated_vat)) : undefined,
          actualVat: line.actual_vat ? parseFloat(String(line.actual_vat)) : undefined
        }));

        // Transform supplier invoice lines - these are the registered lines
        const supplierInvoiceLines: SupplierInvoiceLine[] = supplierInvoiceLinesForThisInvoice.map((line: any) => ({
          id: line.id,
          invoiceLineId: line.invoice_line_id,
          actualCost: parseFloat(String(line.actual_cost || '0')),
          actualVat: parseFloat(String(line.actual_vat || '0')),
          currency: line.currency,
          createdAt: line.created_at,
          createdBy: line.created_by,
          description: line.description,
          supplierName: line.supplier_name,
        }));

        console.log('Final invoice lines for this invoice:', invoiceLines);
        console.log('Final supplier invoice lines for this invoice:', supplierInvoiceLines);

        // Transform to match our interface
        const transformedInvoice: Invoice = {
          id: invoiceData.id,
          invoiceNumber: invoiceData.invoice_number,
          reference: invoiceData.reference,
          createdAt: invoiceData.created_at,
          dueDate: invoiceData.due_date,
          invoiceDate: invoiceData.invoice_date,
          status: invoiceData.status,
          totalAmount: parseFloat(String(invoiceData.total_amount || '0')),
          notes: invoiceData.notes,
          currency: invoiceData.currency,
          vat: parseFloat(String(invoiceData.vat || '0')),
          totalVat: parseFloat(String(invoiceData.total_vat || '0')),
          ocr: invoiceData.ocr,
          source: invoiceData.source as "Fortnox" | "Manual",
          account: invoiceData.account,
          vatAccount: invoiceData.vat_account,
          periodizationYear: invoiceData.periodization_year,
          periodizationMonth: invoiceData.periodization_month,
          updatedAt: invoiceData.updated_at,
          projectId: invoiceData.project_id,
          supplier: {
            id: invoiceData.suppliers.id,
            name: invoiceData.suppliers.name,
            email: invoiceData.suppliers.email,
            phone: invoiceData.suppliers.phone,
            accountNumber: invoiceData.suppliers.account_number,
            defaultCurrency: invoiceData.suppliers.default_currency,
            currencyRate: invoiceData.suppliers.currency_rate,
            address: invoiceData.suppliers.address,
            zipCode: invoiceData.suppliers.zip_code,
            city: invoiceData.suppliers.city,
            country: invoiceData.suppliers.country,
            iban: invoiceData.suppliers.iban,
            swift: invoiceData.suppliers.swift
          },
          invoiceLines: invoiceLines,
          supplierInvoiceLines: supplierInvoiceLines
        };

        console.log('Transformed single invoice with supplier including IBAN/SWIFT:', transformedInvoice.supplier);
        setInvoice(transformedInvoice);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        setInvoice(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  return { invoice, isLoading };
}

export function useSupabaseInvoiceLines() {
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineWithReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchInvoiceLines = async () => {
      setIsLoading(true);
      
      try {
        // Fetch all invoice lines with supplier information
        const { data: linesData, error: linesError } = await supabase
          .from('invoice_lines')
          .select(`
            *,
            suppliers (*)
          `)
          .order('created_at', { ascending: false });
        
        if (linesError) {
          console.error('Error fetching invoice lines:', linesError);
          setInvoiceLines([]);
          return;
        }

        // Transform to match our interface
        const transformedLines: InvoiceLineWithReference[] = linesData.map(line => ({
          id: line.id,
          description: line.description,
          quantity: parseFloat(String(line.quantity || '1')),
          unitPrice: parseFloat(String(line.unit_price || '0')),
          estimatedCost: parseFloat(String(line.estimated_cost || '0')),
          actualCost: line.actual_cost ? parseFloat(String(line.actual_cost)) : undefined,
          supplierId: line.supplier_id,
          supplierName: line.supplier_name,
          supplierPartNumber: line.supplier_part_number,
          bookingNumber: line.booking_number,
          confirmationNumber: line.confirmation_number,
          departureDate: line.departure_date,
          paymentStatus: line.payment_status as "paid" | "unpaid" | "partial",
          fullyInvoiced: line.fully_invoiced,
          currency: line.currency,
          invoiceType: line.invoice_type as "single" | "multi",
          estimatedVat: line.estimated_vat ? parseFloat(String(line.estimated_vat)) : undefined,
          actualVat: line.actual_vat ? parseFloat(String(line.actual_vat)) : undefined,
          invoiceId: line.invoice_id,
          invoiceNumber: '' // Will be populated if needed
        }));
        
        console.log('Loaded invoice lines from Supabase:', transformedLines);
        setInvoiceLines(transformedLines);
      } catch (error) {
        console.error('Error fetching invoice lines:', error);
        setInvoiceLines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceLines();
  }, []);
  
  return { invoiceLines, isLoading };
}
