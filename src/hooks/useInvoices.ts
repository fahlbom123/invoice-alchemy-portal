
import { useSupabaseInvoices, useSupabaseInvoiceById, useSupabaseInvoiceLines } from "./useSupabaseInvoices";
import { supabase } from "@/integrations/supabase/client";
import { Invoice } from "@/types/invoice";

export function useInvoices() {
  return useSupabaseInvoices();
}

export function useInvoiceById(id: string) {
  return useSupabaseInvoiceById(id);
}

export function useInvoiceLines() {
  return useSupabaseInvoiceLines();
}

export function useSaveInvoice() {
  const saveInvoice = async (invoice: Invoice) => {
    try {
      // For new invoices, don't include the ID - let the database generate it
      const invoiceData = {
        invoice_number: invoice.invoiceNumber,
        reference: invoice.reference,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate,
        status: invoice.status,
        total_amount: invoice.totalAmount,
        currency: invoice.currency,
        vat: invoice.vat,
        total_vat: invoice.totalVat,
        notes: invoice.notes,
        ocr: invoice.ocr,
        source: invoice.source,
        account: invoice.account,
        supplier_id: invoice.supplier.id,
        project_id: invoice.projectId || null,
        updated_at: new Date().toISOString()
      };

      // Only include ID if it's a valid UUID (for updates)
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoice.id);
      if (isValidUUID) {
        (invoiceData as any).id = invoice.id;
      }

      const { data: savedInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .upsert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error('Error saving invoice:', invoiceError);
        // Handle duplicate invoice number error specifically
        if (invoiceError.code === '23505' && invoiceError.message.includes('invoice_number_key')) {
          throw new Error(`Invoice number "${invoice.invoiceNumber}" already exists for this supplier. Please use a different invoice number.`);
        }
        throw invoiceError;
      }

      console.log('Invoice saved successfully:', savedInvoice);
      return savedInvoice;
    } catch (error) {
      console.error('Error in saveInvoice:', error);
      throw error;
    }
  };

  return {
    saveInvoice,
    isLoading: false
  };
}
