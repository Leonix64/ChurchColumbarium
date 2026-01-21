import { Customer } from "./customer.model";
import { Niche } from "./niche.model";

export interface Sale {
    _id: string;
    folio: string;
    niche: string | Niche; // Puede venir populated
    customer: string | Customer;
    user?: string; // Usuario que registro la venta
    totalAmount: number;
    downPayment: number;
    balance: number;
    monthsToPay: number;
    interestRate: number;
    status: SaleStatus;
    amortizationTable: AmortizationEntry[];
    createdAt: Date;
    updatedAt: Date;
}

// Estado de las ventas
export type SaleStatus = 'active' | 'paid' | 'cancelled';

// Tabla de pago mensual programado
export interface AmortizationEntry {
    number: number;        // Número de cuota (1-18)
    dueDate: Date;        // Fecha de vencimiento
    amount: number;       // Monto a pagar
    status: PaymentStatus;
    paymentReference?: string; // ID del Payment cuando se paga
}

// Estado de los pagos
export type PaymentStatus = 'pending' | 'paid' | 'overdue';

// Estadisticas de ventas
export interface SalesStats {
    total: number;
    byStatus: {
        active: number;
        paid: number;
        cancelled: number;
    };
    revenue: {
        totalRevenue: number;
        totalDownPayments: number;
        totalBalance: number;
    };
}