export interface MaintenancePayment {
    _id: string;
    receiptNumber: string;
    amount: number;
    method: 'cash' | 'card' | 'transfer';
    maintenanceYear: number;
    paymentDate: Date;
    notes?: string;
    registeredBy?: {
        username: string;
        fullName: string;
    };
    createdAt: Date;
}