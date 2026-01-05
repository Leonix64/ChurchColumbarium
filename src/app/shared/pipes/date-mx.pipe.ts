import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'dateMx',
    standalone: true
})
export class DateMxPipe implements PipeTransform {
    transform(value: Date | string | null, format: 'short' | 'long' = 'short'): string {
        if (!value) return '-';

        const date = typeof value === 'string' ? new Date(value) : value;

        if (format === 'short') {
            return date.toLocaleDateString('es-MX');
        }

        return date.toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}