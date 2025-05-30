import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { QueueModel } from '@tenlastic/http';

@Component({
  selector: 'app-threshold-fields',
  styleUrls: ['threshold-fields.component.scss'],
  templateUrl: 'threshold-fields.component.html',
})
export class ThresholdFieldsComponent {
  @Input() public formArray: FormArray;
  @Input() public teams = false;

  constructor(private formBuilder: FormBuilder) {}

  public getUsersPerTeam(index: number) {
    return this.formArray.at(index).get('usersPerTeam') as FormArray;
  }

  public push() {
    const property = this.getDefaultFormGroup();
    this.formArray.push(property);
  }

  public pushUsersPerTeam(formArray: FormArray) {
    const control = this.formBuilder.control(1, [Validators.min(1), Validators.required]);
    formArray.push(control);
  }

  private getDefaultFormGroup() {
    const usersPerTeamFormArray = this.formBuilder.array([], Validators.required);
    this.pushUsersPerTeam(usersPerTeamFormArray);
    this.pushUsersPerTeam(usersPerTeamFormArray);

    return this.formBuilder.group({
      rating: [0],
      seconds: [0, [Validators.min(0), Validators.required]],
      usersPerTeam: usersPerTeamFormArray,
    });
  }
}
