import { Component, OnInit, signal } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon, IonContent, IonBadge, IonSpinner,
  ActionSheetController, ModalController, IonProgressBar,
  IonCardContent, IonCard
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ellipsisVertical, personCircle, call, location, medkit,
  informationCircle, createOutline, closeCircleOutline,
  checkmarkCircleOutline, alertCircleOutline, person, shareOutline,
  timeOutline, chevronForwardOutline
} from 'ionicons/icons';

import { CustomerService } from '../../services/customer.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Customer } from '../../models/customer.model';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models/sale.model';
import { Niche } from '../../models/niche.model';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';
import { MaintenanceRegisterPage } from '../../maintenance/register/maintenance-register.page';
import { ResourceHistoryModalComponent } from '../../components/resource-history-modal/resource-history-modal.component';

@Component({
  selector: 'app-customers-detail',
  templateUrl: './customers-detail.page.html',
  styleUrls: ['./customers-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonButton, IonIcon, IonContent, IonBadge, IonSpinner,
    EmptyStateComponent,
    CurrencyMxPipe,
    IonProgressBar,
    IonCardContent,
    IonCard
  ]
})
export class CustomersDetailPage implements OnInit, ViewWillEnter {
  customerSales = signal<Sale[]>([]);
  salesStats    = signal<any>(null);
  customer      = signal<Customer | null>(null);
  loading       = signal(true);
  customerId: string | null = null;

  constructor(
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private actionSheetCtrl: ActionSheetController,
    private saleService: SaleService,
    private modalCtrl: ModalController,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    addIcons({
      ellipsisVertical, personCircle, call, location, medkit,
      informationCircle, createOutline, closeCircleOutline,
      checkmarkCircleOutline, alertCircleOutline, person, shareOutline,
      timeOutline, chevronForwardOutline
    });
  }

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get('id');
  }

  ionViewWillEnter() {
    if (this.customerId) {
      this.loadCustomer(this.customerId);
      this.loadCustomerSales(this.customerId);
    } else {
      this.loading.set(false);
    }
  }

  loadCustomer(id: string) {
    this.loading.set(true);
    this.customerService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customer.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar cliente');
      }
    });
  }

  loadCustomerSales(customerId: string) {
    this.customerService.getCustomerSales(customerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.customerSales.set(response.data || []);
          this.salesStats.set(response.stats || null);
        }
      },
      error: () => { /* silencioso */ }
    });
  }

  async openMaintenanceModal() {
    const modal = await this.modalCtrl.create({
      component: MaintenanceRegisterPage,
      componentProps: { customer: this.customer(), defaultAmount: 1000 }
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.success) {
      this.notificationService.success('Pago registrado');
    }
  }

  async presentActionSheet() {
    const buttons: any[] = [
      {
        text: 'Editar',
        icon: 'create-outline',
        handler: () => this.goToEdit()
      },
      {
        text: this.customer()?.active ? 'Desactivar' : 'Activar',
        icon: this.customer()?.active ? 'close-circle-outline' : 'checkmark-circle-outline',
        role: this.customer()?.active ? 'destructive' : undefined,
        handler: () => this.toggleActiveStatus()
      },
      {
        text: 'Ver Historial',
        icon: 'time-outline',
        handler: () => this.openResourceHistory()
      },
      { text: 'Compartir', icon: 'share-outline', handler: () => this.shareCustomer() },
      { text: 'Cancelar', role: 'cancel', icon: 'close-circle-outline' }
    ];

    const actionSheet = await this.actionSheetCtrl.create({ header: 'Acciones', buttons });
    await actionSheet.present();
  }

  async openResourceHistory() {
    const c = this.customer();
    if (!c?._id) return;
    const modal = await this.modalCtrl.create({
      component: ResourceHistoryModalComponent,
      componentProps: {
        resourceId: c._id,
        resourceTitle: `${c.firstName} ${c.lastName}`,
        resourceType: 'Cliente'
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });
    await modal.present();
  }

  goToEdit() {
    if (this.customerId) {
      this.router.navigate(['/columbarium/customers', this.customerId, 'edit']);
    }
  }

  async toggleActiveStatus() {
    const currentCustomer = this.customer();
    if (!currentCustomer || !this.customerId) return;

    const action = currentCustomer.active ? 'desactivar' : 'activar';
    const confirmed = await this.notificationService.confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Cliente`,
      `¿Estás seguro de ${action} a ${currentCustomer.firstName} ${currentCustomer.lastName}?`
    );
    if (!confirmed) return;

    const request$ = currentCustomer.active
      ? this.customerService.deactivate(this.customerId)
      : this.customerService.activate(this.customerId);

    request$.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customer.set(response.data);
          this.notificationService.success(`Cliente ${action}do exitosamente`);
        }
      },
      error: () => { /* manejado por interceptor */ }
    });
  }

  shareCustomer() {
    const c = this.customer();
    if (!c) return;
    const text = [
      `Cliente: ${c.firstName} ${c.lastName}`,
      `Teléfono: ${c.phone}`,
      c.email ? `Email: ${c.email}` : '',
      c.rfc   ? `RFC: ${c.rfc}`     : '',
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      navigator.share({ title: 'Información del cliente', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() =>
        this.notificationService.success('Información copiada al portapapeles')
      );
    }
  }

  goBack() {
    this.router.navigate(['/columbarium/customers']);
  }

  hasActiveSales(): boolean {
    return this.customerSales().some(s => s.status !== 'cancelled');
  }

  getSaleProgress(sale: Sale): number {
    return this.saleService.calculateProgress(sale.schedule);
  }

  getSaleStatusColor(status: string): string {
    return this.saleService.getStatusColor(status);
  }

  getSaleStatusLabel(status: string): string {
    return this.saleService.getStatusLabel(status);
  }

  goToSale(saleId: string) {
    this.router.navigate(['/columbarium/sales', saleId]);
  }

  /**
   * Navega a la ficha del nicho del cliente.
   * - 1 nicho: directo a /niches/:id
   * - Varios: muestra lista para elegir (implementación inline en template)
   */
  goToNiche(nicheId: string) {
    this.router.navigate(['/columbarium/niches', nicheId]);
  }
}
