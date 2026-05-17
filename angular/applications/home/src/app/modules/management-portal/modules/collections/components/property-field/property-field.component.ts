import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

export interface PropertyFieldForm {
  array?: FormControl<string>;
  default?: FormControl<boolean | number | string>;
  key?: FormControl<string>;
  properties?: FormArray<FormGroup<PropertyFieldForm>>;
  required?: FormControl<boolean>;
  type?: FormControl<string>;
}

@Component({
  selector: 'app-property-field',
  standalone: false,
  styleUrls: ['./property-field.component.scss'],
  templateUrl: 'property-field.component.html',
})
export class PropertyFieldComponent implements OnInit {
  @Input() public form: FormGroup<PropertyFieldForm>;
  @Output() public remove = new EventEmitter();

  public get array() {
    return this.form.get('array').value;
  }
  public get properties() {
    return this.form.get('properties') as FormArray;
  }
  public get type() {
    return this.form.get('type').value;
  }

  public static getDefaultFormGroup() {
    return new FormGroup<PropertyFieldForm>({
      array: new FormControl('boolean'),
      default: new FormControl(false),
      key: new FormControl('', [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,64}$/)]),
      properties: new FormArray([]),
      required: new FormControl(false),
      type: new FormControl('boolean'),
    });
  }

  public ngOnInit() {
    this.form.get('type').valueChanges.subscribe((val) => {
      switch (val) {
        case 'boolean':
          this.form.get('default').patchValue(false);
          break;

        case 'number':
          this.form.get('default').patchValue('');
          break;

        case 'string':
          this.form.get('default').patchValue('');
          break;
      }
    });
  }

  public addProperty() {
    const property = PropertyFieldComponent.getDefaultFormGroup();
    const formArray = this.form.get('properties') as FormArray;
    formArray.push(property);
  }

  public removeProperty(index: number) {
    const formArray = this.form.get('properties') as FormArray;
    formArray.removeAt(index);
  }
}
