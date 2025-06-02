
import { useSupabaseInvoices, useSupabaseInvoiceById, useSupabaseInvoiceLines } from "./useSupabaseInvoices";

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
  // This will be implemented later when we need to save invoices
  return {
    saveInvoice: async () => {
      throw new Error("Save functionality not implemented yet");
    },
    isLoading: false
  };
}
