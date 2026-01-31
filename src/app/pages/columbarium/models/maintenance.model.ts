export interface MaintenancePayment {
    _id: string;
    receiptNumber: string;
    amount: number;
    method: 'cash' | 'card' | 'transfer';
    maintenanceYear: number;
    paymentDate: Date;
    notes?: string;
    niche: {
        _id: string;
        code: string;
        displayNumber: number;
        module: string;
        section: string;
    };
    customer: {  // Propietario al momento del pago
        _id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    registeredBy?: {
        username: string;
        fullName: string;
    };
    createdAt: Date;
}