import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonButton, IonIcon, IonList, IonListHeader, IonLabel,
  IonItem, IonInput, IonText, IonSpinner, IonNote, IonCard,
  IonCardHeader, IonCardContent, IonCardTitle, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline, personOutline, businessOutline,
  cashOutline, calculatorOutline, searchOutline
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { CustomerService } from '../../services/customer.service';
import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Customer } from '../../models/customer.model';
import { Niche } from '../../models/niche.model';
import { CreateSaleRequest } from '../../models/sale.requests';
import { CustomerSearchModalComponent } from '../../components/customer-search-modal/customer-search-modal.component';
import { NicheSearchModalComponent } from '../../components/niche-search-modal/niche-search-modal.component';

@Component({
  selector: 'app-sale-create',
  templateUrl: './sale-create.page.html',
  styleUrls: ['./sale-create.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonButton, IonIcon, IonList, IonListHeader, IonLabel,
    IonItem, IonInput, IonText, IonSpinner, IonNote, IonCard,
    IonCardHeader, IonCardContent, IonCardTitle
  ]
})
export class SaleCreatePage implements OnInit {
  saleForm: FormGroup;
  loading = signal(false);
  loadingData = signal(true);

  // Datos
  customers = this.customerService.customers;
  availableNiches = signal<Niche[]>([]);

  //Selecciones
  selectedCustomer = signal<Customer | null>(null);
  selectedNiche = signal<Niche | null>(null);

  // Calculos reactivos
  monthlyPayment = signal(0);
  balance = signal(0);
  minDownPayment = signal(0);

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private customerService: CustomerService,
    private nicheService: NicheService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private modalCtrl: ModalController
  ) {
    addIcons({
      checkmarkOutline, personOutline, businessOutline,
      cashOutline, calculatorOutline, searchOutline
    });

    // Inicializar formulario
    this.saleForm = this.fb.group({
      customerId: ['', Validators.required],
      nicheId: ['', Validators.required],
      totalAmount: [{ value: 0, disabled: true }, [Validators.required, Validators.min(1)]],
      downPayment: ['', [Validators.required, Validators.min(1000)]],
    });
  }

  ngOnInit() {
    this.loadInitialData();

    // Si viene nicheId por query params (desde el grid)
    const nicheId = this.route.snapshot.queryParamMap.get('nicheId');
    if (nicheId) {
      this.preSelectNiche(nicheId);
    }

    // Escuchar cambios del formulario para recalcular
    this.setupFormListeners();
  }

  // Listeners del formulario
  setupFormListeners() {
    // Escuchar cambios en totalAmount
    this.saleForm.get('totalAmount')?.valueChanges.subscribe(() => {
      this.recalculate();
    });

    // Escuchar cambios en downPayment
    this.saleForm.get('downPayment')?.valueChanges.subscribe(() => {
      this.recalculate();
    });
  }

  // Recalcular todo
  recalculate() {
    const total = this.saleForm.get('totalAmount')?.value || 0;
    const down = this.saleForm.get('downPayment')?.value || 0;

    // Calcular balance
    const newBalance = total - down;
    this.balance.set(newBalance > 0 ? newBalance : 0);

    // Calcular mensualidad
    const monthly = this.saleService.calculateMonthly(total, down);
    this.monthlyPayment.set(monthly);

    // Calcular minimo enganche (10%)
    const minDown = total * 0.1;
    this.minDownPayment.set(minDown);
  }

  async loadInitialData() {
    this.loadingData.set(true);

    // Cargar clientes activos
    this.customerService.getAll({ active: true }).subscribe({
      error: () => this.notificationService.error('Error al cargar clientes')
    });

    // Cargar nichos disponibles
    this.nicheService.getAvailable().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableNiches.set(response.data);
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.loadingData.set(false);
        this.notificationService.error('Error al cargar nichos');
      }
    });
  }

  // Pre-seleccionar nicho (desde grid)
  preSelectNiche(nicheId: string) {
    const niche = this.availableNiches().find(n => n._id === nicheId);
    if (niche) {
      this.onNicheSelect(nicheId);
    }
  }

  // Cuando selecciona cliente
  onCustomerSelect(customerId: string) {
    const customer = this.customers().find(c => c._id === customerId);
    this.selectedCustomer.set(customer || null);
  }

  // Cuando selecciona nicho
  onNicheSelect(nicheId: string) {
    const niche = this.availableNiches().find(n => n._id === nicheId);

    if (niche) {
      this.selectedNiche.set(niche);
      // Auto-llenar el precio total
      this.saleForm.patchValue({
        totalAmount: niche.price
      });
      // Recalcular
      this.recalculate();
    }
  }

  // Modal para buscar cliente
  async openCustomerSearch() {
    const modal = await this.modalCtrl.create({
      component: CustomerSearchModalComponent,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.customer) {
      this.saleForm.patchValue({ customerId: data.customer._id });
      this.onCustomerSelect(data.customer._id);
    }
  }

  // Modal para buscar nicho
  async openNicheSearch() {
    const modal = await this.modalCtrl.create({
      component: NicheSearchModalComponent,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.niche) {
      this.saleForm.patchValue({ nicheId: data.niche._id });
      this.onNicheSelect(data.niche._id);
    }
  }

  // Validar enganche
  validateDownPayment(): boolean {
    const total = this.saleForm.get('totalAmount')?.value || 0;
    const down = this.saleForm.get('downPayment')?.value || 0;

    if (down <= 0) {
      this.notificationService.error('El enganche debe ser mayor a 0');
      return false;
    }

    if (down >= total) {
      this.notificationService.error('El enganche debe ser menor al total');
      return false;
    }

    // Mínimo 10% de enganche
    const minDown = total * 0.1;
    if (down < minDown) {
      this.notificationService.error(`El enganche minimo es ${minDown.toLocaleString('es-MX')}`);
      return false;
    }

    return true;
  }

  // Enviar formulario
  async onSubmit() {
    // Validar formulario
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      this.notificationService.error('Complete todos los campos requeridos');
      return;
    }

    // Validar enganche
    if (!this.validateDownPayment()) {
      return;
    }

    // Confirmar
    const confirmed = await this.notificationService.confirm(
      'Confirmar Venta',
      `¿Registrar venta de ${this.selectedNiche()?.code} a ${this.selectedCustomer()?.firstName} ${this.selectedCustomer()?.lastName}?`
    );

    if (!confirmed) return;

    this.loading.set(true);

    // Preparar datos
    const saleData: CreateSaleRequest = {
      customerId: this.saleForm.value.customerId,
      nicheId: this.saleForm.value.nicheId,
      totalAmount: this.saleForm.get('totalAmount')?.value,
      downPayment: this.saleForm.value.downPayment
    };

    // Crear venta
    this.saleService.create(saleData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Venta registrada exitosamente');

          // Ir al detalle de la venta creada
          const saleId = response.data?.sale?._id;
          if (saleId) {
            this.router.navigate(['/columbarium/sales', saleId]);
          } else {
            this.router.navigate(['/columbarium/sales']);
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // Cancelar
  async onCancel() {
    if (this.saleForm.dirty) {
      const confirmed = await this.notificationService.confirm(
        'Descartar cambios',
        '¿Estas seguro? Los datos no guardados se perderan'
      );

      if (!confirmed) return;
    }

    this.router.navigate(['/columbarium/sales']);
  }

  // Helpers
  get customerId() { return this.saleForm.get('customerId'); }
  get nicheId() { return this.saleForm.get('nicheId'); }
  get totalAmount() { return this.saleForm.get('totalAmount'); }
  get downPayment() { return this.saleForm.get('downPayment'); }

  getErrorMessage(field: string): string {
    const control = this.saleForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Campo requerido';
    if (control.errors['min']) return `Minimo: ${control.errors['min'].min}`;

    return 'Campo invalido';
  }
}
