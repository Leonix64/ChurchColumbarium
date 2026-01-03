import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-niches-grid',
  templateUrl: './niches-grid.page.html',
  styleUrls: ['./niches-grid.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class NichesGridPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
