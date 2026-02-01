import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonIcon, IonReorder, IonReorderGroup, IonCheckbox, IonNote, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, reorderTwo } from 'ionicons/icons';

import { Beneficiary } from '../../models/beneficiary.model';

@Component({
  selector: 'app-beneficiaries-manager',
  templateUrl: './beneficiaries-manager.component.html',
  styleUrls: ['./beneficiaries-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonList, IonItem, IonLabel, IonInput, IonSelect,
    IonSelectOption, IonButton, IonIcon, IonReorder,
    IonReorderGroup, IonCheckbox, IonNote,
    IonText
  ]
})
export class BeneficiariesManagerComponent {
  @Input() set initialBeneficiaries(value: Beneficiary[]) {
    if (value && value.length > 0) {
      this.beneficiariesArray.clear();
      value.forEach(b => this.beneficiariesArray.push(this.createBeneficiaryGroup(b)));
    }
  }

  @Output() beneficiariesChange = new EventEmitter<Beneficiary[]>();

  beneficiariesForm: FormGroup;

  relationships = [
    { value: 'esposo', label: 'Esposo' },
    { value: 'esposa', label: 'Esposa' },
    { value: 'hijo', label: 'Hijo' },
    { value: 'hija', label: 'Hija' },
    { value: 'padre', label: 'Padre' },
    { value: 'madre', label: 'Madre' },
    { value: 'hermano', label: 'Hermano' },
    { value: 'hermana', label: 'Hermana' },
    { value: 'otro', label: 'Otro' }
  ];

  constructor(private fb: FormBuilder) {
    addIcons({ add, trash, reorderTwo });

    this.beneficiariesForm = this.fb.group({
      beneficiaries: this.fb.array([])
    });

    // Inicializar con 3 beneficiarios vacios
    for (let i = 0; i < 3; i++) {
      this.addBeneficiary();
    }

    // Emitir cambios
    this.beneficiariesArray.valueChanges.subscribe(() => {
      this.emitChanges();
    });
  }

  get beneficiariesArray(): FormArray {
    return this.beneficiariesForm.get('beneficiaries') as FormArray;
  }

  createBeneficiaryGroup(beneficiary?: Beneficiary): FormGroup {
    return this.fb.group({
      name: [beneficiary?.name || '', [Validators.required, Validators.minLength(3)]],
      relationship: [beneficiary?.relationship || '', Validators.required],
      phone: [beneficiary?.phone || '', [Validators.pattern(/^[0-9]{10}$/)]],
      email: [beneficiary?.email || '', [Validators.email]],
      order: [beneficiary?.order || this.beneficiariesArray.length + 1],
      isDeceased: [beneficiary?.isDeceased || false]
    });
  }

  addBeneficiary() {
    this.beneficiariesArray.push(this.createBeneficiaryGroup());
    this.updateOrders();
  }

  removeBeneficiary(index: number) {
    if (this.beneficiariesArray.length > 3) {
      this.beneficiariesArray.removeAt(index);
      this.updateOrders();
    }
  }

  handleReorder(event: any) {
    const itemToMove = this.beneficiariesArray.at(event.detail.from);
    this.beneficiariesArray.removeAt(event.detail.from);
    this.beneficiariesArray.insert(event.detail.to, itemToMove);
    event.detail.complete();
    this.updateOrders();
  }

  updateOrders() {
    this.beneficiariesArray.controls.forEach((control, index) => {
      control.patchValue({ order: index + 1 }, { emitEvent: false });
    });
    this.emitChanges();
  }

  emitChanges() {
    this.beneficiariesChange.emit(this.beneficiariesArray.value);
  }

  getBeneficiaries(): Beneficiary[] {
    return this.beneficiariesArray.value;
  }

  isValid(): boolean {
    return this.beneficiariesArray.valid && this.beneficiariesArray.length >= 3;
  }
}