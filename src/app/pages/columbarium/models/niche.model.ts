import { Customer } from "./customer.model";

export interface Niche {
    _id: string;
    code: string;                    // A-A-1-52
    displayNumber: number;            // 52 (número pintado en la pared)
    module: string;                   // A, B, C, etc.
    section: string;                  // A o B
    row: number;                      // 1-7 (1=piso, 7=techo)
    number: number;                   // Posición en la fila
    type: 'wood' | 'marble' | 'special';
    price: number;
    status: 'available' | 'reserved' | 'sold' | 'disabled';
    currentOwner?: string | Customer; // Puede venir populated
    occupants?: any[];                // Difuntos (futuro)
    notes?: string;
    disabledReason?: string;
    disabledAt?: Date;
    disabledBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Helper para agrupar nichos por modulo/seccion
export interface ModuleGroup {
    module: string;
    moduleName: string;
    sections: SectionGroup[];
    totalNiches: number;
    availableNiches: number;
    soldNiches: number;
    reservedNiches: number;
}

export interface SectionGroup {
    section: string;
    niches: Niche[];
    totalNiches: number;
    availableNiches: number;
    soldNiches: number;
    reservedNiches: number;
    rows: number;
    nichesPerRow: number;
}

// Stats generales
export interface NicheStats {
    total: number;
    available: number;
    sold: number;
    reserved: number;
    disabled: number;
    byModule: { [key: string]: number };
    byType: { wood: number; marble: number; special: number };
}