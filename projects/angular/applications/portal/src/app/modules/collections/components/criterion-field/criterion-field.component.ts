import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';

import { CollectionFormService } from '@app/core/services';

export interface CriterionFieldComponentOperator {
  label: string;
  value: string;
}

@Component({
  selector: 'app-criterion-field',
  styleUrls: ['./criterion-field.component.scss'],
  templateUrl: 'criterion-field.component.html',
})
export class CriterionFieldComponent {
  @Input() public fields: string[];
  @Input() public form: FormGroup;
  @Input() public operators: CriterionFieldComponentOperator[];
  @Input() public properties: FormArray;
  @Input() public referenceFields: string[];
  @Output() public remove = new EventEmitter();

  constructor(private collectionFormService: CollectionFormService) {}

  public get fieldType() {
    const field = this.form.get('field').value;
    return this.collectionFormService.getPropertyType(field, this.properties.value);
  }
}
