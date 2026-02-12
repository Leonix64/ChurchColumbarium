import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonIcon, IonItem, IonLabel, IonInput,
  IonNote, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonSpinner, IonBadge, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, callOutline, shieldOutline,
  saveOutline, closeOutline, createOutline, personCircleOutline,
  timeOutline, arrowBackOutline, lockClosedOutline, keyOutline,
  logOutOutline, warningOutline, checkmarkCircleOutline,
  closeCircleOutline, eyeOutline, eyeOffOutline
} from 'ionicons/icons';
import { Router } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { User, UpdateProfileRequest } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonButton, IonIcon, IonItem, IonLabel, IonInput,
    IonNote, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonSpinner, IonBadge, IonText,
    HeaderComponent
  ]
})
export class ProfilePage implements OnInit {
  currentUser = this.authService.currentUser;
  editing = signal(false);
  saving = signal(false);
  loading = signal(true);

  // Campos editables del perfil
  fullName = '';
  email = '';
  phone = '';

  // Campos de cambio de contraseña
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changingPassword = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Invalidar tokens
  invalidating = signal(false);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    addIcons({
      personOutline, mailOutline, callOutline, shieldOutline,
      saveOutline, closeOutline, createOutline, personCircleOutline,
      timeOutline, arrowBackOutline, lockClosedOutline, keyOutline,
      logOutOutline, warningOutline, checkmarkCircleOutline,
      closeCircleOutline, eyeOutline, eyeOffOutline
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);
    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        const user = this.currentUser();
        if (user) this.populateForm(user);
        this.loading.set(false);
      }
    });
  }

  private populateForm(user: User) {
    this.fullName = user.fullName || '';
    this.email = user.email || '';
    this.phone = user.phone || '';
  }

  // ═══════ PERFIL ═══════

  startEditing() {
    const user = this.currentUser();
    if (user) this.populateForm(user);
    this.editing.set(true);
  }

  cancelEditing() {
    const user = this.currentUser();
    if (user) this.populateForm(user);
    this.editing.set(false);
  }

  saveProfile() {
    if (!this.fullName.trim() || !this.email.trim()) {
      this.notificationService.warning('El nombre y email son obligatorios');
      return;
    }

    const data: UpdateProfileRequest = {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || undefined
    };

    this.saving.set(true);
    this.authService.updateProfile(data).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Perfil actualizado correctamente');
          this.editing.set(false);
        }
        this.saving.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al actualizar el perfil';
        this.notificationService.error(msg);
        this.saving.set(false);
      }
    });
  }

  // ═══════ CAMBIAR CONTRASEÑA ═══════

  get passwordHasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }

  get passwordHasUppercase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  get passwordHasNumber(): boolean {
    return /[0-9]/.test(this.newPassword);
  }

  get passwordsMatch(): boolean {
    return this.newPassword.length > 0 && this.newPassword === this.confirmPassword;
  }

  get isPasswordFormValid(): boolean {
    return this.currentPassword.length > 0
      && this.passwordHasMinLength
      && this.passwordHasUppercase
      && this.passwordHasNumber
      && this.passwordsMatch;
  }

  toggleShowCurrentPassword() {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleShowNewPassword() {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleShowConfirmPassword() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  changePassword() {
    if (!this.isPasswordFormValid) {
      this.notificationService.warning('Verifica que todos los requisitos se cumplan');
      return;
    }

    this.changingPassword.set(true);
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Contraseña actualizada correctamente');
          this.resetPasswordForm();
        }
        this.changingPassword.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al cambiar la contraseña';
        this.notificationService.error(msg);
        this.changingPassword.set(false);
      }
    });
  }

  private resetPasswordForm() {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  // ═══════ INVALIDAR TOKENS ═══════

  async invalidateAllTokens() {
    const confirmed = await this.notificationService.confirm(
      'Cerrar Todas las Sesiones',
      'Se cerrarán todas las sesiones activas en todos los dispositivos. Tendrás que volver a iniciar sesión. ¿Continuar?',
      'Sí, cerrar todo',
      'Cancelar'
    );

    if (!confirmed) return;

    this.invalidating.set(true);
    this.authService.invalidateAllTokens().subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Todas las sesiones han sido cerradas');
          // El servicio ya redirige al login
        }
        this.invalidating.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al invalidar sesiones';
        this.notificationService.error(msg);
        this.invalidating.set(false);
      }
    });
  }

  // ═══════ HELPERS ═══════

  getRoleBadgeColor(role?: string): string {
    switch (role) {
      case 'admin': return 'danger';
      case 'seller': return 'primary';
      case 'viewer': return 'medium';
      default: return 'medium';
    }
  }

  getRoleLabel(role?: string): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'seller': return 'Vendedor';
      case 'viewer': return 'Visor';
      default: return role || '';
    }
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user?.fullName) return '?';
    const parts = user.fullName.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
