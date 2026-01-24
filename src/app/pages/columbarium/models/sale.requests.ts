import { PaymentMethod } from "./payment.model";

export interface CreateSaleRequest {
    nicheId: string;
    customerId: string;
    totalAmount: number;
    downPayment: number;
}

export interface CreateBulkSaleRequest {
    nicheIds: string[];
    customerId: string;
    totalAmount: number;
    downPayment: number;
}

// Soporta pagos flexibles
export interface RegisterPaymentRequest {
    amount: number;
    method: PaymentMethod;
    paymentMode?: 'free' | 'specific'; // Modo de distribucion
    specificPaymentNumber?: number; // Numero especifico si paymentMode='specific'
    notes?: string;
}

// Request para cancelar venta
export interface CancelSaleRequest {
    reason: string;
    refundAmount?: number;
    refundMethod?: PaymentMethod;
    refundNotes?: string;
}

export interface RegisterMaintenanceRequest {
    customerId: string;
    amount: number;
    method: PaymentMethod;
    year: number;
    notes?: string;
}

export interface CreateSaleResponse {
    sale: any;
    payment: any;
    niche: any;
}

export interface CreateBulkSaleResponse {
    sale: any;
    payment: any;
    niches: any[];
}
