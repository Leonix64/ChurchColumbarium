import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonButton, IonIcon, IonCard, IonCardHeader, IonCardContent,
  IonCardTitle, IonBadge, IonProgressBar, IonSpinner, IonList,
  IonItem, IonLabel, ModalController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ellipsisVertical, personOutline, businessOutline, cashOutline,
  calendarOutline, checkmarkCircle, alertCircle, timeOutline,
  receiptOutline, documentTextOutline, shareOutline, trashOutline,
  informationCircleOutline
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Sale, AmortizationEntry } from '../../models/sale.model';
import { Customer } from '../../models/customer.model';
import { Niche } from '../../models/niche.model';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';
import { PaymentRegisterPage } from '../payment/payment-register.page';

@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.page.html',
  styleUrls: ['./sale-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonButton, IonIcon, IonCard, IonCardHeader, IonCardContent,
    IonCardTitle, IonBadge, IonProgressBar, IonSpinner, IonList,
    IonItem, IonLabel,
    EmptyStateComponent, CurrencyMxPipe
  ]
})
export class SaleDetailPage implements OnInit {
  loading = signal(true);
  sale = signal<Sale | null>(null);
  saleId: string | null = null;

  // USUARIO ACTUAL
  currentUser = this.authService.currentUser;

  // Cálculos
  progress = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return this.saleService.calculateProgress(s.amortizationTable);
  });

  // Usar totalPaid del backend
  totalPaidAmount = computed(() => {
    return this.sale()?.totalPaid || 0;
  });

  // Siguiente pago pendiente
  nextPendingPayment = computed(() => {
    const s = this.sale();
    if (!s) return null;
    return s.amortizationTable.find(p =>
      p.status === 'pending' || p.status === 'partial' || p.status === 'overdue'
    );
  });

  customer = computed(() => {
    const s = this.sale();
    return (s?.customer && typeof s.customer === 'object') ? s.customer as Customer : null;
  });

  niche = computed(() => {
    const s = this.sale();
    return (s?.niche && typeof s.niche === 'object') ? s.niche as Niche : null;
  });

  paidPayments = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return s.amortizationTable.filter(p => p.status === 'paid').length;
  });

  overduePayments = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return s.amortizationTable.filter(p => p.status === 'overdue').length;
  });

  constructor(
    private saleService: SaleService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      ellipsisVertical, personOutline, businessOutline, cashOutline,
      calendarOutline, checkmarkCircle, alertCircle, timeOutline,
      receiptOutline, documentTextOutline, shareOutline, trashOutline,
      informationCircleOutline
    });
  }

  ngOnInit() {
    this.saleId = this.route.snapshot.paramMap.get('id');
    if (this.saleId) {
      this.loadSale(this.saleId);
    } else {
      this.loading.set(false);
    }
  }

  loadSale(id: string) {
    this.loading.set(true);
    this.saleService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          //console.log('Venta cargada:', response.data);
          this.sale.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar la venta');
      }
    });
  }

  // MODAL DE PAGO SIN NÚMERO FIJO
  async openPaymentModal() {
    const modal = await this.modalCtrl.create({
      component: PaymentRegisterPage,
      componentProps: {
        sale: this.sale()
        // NO enviamos paymentNumber, dejamos que el usuario elija
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.success && this.saleId) {
      // Recargar venta
      this.loadSale(this.saleId);
    }
  }

  // Cancelar venta
  async cancelSale() {
    const s = this.sale();
    if (!s) return;

    // Validar rol
    if (this.currentUser()?.role !== 'admin') {
      this.notificationService.error('Solo administradores pueden cancelar ventas');
      return;
    }

    // Pedir confirmación con motivo
    const alert = await this.actionSheetCtrl.create({
      header: '¿Cancelar esta venta?',
      subHeader: 'Esta acción liberará el nicho y puede incluir un reembolso',
      buttons: [
        {
          text: 'Cancelar Venta',
          role: 'destructive',
          handler: () => this.confirmCancellation()
        },
        {
          text: 'Volver',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async confirmCancellation() {
    // Crear modal para capturar motivo y monto de reembolso
    this.notificationService.error('Función en desarrollo');
  }

  async presentActionSheet() {
    const s = this.sale();
    const isAdmin = this.currentUser()?.role === 'admin';
    const canCancel = s?.status === 'active' && isAdmin;

    const buttons: any[] = [
      {
        text: 'Ver Cliente',
        icon: 'person-outline',
        handler: () => this.goToCustomer()
      },
      {
        text: 'Ver Nicho',
        icon: 'business-outline',
        handler: () => this.goToNiche()
      },
      {
        text: 'Imprimir Contrato',
        icon: 'document-text-outline',
        handler: () => this.printContract()
      },
      {
        text: 'Compartir',
        icon: 'share-outline',
        handler: () => this.shareSale()
      }
    ];

    // Opción de cancelar solo para admin
    if (canCancel) {
      buttons.push({
        text: 'Cancelar Venta',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.cancelSale()
      });
    }

    buttons.push({
      text: 'Cerrar',
      role: 'cancel',
      icon: 'close-circle-outline'
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Acciones',
      buttons
    });

    await actionSheet.present();
  }

  goToCustomer() {
    const customer = this.sale()?.customer as Customer;
    if (customer?._id) {
      this.router.navigate(['/columbarium/customers', customer._id]);
    }
  }

  goToNiche() {
    const niche = this.sale()?.niche as Niche;
    if (niche) {
      this.router.navigate([
        '/columbarium/niches/module',
        niche.module,
        niche.section
      ], {
        queryParams: { highlight: niche.code }
      });
    }
  }

  goBack() {
    this.router.navigate(['/columbarium/sales']);
  }

  printContract() {
    this.notificationService.error('Funcionalidad en desarrollo');
  }

  shareSale() {
    const s = this.sale();
    if (!s) return;

    const customer = s.customer as Customer;
    const niche = s.niche as Niche;

    const text = `
Venta: ${s.folio}
Cliente: ${customer.firstName} ${customer.lastName}
Nicho: ${niche.code}
Total: $${s.totalAmount.toLocaleString()}
Pagado: $${s.totalPaid.toLocaleString()}
Balance: $${s.balance.toLocaleString()}
Progreso: ${this.progress()}%
    `.trim();

    if (navigator.share) {
      navigator.share({
        title: 'Información de Venta',
        text: text
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        this.notificationService.success('Información copiada');
      });
    }
  }

  // Helpers
  getStatusColor(status: string): string {
    return this.saleService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.saleService.getStatusLabel(status);
  }

  getPaymentStatusColor(status: string): string {
    return this.saleService.getPaymentStatusColor(status);
  }

  getPaymentStatusLabel(status: string): string {
    return this.saleService.getPaymentStatusLabel(status);
  }

  getPaymentMethodLabel(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia'
    };
    return methods[method] || method;
  }

  isNextPayment(payment: AmortizationEntry): boolean {
    return payment.number === this.nextPendingPayment()?.number;
  }

  // Expandir detalles de pago
  expandedPayment = signal<number | null>(null);

  togglePaymentDetails(paymentNumber: number) {
    if (this.expandedPayment() === paymentNumber) {
      this.expandedPayment.set(null);
    } else {
      this.expandedPayment.set(paymentNumber);
    }
  }

  // ¿Tiene pagos aplicados?
  hasPayments(payment: AmortizationEntry): boolean {
    return payment.payments && payment.payments.length > 0;
  }
}