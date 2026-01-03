import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  // Guardar dato
  set(key: string, value: any): void {
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error al guardar en storage:', error);
    }
  }

  // Obtener dato
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error al leer del storage:', error);
      return null;
    }
  }

  // Eliminar dato
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  // Limpiar todo el storage
  clear(): void {
    localStorage.clear();
  }
}
