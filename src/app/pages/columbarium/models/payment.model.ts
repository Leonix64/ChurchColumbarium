export interface Payment {
    _id: string;
    sale: string; // Sale ID
    customer: string; // Customer ID
    receiptNumber: string; // Folio unico del pago
    amount: number;
    concept: PaymentConcept;
    method: PaymentMethod;
    paymentDate: Date;
    maintenanceYear?: number; // Solo para pagos de mantenimiento
    notes?: string;
    createdAt: Date;
}

// Conceptos de pagos
export type PaymentConcept =
    | 'down_payment' // Enganche inicial
    | 'monthly_payment' // Mensualidad
    | 'maintenance' // Mantenimiento anual
    | 'extra'; // Pago extraordinario

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