import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon, IonAvatar, IonLabel, IonCardHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, notificationsOutline, searchOutline, addOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon, CommonModule
  ]
})
export class HeaderComponent {
  @Input() title: string = 'Gestion Iglesia';
  @Input() color: string = 'primary';
  @Input() showSearch: boolean = false;
  @Input() showAdd: boolean = false;
  @Input() showNotifications: boolean = false;

  currentUser = this.authService.currentUser;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ personCircleOutline, notificationsOutline, searchOutline, addOutline });
  }

  onSearch() {
    console.log('Buscar');
  }

  onAdd() {
    console.log('Agregar');
  }

  goToProfile() {
    this.router.navigate(['/auth/profile']);
  }
}
