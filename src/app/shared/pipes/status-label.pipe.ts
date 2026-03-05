import { Pipe, PipeTransform } from '@angular/core';
import {
  NICHE_STATUS_LABELS,
  CUSTOMER_STATUS_LABELS,
  SALE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SUCCESSION_STATUS_LABELS,
  RELATIONSHIP_LABELS,
  NICHE_TYPE_LABELS,
} from '../domain/constants';

type LabelDomain =
  | 'niche'
  | 'nicheType'
  | 'customer'
  | 'sale'
  | 'payment'
  | 'succession'
  | 'relationship';

const DOMAIN_MAP: Record<LabelDomain, Record<string, string>> = {
  niche:        NICHE_STATUS_LABELS,
  nicheType:    NICHE_TYPE_LABELS,
  customer:     CUSTOMER_STATUS_LABELS,
  sale:         SALE_STATUS_LABELS,
  payment:      PAYMENT_STATUS_LABELS,
  succession:   SUCCESSION_STATUS_LABELS,
  relationship: RELATIONSHIP_LABELS,
};

/**
 * Convierte un valor de estado de dominio a su etiqueta legible.
 *
 * @example
 * {{ sale.status | statusLabel:'sale' }}          // 'Activa'
 * {{ niche.status | statusLabel:'niche' }}        // 'Vendido'
 * {{ beneficiary.relationship | statusLabel:'relationship' }} // 'Hijo'
 */
@Pipe({
  name: 'statusLabel',
  standalone: true,
  pure: true,
})
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined, domain: LabelDomain): string {
    if (!value) return '';
    return DOMAIN_MAP[domain]?.[value] ?? value;
  }
}
