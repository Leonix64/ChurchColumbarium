import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'currencyMx',
    standalone: true
})
export class CurrencyMxPipe implements PipeTransform {
    transform(value: number | null | undefined): string {
        if (value === null || value === undefined) return '$0.00';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value);
    }
}