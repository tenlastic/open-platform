import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UntypedFormGroup, UntypedFormArray } from '@angular/forms';

import { CollectionFormService } from '../../../../../../core/services';

@Component({
  selector: 'app-role-field',
  styleUrls: ['./role-field.component.scss'],
  templateUrl: 'role-field.component.html',
})
export class RoleFieldComponent {
  @Input() public form: UntypedFormGroup;
  @Input() public index: number;
  @Input() public isDefault: boolean;
  @Input() public length: number;
  @Input() public properties: UntypedFormArray;
  @Output() public moveDown = new EventEmitter();
  @Output() public moveUp = new EventEmitter();
  @Output() public remove = new EventEmitter();

  public get criteriaFields() {
    const propertyFields = this.propertyFields.map(f => `record.${f}`);
    const recordFields = this.recordFields.map(f => `record.${f}`);

    return propertyFields.concat(recordFields, this.userFields).sort();
  }
  public criteriaOperators = [{ label: 'Equals', value: '$eq' }];
  public findOperators = [
    { label: 'Equal', value: '$eq' },
    { label: 'Greater Than', value: '$gt' },
    { label: 'Greater Than or Equal', value: '$gte' },
    { label: 'Less Than', value: '$lt' },
    { label: 'Less Than or Equal', value: '$lte' },
    { label: 'Not Equal', value: '$ne' },
  ];
  public get propertyFields() {
    return this.validProperties.map(v => `properties.${v.key}`);
  }
  public recordFields = ['_id', 'createdAt', 'updatedAt', 'userId'];
  public get recordFieldsWithProperties() {
    return this.recordFields.concat(this.propertyFields).sort();
  }
  public userFields = ['user._id', 'user.email', 'user.roles', 'user.username'];
  public get validProperties() {
    return this.properties.value.filter(v => v.key);
  }

  constructor(private collectionFormService: CollectionFormService) {}

  public addCriterion() {
    const criterion = this.collectionFormService.getDefaultCriterionFormGroup();
    const formArray = this.form.get('criteria') as UntypedFormArray;

    formArray.push(criterion);
  }

  public addFindCriterion() {
    const criterion = this.collectionFormService.getDefaultCriterionFormGroup();
    const formArray = this.form.get('permissions.find') as UntypedFormArray;

    formArray.push(criterion);
  }

  public removeCriterion(index: number) {
    const formArray = this.form.get('criteria') as UntypedFormArray;
    formArray.removeAt(index);
  }

  public removeFindCriterion(index: number) {
    const formArray = this.form.get('permissions.find') as UntypedFormArray;
    formArray.removeAt(index);
  }
}
