import { CanDeactivateFn } from '@angular/router';

/**
 * Interfaz que deben implementar los wizards multi-paso que
 * quieran proteger al usuario de salir accidentalmente.
 */
export interface CanDeactivateWizard {
  /** Devuelve true si el wizard puede cerrarse sin confirmación */
  canDeactivate(): boolean;
}

/**
 * Guard funcional reutilizable para cualquier wizard.
 * Se registra en las rutas de SaleCreatePage y SuccessionWizardPage.
 */
export const wizardDeactivateGuard: CanDeactivateFn<CanDeactivateWizard> = (component) => {
  if (component.canDeactivate()) return true;
  return window.confirm(
    '¿Salir del asistente? Los datos ingresados se perderán.'
  );
};
