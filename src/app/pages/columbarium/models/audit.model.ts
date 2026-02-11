// Modelo que coincide con el backend Audit schema

export interface AuditLog {
    _id: string;
    user: string | AuditUser;
    username: string;
    userRole: string;
    action: string;
    module: string;
    resourceType?: string;
    resourceId?: string;
    details?: any;
    status: 'success' | 'error' | 'warning';
    ip?: string;
    userAgent?: string;
    errorMessage?: string;
    timestamp: Date;
}

export interface AuditUser {
    _id: string;
    username: string;
    fullName: string;
    role: string;
    email?: string;
}

// Para filtros del endpoint GET /api/audit
export interface AuditFilters {
    module?: string;
    action?: string;
    user?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}

// Respuesta de GET /api/audit/stats
export interface AuditStats {
    total: number;
    byModule: AuditGroupCount[];
    byAction: AuditGroupCount[];
    byStatus: AuditGroupCount[];
    topUsers: AuditTopUser[];
    activityByDay: AuditDayActivity[];
    recentErrors: AuditLog[];
}

export interface AuditGroupCount {
    _id: string;
    count: number;
}

export interface AuditTopUser {
    _id: string;
    count: number;
    username: string;
    fullName: string;
    role: string;
}

export interface AuditDayActivity {
    _id: string; // fecha YYYY-MM-DD
    count: number;
}
