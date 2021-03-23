import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-metadata-fields',
  templateUrl: 'metadata-fields.component.html',
})
export class MetadataFieldsComponent {
  @Input() public formArray: FormArray;

  constructor(private formBuilder: FormBuilder) {}

  public addProperty() {
    const property = this.getDefaultPropertyFormGroup();
    this.formArray.push(property);
  }

  public removeProperty(index: number) {
    this.formArray.removeAt(index);
  }

  private getDefaultPropertyFormGroup() {
    return this.formBuilder.group({
      key: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
      value: false,
      type: 'boolean',
    });
  }
}
