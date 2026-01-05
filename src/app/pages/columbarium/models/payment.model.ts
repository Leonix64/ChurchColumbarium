export interface Payment {
    _id: string;
    sale: string;
    customer: string;
    receiptNumber: string;
    amount: number;
    concept: 'down_payment' | 'monthly_payment' | 'maintenance' | 'extra';
    method: 'cash' | 'card' | 'transfer';
    paymentDate: Date;
    notes?: string;
    createdAt: Date;
}