import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { folderOpenOutline, searchOutline, addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  imports: [IonIcon, IonButton, CommonModule]
})
export class EmptyStateComponent {
  @Input() icon: string = 'folder-open-outline';
  @Input() title: string = 'No hay datos';
  @Input() message: string = 'Aun no se ha agregado ningun elemento';
  @Input() showButton: boolean = false;
  @Input() buttonText: string = 'Agregar';
  @Input() buttonFill: 'solid' | 'outline' | 'clear' = 'solid';
  @Input() buttonColor: string = 'primary';

  @Output() action = new EventEmitter<void>();

  constructor() {
    addIcons({ folderOpenOutline, searchOutline, addCircleOutline });
  }

  onAction() {
    this.action.emit();
  }
}
