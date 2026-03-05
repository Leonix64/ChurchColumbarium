/**
 * Type guards para distinguir objetos populated vs ObjectId strings.
 * Mongoose puede devolver refs como objetos (populated) o como strings (ID).
 * Usar siempre estos guards antes de acceder a propiedades del objeto.
 */

/**
 * Devuelve true si `value` es un objeto populated (no un string ID).
 *
 * @example
 * if (isPopulated<Customer>(niche.currentOwner)) {
 *   console.log(niche.currentOwner.firstName); // seguro
 * }
 */
export function isPopulated<T extends { _id: string }>(
  value: T | string | null | undefined
): value is T {
  return value !== null && value !== undefined && typeof value === 'object' && '_id' in value;
}

/**
 * Extrae el ID de un ref, sea populated o string.
 */
export function extractId(value: { _id: string } | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value._id;
}
