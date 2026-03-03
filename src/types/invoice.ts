export interface InvoiceItem {
    id: number;
    invoiceId: number;
    description: string;
    itemType: string; // 'PACKAGE', 'ADDON', 'DISCOUNT'
    amount: string | number; // Decimal comes as string often
}

export interface Invoice {
    id: number;
    invoiceNumber: string;
    customerId: number;
    category: string;
    type: string;
    period: string; // Date string
    amount: string | number;
    status: string; // 'UNPAID', 'PAID', 'VOID'

    transactionId?: number | null;
    tanggalJatuhTempo: string;
    hariToleransi: number;
    createdAt: string;
    updatedAt: string;

    items: InvoiceItem[];
    customer?: any; // Avoiding circular dependency complexity, use any or import Customer
    transaction?: any;
}

export interface Transaction {
    id: number;
    referenceNo: string;
    amountPaid: string | number;
    paymentMethod: string;
    adminId: string;
    customerId?: number;
    createdAt: string;

    invoices?: Invoice[];
    admin?: any;
    customer?: any;
}

export interface PromiseToPay {
    id: number;
    customerId: number;
    invoiceId?: number;
    promiseDate: string;
    note?: string;
    status: 'WAITING' | 'PAID' | 'BROKEN' | 'CANCELLED';
    adminId: string;
    createdAt: string;
    updatedAt: string;

    customer?: any;
    invoice?: Invoice;
    admin?: any;
}
