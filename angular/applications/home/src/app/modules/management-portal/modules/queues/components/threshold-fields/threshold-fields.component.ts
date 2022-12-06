import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-threshold-fields',
  styleUrls: ['threshold-fields.component.scss'],
  templateUrl: 'threshold-fields.component.html',
})
export class ThresholdFieldsComponent {
  @Input() public formArray: FormArray;

  constructor(private formBuilder: FormBuilder) {}

  public push() {
    const property = this.getDefaultFormGroup();
    this.formArray.push(property);
  }

  public removeAt(index: number) {
    this.formArray.removeAt(index);
  }

  private getDefaultFormGroup() {
    return this.formBuilder.group({
      seconds: [null, Validators.required],
      teams: [null, Validators.required],
      usersPerTeam: [null, Validators.required],
    });
  }
}
