import { Customer } from "./customer.model";
import { Niche } from "./niche.model";

export interface Sale {
    _id: string;
    folio: string;
    niche: string | Niche; // Puede venir populated
    customer: string | Customer;
    totalAmount: number;
    downPayment: number;
    balance: number;
    monthsToPay: number;
    amortizationTable: AmortizationEntry[];
    status: 'pending' | 'paid' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

export interface AmortizationEntry {
    number: number;
    dueDate: Date;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
    paymentReference?: string;
}