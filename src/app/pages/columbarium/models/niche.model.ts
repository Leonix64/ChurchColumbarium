export interface Niche {
    _id: string;
    code: string;
    displayNumber: number;
    module: string;
    section: string;
    row: number;
    number: number;
    type: 'wood' | 'marble' | 'special';
    price: number;
    status: 'available' | 'reserved' | 'sold' | 'disabled';
    currentOwner?: string; // Customer ID
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}