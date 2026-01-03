import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, personCircleOutline, logOutOutline } from 'ionicons/icons';

import { AuthService } from 'src/app/core/services/auth.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardContent,
    IonIcon, IonText, HeaderComponent
  ]
})
export class DashboardPage implements OnInit {
  currentUser = this.authService.currentUser;

  constructor(private router: Router, private authService: AuthService) {
    addIcons({ businessOutline, personCircleOutline, logOutOutline });
  }

  ngOnInit() {
    console.log('Dashboard cargado para:', this.currentUser()?.username);
  }

  goToProject(project: string) {
    this.router.navigate([`/${project}`]);
  }

  logout() {
    this.authService.logout();
  }

}
