
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
      // Save or update the main invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .upsert({
          id: invoice.id,
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
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Error saving invoice:', invoiceError);
        throw invoiceError;
      }

      console.log('Invoice saved successfully:', invoiceData);
      return invoiceData;
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
