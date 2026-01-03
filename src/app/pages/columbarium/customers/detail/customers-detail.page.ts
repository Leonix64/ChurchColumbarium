import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-customers-detail',
  templateUrl: './customers-detail.page.html',
  styleUrls: ['./customers-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class CustomersDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
