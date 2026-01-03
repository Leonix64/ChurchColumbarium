import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { HeaderComponent } from "src/app/shared/components/header/header.component";

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.page.html',
  styleUrls: ['./customers-list.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class CustomersListPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
