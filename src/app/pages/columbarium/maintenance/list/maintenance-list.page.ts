import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-maintenance-list',
  templateUrl: './maintenance-list.page.html',
  styleUrls: ['./maintenance-list.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MaintenanceListPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
