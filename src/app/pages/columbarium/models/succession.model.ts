export interface SuccessionRequest {
    customerId: string;
    nicheId: string;
    deceasedDate?: Date;
    notes?: string;
}

export interface SuccessionResponse {
    previousOwner: {
        id: string;
        name: string;
    };
    newOwner: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        isNewCustomer: boolean;
    };
    niche: {
        id: string;
        code: string;
        displayNumber: number;
    };
    succession: {
        date: Date;
        beneficiary: {
            name: string;
            relationship: string;
            order: number;
        };
    };
}

export interface TransferRequest {
    nicheId: string;
    newOwnerId: string;
    reason?: string;
    notes?: string;
}