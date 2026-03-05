export type BeneficiaryRelationship =
    | 'esposo' | 'esposa' | 'hijo' | 'hija'
    | 'padre' | 'madre' | 'hermano' | 'hermana'
    | 'abuelo' | 'abuela' | 'nieto' | 'nieta'
    | 'tio' | 'tia' | 'sobrino' | 'sobrina'
    | 'primo' | 'prima' | 'yerno' | 'nuera'
    | 'cuñado' | 'cuñada' | 'otro';

export interface BeneficiaryRecord {
    _id: string;
    niche: string;
    name: string;
    relationship: BeneficiaryRelationship;
    phone?: string;
    email?: string;
    dateOfBirth?: Date;
    isDeceased: boolean;
    deceasedDate?: Date;
    order: number;
    notes?: string;
    /** ID del Customer existente vinculado a este sucesor (poblado por el backend de sucesión) */
    linkedCustomer?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BeneficiaryInput {
    name: string;
    relationship: BeneficiaryRelationship;
    phone?: string;
    email?: string;
    dateOfBirth?: string;
    isDeceased?: boolean;
    order: number;
    notes?: string;
}

// ── Legacy — usados por el árbol plural mientras se migra ───────────────────

/** @deprecated Usar BeneficiaryRecord. Mantenido para compatibilidad con
 *  customer.model, customer.service, customers/form, components/succession-modal
 *  y components/beneficiaries-manager (plural). */
export interface Beneficiary {
    _id?: string;
    name: string;
    relationship: BeneficiaryRelationship;
    phone?: string;
    email?: string;
    dateOfBirth?: Date;
    isDeceased: boolean;
    deceasedDate?: Date;
    order: number;
    notes?: string;
}

/** @deprecated Mantenido para ownership-history-modal y succession.service
 *  hasta que se migre al árbol singular. */
export interface OwnershipHistory {
    _id: string;
    owner: {
        _id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email?: string;
    };
    startDate: Date;
    endDate?: Date;
    reason: 'purchase' | 'succession' | 'transfer' | 'inheritance';
    notes?: string;
    registeredBy?: {
        username: string;
        fullName: string;
    };
    createdAt: Date;
}
