import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonButton, IonIcon, IonContent, IonBadge, IonSpinner,
  ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ellipsisVertical, personCircle, call, location, medkit,
  people, informationCircle, createOutline, closeCircleOutline,
  checkmarkCircleOutline, alertCircleOutline, person, shareOutline,
  trashOutline
} from 'ionicons/icons';

import { CustomerService } from '../../services/customer.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customers-detail',
  templateUrl: './customers-detail.page.html',
  styleUrls: ['./customers-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
    IonButton, IonIcon, IonContent, IonBadge, IonSpinner,
    EmptyStateComponent
  ]
})
export class CustomersDetailPage implements OnInit {
  customer = signal<Customer | null>(null);
  loading = signal(true);
  customerId: string | null = null;

  constructor(
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private actionSheetCtrl: ActionSheetController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      ellipsisVertical, personCircle, call, location, medkit,
      people, informationCircle, createOutline, closeCircleOutline,
      checkmarkCircleOutline, alertCircleOutline, person, shareOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get('id');

    if (this.customerId) {
      this.loadCustomer(this.customerId);
      //console.log(this.customerId);
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
          //console.log(this.customer());
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar cliente');
      }
    });
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Acciones',
      buttons: [
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
          text: 'Compartir',
          icon: 'share-outline',
          handler: () => this.shareCustomer()
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-circle-outline'
        }
      ]
    });

    await actionSheet.present();
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
      `¿Estas seguro de ${action} a ${currentCustomer.firstName} ${currentCustomer.lastName}?`
    );

    if (!confirmed) return;

    const request$ = currentCustomer.active
      ? this.customerService.deactivate(this.customerId)
      : this.customerService.activate(this.customerId);

    request$.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customer.set(response.data);
          this.notificationService.success(
            `Cliente ${action}do exitosamente`
          );
        }
      },
      error: () => {
        // El interceptor ya deberia manejar el error
      }
    });
  }

  shareCustomer() {
    const currentCustomer = this.customer();
    if (!currentCustomer) return;

    const text = `
      Cliente: ${currentCustomer.firstName} ${currentCustomer.lastName}
      Teléfono: ${currentCustomer.phone}
      ${currentCustomer.email ? `Email: ${currentCustomer.email}` : ''}
      ${currentCustomer.rfc ? `RFC: ${currentCustomer.rfc}` : ''}`.trim();

    if (navigator.share) {
      navigator.share({
        title: 'Información del cliente',
        text: text
      }).catch(() => {
        // Usuario cancelo
      });
    } else {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(text).then(() => {
        this.notificationService.success('Información copiada al portapapeles');
      });
    }
  }

  goBack() {
    this.router.navigate(['/columbarium/customers']);
  }
}
