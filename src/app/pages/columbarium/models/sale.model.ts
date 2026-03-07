import { Customer } from "./customer.model";
import { Niche } from "./niche.model";

export interface Sale {
    _id: string;
    folio: string;
    niche: string | Niche;
    customer: string | Customer;
    user?: string;
    totalAmount: number;
    downPayment: number;
    balance: number;
    totalPaid: number; // Total pagado hasta ahora
    monthsToPay: number;
    interestRate: number;
    status: SaleStatus;
    schedule: AmortizationEntry[];
    cancellationInfo?: CancellationInfo; // Info de cancelacion
    createdAt: Date;
    updatedAt: Date;
}

export type SaleStatus = 'active' | 'paid' | 'cancelled' | 'overdue'; // AGREGADO 'overdue'

export interface AmortizationEntry {
    number: number;
    dueDate: Date;
    amount: number;
    amountPaid: number; // Cuanto se ha pagado de este pago
    amountRemaining: number; // Cuanto falta por pagar
    status: PaymentStatus;
    payments?: PaymentApplication[]; // Pagos aplicados a esta cuota (poblado en detalle)
}

// Vínculo entre un Payment y una entrada del schedule (colección separada)
export interface PaymentScheduleLink {
    _id: string;
    payment: string | PaymentSummary;
    amortEntry: string;
    appliedAmount: number;
    paidOn: Date;
}

export interface PaymentSummary {
    _id: string;
    amount: number;
    receiptNumber: string;
    method: 'cash' | 'card' | 'transfer';
    paymentDate: Date;
    notes?: string;
}

// Detalle de pago aplicado a una cuota
export interface PaymentApplication {
    paymentId: {
        _id: string;
        amount: number;
        receiptNumber: string;
        method: 'cash' | 'card' | 'transfer';
        paymentDate: Date;
        notes?: string;
    };
    appliedAmount: number;
    paidOn: Date;
}

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

// Info de cancelacion
export interface CancellationInfo {
    cancelledBy: string;
    cancelledAt: Date;
    reason: string;
    refundAmount: number;
    refundMethod: 'cash' | 'card' | 'transfer';
    refundNotes?: string;
}

export interface SalesStats {
    total: number;
    byStatus: {
        active: number;
        paid: number;
        cancelled: number;
        overdue: number;
    };
    revenue: {
        totalRevenue: number;
        totalPaid: number;
        totalBalance: number;
    };
}
