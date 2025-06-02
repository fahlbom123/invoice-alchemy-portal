
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Invoice, InvoiceLine, InvoiceLineWithReference } from "@/types/invoice";

export function useSupabaseInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInvoices = async () => {
    setIsLoading(true);
    
    try {
      // Fetch invoices with suppliers and invoice lines
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          suppliers (*),
          invoice_lines (*)
        `)
        .order('created_at', { ascending: false });
      
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        setInvoices([]);
        return;
      }

      // Transform database format to match our interface
      const transformedInvoices: Invoice[] = invoicesData.map(invoice => ({
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
        updatedAt: invoice.updated_at,
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
          country: invoice.suppliers.country
        },
        invoiceLines: invoice.invoice_lines.map((line: any) => ({
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
        }))
      }));

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
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            suppliers (*),
            invoice_lines (*)
          `)
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching invoice:', error);
          setInvoice(null);
          return;
        }

        // Transform to match our interface (same logic as above)
        const transformedInvoice: Invoice = {
          id: data.id,
          invoiceNumber: data.invoice_number,
          reference: data.reference,
          createdAt: data.created_at,
          dueDate: data.due_date,
          invoiceDate: data.invoice_date,
          status: data.status,
          totalAmount: parseFloat(String(data.total_amount || '0')),
          notes: data.notes,
          currency: data.currency,
          vat: parseFloat(String(data.vat || '0')),
          totalVat: parseFloat(String(data.total_vat || '0')),
          ocr: data.ocr,
          source: data.source as "Fortnox" | "Manual",
          account: data.account,
          updatedAt: data.updated_at,
          supplier: {
            id: data.suppliers.id,
            name: data.suppliers.name,
            email: data.suppliers.email,
            phone: data.suppliers.phone,
            accountNumber: data.suppliers.account_number,
            defaultCurrency: data.suppliers.default_currency,
            currencyRate: data.suppliers.currency_rate,
            address: data.suppliers.address,
            zipCode: data.suppliers.zip_code,
            city: data.suppliers.city,
            country: data.suppliers.country
          },
          invoiceLines: data.invoice_lines.map((line: any) => ({
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
          }))
        };

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
  const { invoices, isLoading } = useSupabaseInvoices();
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
