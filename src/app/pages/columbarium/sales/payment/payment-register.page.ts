import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-payment-register',
  templateUrl: './payment-register.page.html',
  styleUrls: ['./payment-register.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PaymentRegisterPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
