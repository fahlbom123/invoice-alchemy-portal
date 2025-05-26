
import { Invoice, Supplier } from "@/types/invoice";

export const mockSuppliers: Supplier[] = [
  {
    id: "supplier-1",
    name: "Tech Solutions Inc.",
    email: "contact@techsolutions.com",
    phone: "555-123-4567"
  },
  {
    id: "supplier-2",
    name: "Office Depot",
    email: "orders@officedepot.com",
    phone: "555-987-6543"
  },
  {
    id: "supplier-3",
    name: "Global Manufacturing Ltd.",
    email: "info@globalmanufacturing.com",
    phone: "555-456-7890"
  },
  {
    id: "supplier-4",
    name: "Best Equipment Co.",
    email: "sales@bestequipment.com",
    phone: "555-789-0123"
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: "invoice-1",
    invoiceNumber: "INV-2023-001",
    reference: "PO-456789",
    createdAt: "2023-05-10T12:00:00Z",
    dueDate: "2023-06-10T12:00:00Z",
    status: "paid",
    totalAmount: 2500.00,
    notes: "Payment received on time",
    supplier: mockSuppliers[0],
    source: "Fortnox",
    invoiceLines: [
      {
        id: "line-1-1",
        description: "Premium Server Hosting (Annual)",
        quantity: 1,
        unitPrice: 2000.00,
        estimatedCost: 2000.00,
        supplierId: mockSuppliers[0].id,
        supplierName: mockSuppliers[0].name,
        supplierPartNumber: "SRV-PREM-001"
      },
      {
        id: "line-1-2",
        description: "SSL Certificate (Annual)",
        quantity: 2,
        unitPrice: 250.00,
        estimatedCost: 500.00,
        supplierId: mockSuppliers[0].id,
        supplierName: mockSuppliers[0].name,
        supplierPartNumber: "SSL-STD-002"
      }
    ],
    updatedAt: "2023-05-10T12:00:00Z"
  },
  {
    id: "invoice-2",
    invoiceNumber: "INV-2023-002",
    reference: "PO-789123",
    createdAt: "2023-05-15T12:00:00Z",
    dueDate: "2023-06-15T12:00:00Z",
    status: "pending",
    totalAmount: 1200.50,
    notes: "",
    supplier: mockSuppliers[1],
    source: "Fortnox",
    invoiceLines: [
      {
        id: "line-2-1",
        description: "Office Supplies Bundle",
        quantity: 1,
        unitPrice: 750.50,
        estimatedCost: 750.50,
        supplierId: mockSuppliers[1].id,
        supplierName: mockSuppliers[1].name,
        supplierPartNumber: "OS-BDL-100"
      },
      {
        id: "line-2-2",
        description: "Premium Paper Reams",
        quantity: 15,
        unitPrice: 30.00,
        estimatedCost: 450.00,
        supplierId: mockSuppliers[1].id,
        supplierName: mockSuppliers[1].name,
        supplierPartNumber: "PPR-A4-PRE"
      }
    ],
    updatedAt: "2023-05-15T12:00:00Z"
  },
  {
    id: "invoice-3",
    invoiceNumber: "INV-2023-003",
    reference: "PO-246810",
    createdAt: "2023-04-25T12:00:00Z",
    dueDate: "2023-05-25T12:00:00Z",
    status: "overdue",
    totalAmount: 4750.75,
    notes: "Second reminder sent",
    supplier: mockSuppliers[2],
    source: "Fortnox",
    invoiceLines: [
      {
        id: "line-3-1",
        description: "Custom Parts Manufacturing",
        quantity: 50,
        unitPrice: 95.00,
        estimatedCost: 4750.00,
        supplierId: mockSuppliers[2].id,
        supplierName: mockSuppliers[2].name,
        supplierPartNumber: "CPM-XYZ-50"
      },
      {
        id: "line-3-2",
        description: "Rush Processing Fee",
        quantity: 1,
        unitPrice: 0.75,
        estimatedCost: 0.75,
        supplierId: mockSuppliers[2].id,
        supplierName: mockSuppliers[2].name,
        supplierPartNumber: "FEE-RUSH"
      }
    ],
    updatedAt: "2023-05-01T12:00:00Z"
  },
  {
    id: "invoice-4",
    invoiceNumber: "INV-2023-004",
    reference: "PO-135792",
    createdAt: "2023-05-20T12:00:00Z",
    dueDate: "2023-06-20T12:00:00Z",
    status: "pending",
    totalAmount: 3200.00,
    notes: "",
    supplier: mockSuppliers[3],
    source: "Fortnox",
    invoiceLines: [
      {
        id: "line-4-1",
        description: "Heavy Duty Printer",
        quantity: 1,
        unitPrice: 2700.00,
        estimatedCost: 2700.00,
        supplierId: mockSuppliers[3].id,
        supplierName: mockSuppliers[3].name,
        supplierPartNumber: "HDT-PR200"
      },
      {
        id: "line-4-2",
        description: "Extended Warranty",
        quantity: 1,
        unitPrice: 500.00,
        estimatedCost: 500.00,
        supplierId: mockSuppliers[3].id,
        supplierName: mockSuppliers[3].name,
        supplierPartNumber: "WAR-3YR"
      }
    ],
    updatedAt: "2023-05-20T12:00:00Z"
  }
];
