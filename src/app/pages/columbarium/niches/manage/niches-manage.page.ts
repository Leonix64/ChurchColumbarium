import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-niches-manage',
  templateUrl: './niches-manage.page.html',
  styleUrls: ['./niches-manage.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class NichesManagePage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
