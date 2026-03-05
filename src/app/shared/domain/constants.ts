// =============================================================================
// DOMAIN CONSTANTS — Única fuente de verdad para labels y colores de estado
// No importar desde archivos de modelos (evitar deps circulares)
// =============================================================================

// --- Tipos de dominio (definidos aquí para evitar deps circulares) -----------

export type NicheStatus = 'available' | 'reserved' | 'sold' | 'disabled';
export type NicheType   = 'wood' | 'marble' | 'special';

export type CustomerStatus = 'active' | 'inactive';

export type SaleStatus    = 'active' | 'paid' | 'cancelled' | 'overdue';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type PaymentMethod = 'cash' | 'card' | 'transfer';

export type BeneficiarySuccessionStatus =
  | 'eligible'
  | 'inherited'
  | 'deceased'
  | 'removed'
  | 'reassigned';

export type BeneficiaryRelationship =
  | 'esposo' | 'esposa'
  | 'hijo'   | 'hija'
  | 'padre'  | 'madre'
  | 'hermano' | 'hermana'
  | 'abuelo'  | 'abuela'
  | 'nieto'   | 'nieta'
  | 'tio'     | 'tia'
  | 'sobrino' | 'sobrina'
  | 'primo'   | 'prima'
  | 'yerno'   | 'nuera'
  | 'cuñado'  | 'cuñada'
  | 'otro';

export type UserRole = 'admin' | 'seller' | 'viewer';

// --- Labels -------------------------------------------------------------------

export const NICHE_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved:  'Reservado',
  sold:      'Vendido',
  disabled:  'Deshabilitado',
};

export const NICHE_TYPE_LABELS: Record<string, string> = {
  wood:    'Madera',
  marble:  'Mármol',
  special: 'Especial',
};

export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  active:   'Activo',
  inactive: 'Inactivo',
};

export const SALE_STATUS_LABELS: Record<string, string> = {
  active:    'Activa',
  paid:      'Pagada',
  cancelled: 'Cancelada',
  overdue:   'Vencida',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid:    'Pagado',
  overdue: 'Vencido',
};

export const SUCCESSION_STATUS_LABELS: Record<string, string> = {
  eligible:   'Sucesor elegible',
  inherited:  'Heredó el nicho',
  deceased:   'Fallecido',
  removed:    'Removido',
  reassigned: 'Reasignado',
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  esposo:   'Esposo',   esposa:   'Esposa',
  hijo:     'Hijo',     hija:     'Hija',
  padre:    'Padre',    madre:    'Madre',
  hermano:  'Hermano',  hermana:  'Hermana',
  abuelo:   'Abuelo',   abuela:   'Abuela',
  nieto:    'Nieto',    nieta:    'Nieta',
  tio:      'Tío',      tia:      'Tía',
  sobrino:  'Sobrino',  sobrina:  'Sobrina',
  primo:    'Primo',    prima:    'Prima',
  yerno:    'Yerno',    nuera:    'Nuera',
  cuñado:   'Cuñado',   cuñada:   'Cuñada',
  otro:     'Otro',
};

// --- Colores (valores Ionic: success, warning, danger, primary, medium) ------

export const NICHE_STATUS_COLORS: Record<string, string> = {
  available: 'success',
  reserved:  'warning',
  sold:      'primary',
  disabled:  'medium',
};

export const CUSTOMER_STATUS_COLORS: Record<string, string> = {
  active:   'success',
  inactive: 'medium',
};

export const SALE_STATUS_COLORS: Record<string, string> = {
  active:    'warning',
  paid:      'success',
  cancelled: 'danger',
  overdue:   'danger',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  partial: 'warning',
  paid:    'success',
  overdue: 'danger',
};

export const SUCCESSION_STATUS_COLORS: Record<string, string> = {
  eligible:   'success',
  inherited:  'primary',
  deceased:   'danger',
  removed:    'medium',
  reassigned: 'medium',
};

// --- Listas de opciones para selects -----------------------------------------

export const RELATIONSHIP_OPTIONS: { value: BeneficiaryRelationship; label: string }[] = [
  { value: 'esposo',   label: 'Esposo'   },
  { value: 'esposa',   label: 'Esposa'   },
  { value: 'hijo',     label: 'Hijo'     },
  { value: 'hija',     label: 'Hija'     },
  { value: 'padre',    label: 'Padre'    },
  { value: 'madre',    label: 'Madre'    },
  { value: 'hermano',  label: 'Hermano'  },
  { value: 'hermana',  label: 'Hermana'  },
  { value: 'abuelo',   label: 'Abuelo'   },
  { value: 'abuela',   label: 'Abuela'   },
  { value: 'nieto',    label: 'Nieto'    },
  { value: 'nieta',    label: 'Nieta'    },
  { value: 'tio',      label: 'Tío'      },
  { value: 'tia',      label: 'Tía'      },
  { value: 'sobrino',  label: 'Sobrino'  },
  { value: 'sobrina',  label: 'Sobrina'  },
  { value: 'primo',    label: 'Primo'    },
  { value: 'prima',    label: 'Prima'    },
  { value: 'yerno',    label: 'Yerno'    },
  { value: 'nuera',    label: 'Nuera'    },
  { value: 'cuñado',   label: 'Cuñado'   },
  { value: 'cuñada',   label: 'Cuñada'   },
  { value: 'otro',     label: 'Otro'     },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',     label: 'Efectivo'       },
  { value: 'card',     label: 'Tarjeta'        },
  { value: 'transfer', label: 'Transferencia'  },
];
