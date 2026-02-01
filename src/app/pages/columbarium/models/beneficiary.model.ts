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

export type BeneficiaryRelationship =
    | 'esposo' | 'esposa' | 'hijo' | 'hija' | 'padre' | 'madre'
    | 'hermano' | 'hermana' | 'abuelo' | 'abuela' | 'nieto' | 'nieta'
    | 'tio' | 'tia' | 'sobrino' | 'sobrina' | 'primo' | 'prima'
    | 'yerno' | 'nuera' | 'cuñado' | 'cuñada' | 'otro';

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