import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MetadataForm } from '../metadata-field/metadata-field.component';

@Component({
  selector: 'app-metadata-fields',
  standalone: false,
  styleUrls: ['metadata-fields.component.scss'],
  templateUrl: 'metadata-fields.component.html',
})
export class MetadataFieldsComponent {
  @Input() public formArray: FormArray<FormGroup<MetadataForm>>;

  constructor(private formBuilder: FormBuilder) {}

  public addProperty() {
    const property = this.getDefaultPropertyFormGroup();
    this.formArray.push(property);
  }

  public removeProperty(index: number) {
    this.formArray.removeAt(index);
  }

  private getDefaultPropertyFormGroup() {
    return this.formBuilder.group<MetadataForm>({
      key: this.formBuilder.control('', [
        Validators.required,
        Validators.pattern(/^[0-9A-Za-z\-]{2,64}$/),
      ]),
      type: this.formBuilder.control('boolean'),
      value: this.formBuilder.control(false),
    });
  }
}
