import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, IonBadge, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, locationOutline, pricetagOutline, cubeOutline } from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { NicheService } from '../../services/niche.service';
import { StatusBadgeComponent } from 'src/app/shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-niche-detail-modal',
  standalone: true,
  templateUrl: './niche-detail-modal.component.html',
  styleUrls: ['./niche-detail-modal.component.scss'],
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonIcon, StatusBadgeComponent
  ],
})
export class NicheDetailModalComponent {
  @Input() niche!: Niche;

  constructor(
    public nicheService: NicheService,
    private modalCtrl: ModalController
  ) {
    addIcons({ close, locationOutline, pricetagOutline, cubeOutline });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  viewInGrid() {
    this.modalCtrl.dismiss({ action: 'viewInGrid', niche: this.niche });
  }

  sellNiche() {
    this.modalCtrl.dismiss({ action: 'sell', niche: this.niche });
  }
}
