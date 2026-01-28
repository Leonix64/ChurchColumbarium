export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    count?: number;
    page?: number;
    pages?: number;
    limit?: number;
    stats?: any;
    details?: any;
}