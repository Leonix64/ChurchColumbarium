import { PaymentMethod } from "./payment.model";

// REQUEST: Crear venta individual
export interface CreateSaleRequest {
    nicheId: string;
    customerId: string;
    totalAmount: number;
    downPayment: number;
}

// REQUEST: Crear venta multiple
export interface CreateBulkSaleRequest {
    nicheIds: string[];
    customerId: string;
    totalAmount: number;
    downPayment: number;
}

// REQUEST: Registrar pago mensual
export interface RegisterPaymentRequest {
    amount: number;
    method: PaymentMethod;
    paymentNumber: number; // Numero de cuota (1-18)
    notes?: string;
}

// REQUEST: Registrar pago de mantenimiento
export interface RegisterMaintenanceRequest {
    customerId: string;
    amount: number;
    method: PaymentMethod;
    year: number;
    notes?: string;
}

// Respuesta de creacion de venta
export interface CreateSaleResponse {
    sale: any;      // Sale creada
    payment: any;   // Pago inicial registrado
    niche: any;     // Nicho actualizado
}

// Respuesta de venta multiple
export interface CreateBulkSaleResponse {
    sale: any;
    payment: any;
    niches: any[];  // Array de nichos actualizados
}