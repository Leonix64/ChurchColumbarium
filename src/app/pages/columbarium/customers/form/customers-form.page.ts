import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon, IonContent, IonList, IonListHeader,
  IonLabel, IonItem, IonInput, IonTextarea, IonText,
  IonSpinner
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
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonButton, IonIcon, IonContent, IonList, IonListHeader,
    IonLabel, IonItem, IonInput, IonTextarea, IonText,
    IonSpinner, FormsModule,
  ]
})
export class CustomersFormPage implements OnInit {

  customerForm: FormGroup; // Borrar el ! despues (se le olvida al pendejo xd)
  loading = signal(false);
  isEditMode = false;
  customerId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ checkmarkOutline });

    // Inicializar formulario
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
      rfc: ['', [Validators.minLength(12), Validators.maxLength(13), Validators.pattern(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/)]],
      address: ['', [Validators.maxLength(200)]],
      emergencyContact: this.fb.group({
        name: [''],
        phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
        relationship: ['']
      }),
    });
  }

  ngOnInit() {
    // Detectar modo edicion
    this.customerId = this.route.snapshot.paramMap.get('id');

    if (this.customerId) {
      this.isEditMode = true;
      console.log('Modo edicion detectado para la ID: ', this.customerId);
      this.loadCustomer(this.customerId);
      console.log('Modo creacion');
    }
  }

  // Cargar datos del cliente para edicion
  loadCustomer(id: string) {
    this.loading.set(true);

    this.customerService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForm(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al cargar el cliente');
        this.loading.set(false);
        this.router.navigate(['/columbarium/customers']);
      }
    });
  }

  // Poblar formulario con datos existentes
  populateForm(customer: Customer) {
    this.customerForm.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email || '',
      rfc: customer.rfc || '',
      address: customer.address || '',
      emergencyContact: {
        name: customer.emergencyContact?.name || '',
        phone: customer.emergencyContact?.phone || '',
        relationship: customer.emergencyContact?.relationship || ''
      },
    });
  }

  // Convertir RFC a mayusculas automaticamente
  onRfcInput(event: any) {
    const value = event.target.value;
    if (value) {
      this.customerForm.patchValue({
        rfc: value.toUpperCase()
      }, { emitEvent: false });
    }
  }

  // Enviar formulario
  async onSubmit() {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.notificationService.error('Por favor, completa todos los campos requeridos');
      return;
    }

    const confirmed = await this.notificationService.confirm(
      this.isEditMode ? 'Confirmar Cambios' : 'Crear Cliente',
      this.isEditMode
        ? '¿Deseas guardar los cambios realizados?'
        : '¿Deseas crear este cliente?'
    );

    if (!confirmed) return;

    this.loading.set(true);

    // Preparar datos
    const formValue = this.customerForm.value;
    const customerData: Partial<Customer> = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      phone: formValue.phone.trim(),
      email: formValue.email?.trim() || undefined,
      rfc: formValue.rfc?.trim() || undefined,
      address: formValue.address?.trim() || undefined,
      emergencyContact: this.hasEmergencyContact() ? {
        name: formValue.emergencyContact.name.trim(),
        phone: formValue.emergencyContact.phone.trim(),
        relationship: formValue.emergencyContact.relationship.trim()
      } : undefined,
    };

    // Crear o actualizar
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
          if (clientId) {
            this.router.navigate(['/columbarium/customers', clientId]);
          } else {
            this.router.navigate(['/columbarium/customers']);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // Verificar si hay datos de contacto de emergencia
  hasEmergencyContact(): boolean {
    const ec = this.customerForm.value.emergencyContact;
    return !!(ec.name || ec.phone || ec.relationship);
  }

  // Cancelar y volver
  async onCancel() {
    if (this.customerForm.dirty) {
      const confirmed = await this.notificationService.confirm(
        'Descartar cambios',
        '¿Estas seguro? Los cambios no guardados se perderan'
      );

      if (!confirmed) return;
    }

    if (this.isEditMode && this.customerId) {
      this.router.navigate(['/columbarium/customers', this.customerId]);
    } else {
      this.router.navigate(['/columbarium/customers']);
    }
  }

  // Getters para acceso fácil
  get firstName() { return this.customerForm.get('firstName'); }
  get lastName() { return this.customerForm.get('lastName'); }
  get phone() { return this.customerForm.get('phone'); }
  get email() { return this.customerForm.get('email'); }
  get rfc() { return this.customerForm.get('rfc'); }
  get emergencyPhone() { return this.customerForm.get('emergencyContact.phone'); }

  // Mensajes de error personalizados
  getErrorMessage(field: string): string {
    const control = this.customerForm.get(field);

    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) {
      const min = control.errors['minlength'].requiredLength;
      return `Minimo ${min} caracteres`;
    }
    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `Maximo ${max} caracteres`;
    }
    if (control.errors['pattern']) {
      if (field === 'phone') return 'Telefono invalido (10 digitos)';
      if (field === 'rfc') return 'RFC invalido';
    }

    return 'Campo invalido';
  }
}