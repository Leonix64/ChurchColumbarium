export interface AuditLog {
    _id: string;
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    userId: string | any; // En caso de populated
    userName?: string;
    details: AuditDetails;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

export type AuditAction =
    | 'create'
    | 'update'
    | 'delete'
    | 'login'
    | 'logout'
    | 'payment'
    | 'cancel'
    | 'disable'
    | 'enable';

export type AuditEntity =
    | 'customer'
    | 'niche'
    | 'sale'
    | 'payment'
    | 'user';

export interface AuditDetails {
    before?: any;
    after?: any;
    reason?: string;
    metadata?: { [key: string]: any };
}

// Para filtros
export interface AuditFilters {
    action?: AuditAction;
    entity?: AuditEntity;
    entityId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
}
