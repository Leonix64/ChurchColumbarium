import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-niches-detail',
  templateUrl: './niches-detail.page.html',
  styleUrls: ['./niches-detail.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class NichesDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
