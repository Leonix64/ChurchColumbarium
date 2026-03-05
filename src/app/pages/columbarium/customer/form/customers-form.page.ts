import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon, IonContent, IonList, IonListHeader,
  IonLabel, IonItem, IonInput, IonTextarea, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline } from 'ionicons/icons';

import { CustomerService } from '../../services/customer.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customers-form',
  templateUrl: './customers-form.page.html',
  styleUrls: ['./customers-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonButton, IonIcon, IonContent, IonList, IonListHeader,
    IonLabel, IonItem, IonInput, IonTextarea, IonSpinner
  ]
})
export class CustomersFormPage implements OnInit {

  // ── Modo ──────────────────────────────────────────────────────────────────
  isEditMode = false;
  customerId: string | null = null;
  loading    = signal(false);
  touched    = signal(false);

  // ── Campos del formulario ─────────────────────────────────────────────────
  firstName = signal('');
  lastName  = signal('');
  phone     = signal('');
  email     = signal('');
  rfc       = signal('');
  address   = signal('');

  // ── Contacto de emergencia ────────────────────────────────────────────────
  ecName         = signal('');
  ecPhone        = signal('');
  ecRelationship = signal('');

  // ── Validaciones ─────────────────────────────────────────────────────────

  firstNameError = computed<string | null>(() => {
    const v = this.firstName().trim();
    if (!v)           return 'Nombre requerido';
    if (v.length < 2) return 'Mínimo 2 caracteres';
    if (v.length > 50) return 'Máximo 50 caracteres';
    return null;
  });

  lastNameError = computed<string | null>(() => {
    const v = this.lastName().trim();
    if (!v)           return 'Apellido requerido';
    if (v.length < 2) return 'Mínimo 2 caracteres';
    if (v.length > 50) return 'Máximo 50 caracteres';
    return null;
  });

  phoneError = computed<string | null>(() => {
    const v = this.phone().trim();
    if (!v) return 'Teléfono requerido';
    if (!/^[0-9]{10}$/.test(v)) return 'Teléfono inválido (10 dígitos)';
    return null;
  });

  emailError = computed<string | null>(() => {
    const v = this.email().trim();
    if (!v) return null; // opcional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email inválido';
    return null;
  });

  rfcError = computed<string | null>(() => {
    const v = this.rfc().trim();
    if (!v) return null; // opcional
    if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(v)) return 'RFC inválido (12-13 caracteres)';
    return null;
  });

  ecPhoneError = computed<string | null>(() => {
    const v = this.ecPhone().trim();
    if (!v) return null;
    if (!/^[0-9]{10}$/.test(v)) return 'Teléfono inválido (10 dígitos)';
    return null;
  });

  hasEmergencyContact = computed(() =>
    !!(this.ecName().trim() || this.ecPhone().trim() || this.ecRelationship().trim())
  );

  canSubmit = computed(() =>
    !this.firstNameError() &&
    !this.lastNameError()  &&
    !this.phoneError()     &&
    !this.emailError()     &&
    !this.rfcError()       &&
    !this.ecPhoneError()   &&
    !this.loading()
  );

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor(
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ checkmarkOutline });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId) {
      this.isEditMode = true;
      this.loadCustomer(this.customerId);
    }
  }

  // ── Handlers de campo ────────────────────────────────────────────────────

  onChange(field: string, value: string | null | undefined) {
    const v = (value ?? '').toString();
    switch (field) {
      case 'firstName':      this.firstName.set(v);             break;
      case 'lastName':       this.lastName.set(v);              break;
      case 'phone':          this.phone.set(v);                 break;
      case 'email':          this.email.set(v);                 break;
      case 'rfc':            this.rfc.set(v.toUpperCase());     break;
      case 'address':        this.address.set(v);               break;
      case 'ecName':         this.ecName.set(v);                break;
      case 'ecPhone':        this.ecPhone.set(v);               break;
      case 'ecRelationship': this.ecRelationship.set(v);        break;
    }
  }

  // ── Carga ─────────────────────────────────────────────────────────────────

  loadCustomer(id: string) {
    this.loading.set(true);
    this.customerService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) this.populate(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al cargar el cliente');
        this.loading.set(false);
        this.router.navigate(['/columbarium/customers']);
      }
    });
  }

  private populate(c: Customer) {
    this.firstName.set(c.firstName ?? '');
    this.lastName.set(c.lastName   ?? '');
    this.phone.set(c.phone         ?? '');
    this.email.set(c.email         ?? '');
    this.rfc.set(c.rfc             ?? '');
    this.address.set(c.address     ?? '');
    this.ecName.set(c.emergencyContact?.name         ?? '');
    this.ecPhone.set(c.emergencyContact?.phone        ?? '');
    this.ecRelationship.set(c.emergencyContact?.relationship ?? '');
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async onSubmit() {
    this.touched.set(true);
    if (!this.canSubmit()) {
      this.notificationService.error('Por favor, completa todos los campos requeridos');
      return;
    }

    const confirmed = await this.notificationService.confirm(
      this.isEditMode ? 'Confirmar Cambios' : 'Crear Cliente',
      this.isEditMode ? '¿Deseas guardar los cambios realizados?' : '¿Deseas crear este cliente?'
    );
    if (!confirmed) return;

    this.loading.set(true);

    const customerData: Partial<Customer> = {
      firstName: this.firstName().trim(),
      lastName:  this.lastName().trim(),
      phone:     this.phone().trim(),
      email:     this.email().trim()   || undefined,
      rfc:       this.rfc().trim()     || undefined,
      address:   this.address().trim() || undefined,
      emergencyContact: this.hasEmergencyContact() ? {
        name:         this.ecName().trim(),
        phone:        this.ecPhone().trim(),
        relationship: this.ecRelationship().trim()
      } : undefined
    };

    const request$ = this.isEditMode && this.customerId
      ? this.customerService.update(this.customerId, customerData)
      : this.customerService.create(customerData);

    request$.subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            this.isEditMode ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente'
          );
          const clientId = this.isEditMode ? this.customerId : response.data?._id;
          this.router.navigate(clientId
            ? ['/columbarium/customers', clientId]
            : ['/columbarium/customers']
          );
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async onCancel() {
    const hasDirty = this.firstName().trim() || this.lastName().trim() || this.phone().trim();
    if (!this.isEditMode && hasDirty) {
      const confirmed = await this.notificationService.confirm(
        'Descartar cambios',
        '¿Estás seguro? Los cambios no guardados se perderán'
      );
      if (!confirmed) return;
    }
    this.router.navigate(this.isEditMode && this.customerId
      ? ['/columbarium/customers', this.customerId]
      : ['/columbarium/customers']
    );
  }
}
