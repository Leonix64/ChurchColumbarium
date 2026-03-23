export interface Payment {
    _id: string;
    sale?: string;      // Sale ID — opcional: mantenimiento no tiene venta asociada
    customer?: string;  // Customer ID
    niche?: string;     // Niche ID — requerido solo para pagos de mantenimiento
    registeredBy?: string; // User ID que registró el pago
    receiptNumber: string; // Folio unico del pago
    amount: number;
    balanceBefore?: number; // Balance de la venta antes del pago
    balanceAfter?: number;  // Balance de la venta después del pago
    concept: PaymentConcept;
    method: PaymentMethod;
    paymentDate: Date;
    maintenanceYear?: number; // Solo para pagos de mantenimiento
    notes?: string;
    status?: PaymentStatus; // Estado del pago
    cancellationInfo?: {    // Presente si status === 'cancelled'
        cancelledBy: string;
        cancelledAt: Date;
        reason: string;
    };
    createdAt: Date;
}

// Conceptos de pagos
export type PaymentConcept =
    | 'down_payment' // Enganche inicial
    | 'monthly_payment' // Mensualidad
    | 'maintenance' // Mantenimiento anual
    | 'extra'; // Pago extraordinario

// Estado del pago (backend: payment.model.js#status)
export type PaymentStatus = 'completed' | 'cancelled' | 'refunded';

// Metodos de pago
export type PaymentMethod =
    | 'cash' // Efectivo
    | 'card' // Tarjeta
    | 'transfer'; // Transferencia

// Resumen de pagos
export interface PaymentSummary {
    totalPaid: number;
    totalPending: number;
    paymentsCount: number;
    lastPaymentDate?: Date;
}