import { Invoice, Supplier, Booking } from "@/types/invoice";

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

export const mockBookings: Booking[] = [
  {
    id: "booking-1",
    bookingNumber: "BK001",
    firstName: "John",
    lastName: "Doe",
    departureDate: "2023-07-15",
    confirmationNumber: "CNF001"
  },
  {
    id: "booking-2",
    bookingNumber: "BK002",
    firstName: "Jane",
    lastName: "Smith",
    departureDate: "2023-08-20",
    confirmationNumber: "CNF002"
  },
  {
    id: "booking-3",
    bookingNumber: "BK003",
    firstName: "Michael",
    lastName: "Johnson",
    departureDate: "2023-09-10",
    confirmationNumber: "CNF003"
  },
  {
    id: "booking-4",
    bookingNumber: "BK004",
    firstName: "Sarah",
    lastName: "Williams",
    departureDate: "2023-06-05",
    confirmationNumber: "CNF004"
  },
  {
    id: "booking-5",
    bookingNumber: "BK005",
    firstName: "David",
    lastName: "Brown",
    departureDate: "2023-10-12",
    confirmationNumber: "CNF005"
  },
  {
    id: "booking-6",
    bookingNumber: "BK006",
    firstName: "Lisa",
    lastName: "Davis",
    departureDate: "2023-11-25",
    confirmationNumber: "CNF006"
  },
  {
    id: "booking-7",
    bookingNumber: "BK007",
    firstName: "Robert",
    lastName: "Miller",
    departureDate: "2023-12-08",
    confirmationNumber: "CNF007"
  },
  {
    id: "booking-8",
    bookingNumber: "BK008",
    firstName: "Emily",
    lastName: "Wilson",
    departureDate: "2024-01-15",
    confirmationNumber: "CNF008"
  },
  {
    id: "booking-9",
    bookingNumber: "BK009",
    firstName: "Christopher",
    lastName: "Garcia",
    departureDate: "2024-02-22",
    confirmationNumber: "CNF009"
  },
  {
    id: "booking-10",
    bookingNumber: "BK010",
    firstName: "Amanda",
    lastName: "Martinez",
    departureDate: "2024-03-10",
    confirmationNumber: "CNF010"
  },
  {
    id: "booking-11",
    bookingNumber: "BK011",
    firstName: "James",
    lastName: "Anderson",
    departureDate: "2024-04-18",
    confirmationNumber: "CNF011"
  },
  {
    id: "booking-12",
    bookingNumber: "BK012",
    firstName: "Jessica",
    lastName: "Taylor",
    departureDate: "2024-05-22",
    confirmationNumber: "CNF012"
  },
  {
    id: "booking-13",
    bookingNumber: "BK013",
    firstName: "William",
    lastName: "Thomas",
    departureDate: "2024-06-14",
    confirmationNumber: "CNF013"
  },
  {
    id: "booking-14",
    bookingNumber: "BK014",
    firstName: "Ashley",
    lastName: "Jackson",
    departureDate: "2024-07-09",
    confirmationNumber: "CNF014"
  },
  {
    id: "booking-15",
    bookingNumber: "BK015",
    firstName: "Daniel",
    lastName: "White",
    departureDate: "2024-08-16",
    confirmationNumber: "CNF015"
  },
  {
    id: "booking-16",
    bookingNumber: "BK016",
    firstName: "Stephanie",
    lastName: "Harris",
    departureDate: "2024-09-23",
    confirmationNumber: "CNF016"
  },
  {
    id: "booking-17",
    bookingNumber: "BK017",
    firstName: "Matthew",
    lastName: "Martin",
    departureDate: "2024-10-11",
    confirmationNumber: "CNF017"
  },
  {
    id: "booking-18",
    bookingNumber: "BK018",
    firstName: "Nicole",
    lastName: "Thompson",
    departureDate: "2024-11-07",
    confirmationNumber: "CNF018"
  },
  {
    id: "booking-19",
    bookingNumber: "BK019",
    firstName: "Kevin",
    lastName: "Clark",
    departureDate: "2024-12-19",
    confirmationNumber: "CNF019"
  },
  {
    id: "booking-20",
    bookingNumber: "BK020",
    firstName: "Rachel",
    lastName: "Lewis",
    departureDate: "2025-01-25",
    confirmationNumber: "CNF020"
  },
  {
    id: "booking-21",
    bookingNumber: "BK021",
    firstName: "Brandon",
    lastName: "Lee",
    departureDate: "2025-02-14",
    confirmationNumber: "CNF021"
  },
  {
    id: "booking-22",
    bookingNumber: "BK022",
    firstName: "Megan",
    lastName: "Walker",
    departureDate: "2025-03-08",
    confirmationNumber: "CNF022"
  },
  {
    id: "booking-23",
    bookingNumber: "BK023",
    firstName: "Tyler",
    lastName: "Hall",
    departureDate: "2025-04-12",
    confirmationNumber: "CNF023"
  },
  {
    id: "booking-24",
    bookingNumber: "BK024",
    firstName: "Samantha",
    lastName: "Allen",
    departureDate: "2025-05-17",
    confirmationNumber: "CNF024"
  },
  {
    id: "booking-25",
    bookingNumber: "BK025",
    firstName: "Jonathan",
    lastName: "Young",
    departureDate: "2025-06-21",
    confirmationNumber: "CNF025"
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
    bookings: [mockBookings[0]],
    invoiceLines: [
      {
        id: "line-1-1",
        description: "Premium Server Hosting (Annual)",
        quantity: 1,
        unitPrice: 2000.00,
        estimatedCost: 2000.00,
        supplierId: mockSuppliers[0].id,
        supplierName: mockSuppliers[0].name,
        supplierPartNumber: "SRV-PREM-001",
        bookingNumber: "BK001",
        departureDate: "2023-07-15",
        paymentStatus: "paid"
      },
      {
        id: "line-1-2",
        description: "SSL Certificate (Annual)",
        quantity: 2,
        unitPrice: 250.00,
        estimatedCost: 500.00,
        supplierId: mockSuppliers[0].id,
        supplierName: mockSuppliers[0].name,
        supplierPartNumber: "SSL-STD-002",
        bookingNumber: "BK001",
        departureDate: "2023-07-15",
        paymentStatus: "paid"
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
    source: "Manual",
    bookings: [mockBookings[1], mockBookings[2]],
    invoiceLines: [
      {
        id: "line-2-1",
        description: "Office Supplies Bundle",
        quantity: 1,
        unitPrice: 750.50,
        estimatedCost: 750.50,
        supplierId: mockSuppliers[1].id,
        supplierName: mockSuppliers[1].name,
        supplierPartNumber: "OS-BDL-100",
        bookingNumber: "BK002",
        departureDate: "2023-08-20",
        paymentStatus: "unpaid"
      },
      {
        id: "line-2-2",
        description: "Premium Paper Reams",
        quantity: 15,
        unitPrice: 30.00,
        estimatedCost: 450.00,
        supplierId: mockSuppliers[1].id,
        supplierName: mockSuppliers[1].name,
        supplierPartNumber: "PPR-A4-PRE",
        bookingNumber: "BK003",
        departureDate: "2023-09-10",
        paymentStatus: "unpaid"
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
    source: "Manual",
    bookings: [mockBookings[3]],
    invoiceLines: [
      {
        id: "line-3-1",
        description: "Custom Parts Manufacturing",
        quantity: 50,
        unitPrice: 95.00,
        estimatedCost: 4750.00,
        supplierId: mockSuppliers[2].id,
        supplierName: mockSuppliers[2].name,
        supplierPartNumber: "CPM-XYZ-50",
        bookingNumber: "BK004",
        departureDate: "2023-06-05",
        paymentStatus: "partial"
      },
      {
        id: "line-3-2",
        description: "Rush Processing Fee",
        quantity: 1,
        unitPrice: 0.75,
        estimatedCost: 0.75,
        supplierId: mockSuppliers[2].id,
        supplierName: mockSuppliers[2].name,
        supplierPartNumber: "FEE-RUSH",
        bookingNumber: "BK004",
        departureDate: "2023-06-05",
        paymentStatus: "partial"
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
    source: "Manual",
    bookings: [mockBookings[4], mockBookings[5]],
    invoiceLines: [
      {
        id: "line-4-1",
        description: "Heavy Duty Printer",
        quantity: 1,
        unitPrice: 2700.00,
        estimatedCost: 2700.00,
        supplierId: mockSuppliers[3].id,
        supplierName: mockSuppliers[3].name,
        supplierPartNumber: "HDT-PR200",
        bookingNumber: "BK005",
        departureDate: "2023-10-12",
        paymentStatus: "unpaid"
      },
      {
        id: "line-4-2",
        description: "Extended Warranty",
        quantity: 1,
        unitPrice: 500.00,
        estimatedCost: 500.00,
        supplierId: mockSuppliers[3].id,
        supplierName: mockSuppliers[3].name,
        supplierPartNumber: "WAR-3YR",
        bookingNumber: "BK006",
        departureDate: "2023-11-25",
        paymentStatus: "unpaid"
      }
    ],
    updatedAt: "2023-05-20T12:00:00Z"
  }
];
