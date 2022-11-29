import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';
import { PropertyFormGroup } from '../../pages';

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

  public get type() {
    return this.form.get('type').value;
  }

  public get fieldType() {
    const field = this.form.get('field').value;
    return this.getPropertyType(field, this.properties.value);
  }

  private getPropertyType(key: string, properties: PropertyFormGroup[]) {
    const property = properties.find((v) => `properties.${v.key}` === key);
    return property ? property.type : 'string';
  }
}
