import { Component, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonMenu, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
  IonNote, IonAvatar, IonText, IonItemDivider
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, businessOutline, peopleOutline, gridOutline,
  cashOutline, statsChartOutline, arrowBackOutline,
  personOutline, settingsOutline, logOutOutline,
  boatOutline,
  personCircleOutline
} from 'ionicons/icons';

import { AuthService } from 'src/app/core/services/auth.service';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
  color?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonMenu, IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
    IonNote, IonAvatar, IonText, IonItemDivider
  ],
})
export class SidebarComponent {
  currentUser = this.authService.currentUser;

  // Menús predefinidos por proyecto
  dashboardMenu: MenuItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: 'home-outline' },
    // { title: 'Mi Perfil', url: '/auth/profile', icon: 'person-outline' }
  ];

  columbariumMenu: MenuItem[] = [
    { title: 'Volver al Dashboard', url: '/dashboard', icon: 'arrow-back-outline', color: 'medium' },
    { title: 'Clientes', url: '/columbarium/customers', icon: 'people-outline' },
    { title: 'Nichos', url: '/columbarium/niches', icon: 'grid-outline' },
    { title: 'Ventas', url: '/columbarium/sales', icon: 'cash-outline' },
    { title: 'Estadísticas', url: '/columbarium/stats', icon: 'stats-chart-outline' }
  ];

  pilgrimagesMenu: MenuItem[] = [
    { title: 'Volver al Dashboard', url: '/dashboard', icon: 'arrow-back-outline', color: 'medium' },
    { title: 'Grupos', url: '/pilgrimages/groups', icon: 'people-outline' },
    { title: 'Viajes', url: '/pilgrimages/trips', icon: 'boat-outline' }
  ];

  constructor(
    private authService: AuthService,
    public router: Router
  ) {
    addIcons({
      homeOutline, businessOutline, peopleOutline, gridOutline,
      cashOutline, statsChartOutline, arrowBackOutline,
      personOutline, settingsOutline, logOutOutline,
      boatOutline, personCircleOutline
    });
  }

  // Metodo para saber que menu mostrar
  isInProject(project: string): boolean {
    return this.router.url.includes(`/${project}`);
  }

  logout() {
    this.authService.logout();
  }
}
