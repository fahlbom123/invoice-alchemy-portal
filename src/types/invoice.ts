
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountNumber?: string;
  defaultCurrency?: string;
  currencyRate?: number;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  estimatedCost: number;
  actualCost?: number;
  supplierId: string;
  supplierName: string;
  supplierPartNumber: string;
  bookingNumber?: string;
  confirmationNumber?: string;
  departureDate?: string;
  paymentStatus?: "paid" | "unpaid" | "partial";
  fullyInvoiced?: boolean;
  currency?: string;
  invoiceType?: "single" | "multi";
  estimatedVat?: number;
  actualVat?: number;
  selected?: boolean;
}

// Extended invoice line with invoice reference
export interface InvoiceLineWithReference extends InvoiceLine {
  invoiceId: string;
  invoiceNumber: string;
}

// Supplier invoice line that links to original invoice lines
export interface SupplierInvoiceLine {
  id: string;
  originalInvoiceLineId: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  description: string;
  actualCost: number;
  actualVat: number;
  currency: string;
  registeredAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  reference: string;
  createdAt: string;
  dueDate: string;
  invoiceDate?: string;
  status: string;
  totalAmount: number;
  notes?: string;
  supplier: Supplier;
  invoiceLines: InvoiceLine[];
  supplierInvoiceLines?: SupplierInvoiceLine[];
  registeredTotalActualCost?: number;
  registeredTotalActualVat?: number;
  updatedAt: string;
  currency?: string;
  vat?: number;
  totalVat?: number;
  ocr?: string;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  reference: string;
  dueDate: string;
  invoiceDate?: string;
  status: string;
  supplierId: string;
  notes: string;
  invoiceLines: InvoiceLine[];
  currency?: string;
  vat?: number;
  totalAmount?: number;
  totalVat?: number;
  ocr?: string;
}
