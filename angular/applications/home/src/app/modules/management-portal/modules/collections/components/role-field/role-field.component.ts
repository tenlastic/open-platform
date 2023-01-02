import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormGroup,
  FormArray,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

@Component({
  selector: 'app-role-field',
  styleUrls: ['./role-field.component.scss'],
  templateUrl: 'role-field.component.html',
})
export class RoleFieldComponent {
  @Input() public form: FormGroup;
  @Input() public index: number;
  @Input() public length: number;
  @Input() public properties: FormArray;
  @Output() public moveDown = new EventEmitter();
  @Output() public moveUp = new EventEmitter();
  @Output() public remove = new EventEmitter();

  public get criteria() {
    return this.form.get('criteria') as FormArray;
  }
  public get criteriaFields() {
    const propertyFields = this.propertyFields.map((f) => `record.${f}`);
    const recordFields = this.recordFields.map((f) => `record.${f}`);

    return propertyFields.concat(recordFields, this.userFields).sort();
  }
  public criteriaOperators = [{ label: 'Equals', value: '$eq' }];
  public get find() {
    return this.form.get('permissions').get('find') as FormArray;
  }
  public findOperators = [
    { label: 'Equal', value: '$eq' },
    { label: 'Greater Than', value: '$gt' },
    { label: 'Greater Than or Equal', value: '$gte' },
    { label: 'Less Than', value: '$lt' },
    { label: 'Less Than or Equal', value: '$lte' },
    { label: 'Not Equal', value: '$ne' },
  ];
  public get propertyFields() {
    return this.validProperties.map((v) => `properties.${v.key}`);
  }
  public recordFields = ['_id', 'createdAt', 'updatedAt', 'userId'];
  public get recordFieldsWithProperties() {
    return this.recordFields.concat(this.propertyFields).sort();
  }
  public userFields = ['user._id', 'user.email', 'user.roles', 'user.username'];
  public get validProperties() {
    return this.properties.value.filter((v) => v.key);
  }

  constructor(private formBuilder: FormBuilder) {}

  public addCriterion() {
    const criterion = this.getDefaultCriterionFormGroup();
    const formArray = this.form.get('criteria') as FormArray;

    formArray.push(criterion);
  }

  public addFindCriterion() {
    const criterion = this.getDefaultCriterionFormGroup();
    const formArray = this.form.get('permissions.find') as FormArray;

    formArray.push(criterion);
  }

  public removeCriterion(index: number) {
    const formArray = this.form.get('criteria') as FormArray;
    formArray.removeAt(index);
  }

  public removeFindCriterion(index: number) {
    const formArray = this.form.get('permissions.find') as FormArray;
    formArray.removeAt(index);
  }

  private getDefaultCriterionFormGroup() {
    const form = this.formBuilder.group({
      field: [null as string, Validators.required],
      operator: '$eq',
      reference: null as string,
      type: 'reference',
      value: this.formBuilder.group({ boolean: false, number: 0, string: '' }),
    });

    form.get('type').valueChanges.subscribe((value) => {
      const reference = form.get('reference');

      if (value === 'reference') {
        reference.addValidators([Validators.required]);
      } else {
        reference.removeValidators([Validators.required]);
      }

      reference.updateValueAndValidity({ emitEvent: false });
    });

    return form;
  }
}
