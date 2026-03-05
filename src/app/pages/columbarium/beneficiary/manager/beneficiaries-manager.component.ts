import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonReorder, IonReorderGroup, IonNote, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, reorderTwo } from 'ionicons/icons';

import { BeneficiaryRecord, BeneficiaryInput } from '../../models/beneficiary.model';
import { RELATIONSHIP_OPTIONS } from 'src/app/shared/domain/constants';

/**
 * Gestor de beneficiarios de un nicho.
 * Recibe BeneficiaryRecord[] como estado inicial (existentes en BD).
 * Emite BeneficiaryInput[] con los datos editables para enviar al backend.
 * Solo accesible desde NicheDetail — no desde CustomerDetail.
 */
@Component({
  selector: 'app-beneficiaries-manager',
  templateUrl: './beneficiaries-manager.component.html',
  styleUrls: ['./beneficiaries-manager.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonList, IonItem, IonLabel, IonInput, IonSelect,
    IonSelectOption, IonButton, IonIcon, IonReorder,
    IonReorderGroup, IonNote, IonText
  ]
})
export class BeneficiariesManagerComponent {

  /** Beneficiarios existentes del nicho, obtenidos del backend. */
  @Input() set initialBeneficiaries(value: BeneficiaryRecord[]) {
    if (value?.length > 0) {
      this.beneficiariesArray.clear();
      value.forEach(b => this.beneficiariesArray.push(this.createBeneficiaryGroup(b)));
    }
  }

  /** Emite los datos editables cada vez que cambia la lista. */
  @Output() beneficiariesChange = new EventEmitter<BeneficiaryInput[]>();

  beneficiariesForm: FormGroup;

  /** Opciones de relación desde constants (fuente única de verdad). */
  readonly relationships = RELATIONSHIP_OPTIONS;

  constructor(private fb: FormBuilder) {
    addIcons({ add, trash, reorderTwo });

    this.beneficiariesForm = this.fb.group({
      beneficiaries: this.fb.array([])
    });

    // Inicializar con 3 filas vacías
    for (let i = 0; i < 3; i++) {
      this.addBeneficiary();
    }

    this.beneficiariesArray.valueChanges.subscribe(() => this.emitChanges());
  }

  get beneficiariesArray(): FormArray {
    return this.beneficiariesForm.get('beneficiaries') as FormArray;
  }

  createBeneficiaryGroup(beneficiary?: BeneficiaryRecord | null): FormGroup {
    return this.fb.group({
      name:         [beneficiary?.name         ?? '', [Validators.required, Validators.minLength(3)]],
      relationship: [beneficiary?.relationship ?? '',  Validators.required],
      phone:        [beneficiary?.phone        ?? '', [Validators.pattern(/^[0-9]{10}$/)]],
      email:        [beneficiary?.email        ?? '', [Validators.email]],
      order:        [beneficiary?.order        ?? this.beneficiariesArray.length + 1],
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
    const item = this.beneficiariesArray.at(event.detail.from);
    this.beneficiariesArray.removeAt(event.detail.from);
    this.beneficiariesArray.insert(event.detail.to, item);
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
    this.beneficiariesChange.emit(this.beneficiariesArray.value as BeneficiaryInput[]);
  }

  getBeneficiaries(): BeneficiaryInput[] {
    return this.beneficiariesArray.value as BeneficiaryInput[];
  }

  isValid(): boolean {
    return this.beneficiariesArray.valid && this.beneficiariesArray.length >= 3;
  }
}
