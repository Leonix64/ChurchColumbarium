import { Pipe, PipeTransform } from '@angular/core';
import {
  NICHE_STATUS_COLORS,
  CUSTOMER_STATUS_COLORS,
  SALE_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  SUCCESSION_STATUS_COLORS,
} from '../domain/constants';

type ColorDomain = 'niche' | 'customer' | 'sale' | 'payment' | 'succession';

const DOMAIN_MAP: Record<ColorDomain, Record<string, string>> = {
  niche:      NICHE_STATUS_COLORS,
  customer:   CUSTOMER_STATUS_COLORS,
  sale:       SALE_STATUS_COLORS,
  payment:    PAYMENT_STATUS_COLORS,
  succession: SUCCESSION_STATUS_COLORS,
};

/**
 * Devuelve el color Ionic correspondiente a un estado de dominio.
 *
 * @example
 * [color]="sale.status | statusColor:'sale'"    // 'warning'
 * [color]="niche.status | statusColor:'niche'"  // 'success'
 */
@Pipe({
  name: 'statusColor',
  standalone: true,
  pure: true,
})
export class StatusColorPipe implements PipeTransform {
  transform(value: string | null | undefined, domain: ColorDomain): string {
    if (!value) return 'medium';
    return DOMAIN_MAP[domain]?.[value] ?? 'medium';
  }
}
