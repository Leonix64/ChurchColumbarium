export interface Customer {
    _id: string;
    firstName: string;
    lastName: string;
    fullName?: string; // virtual del back
    phone: string;
    email?: string;
    rfc?: string;
    address?: string;
    emergencyContact?: EmergencyContact;
    beneficiaries?: string[];
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}