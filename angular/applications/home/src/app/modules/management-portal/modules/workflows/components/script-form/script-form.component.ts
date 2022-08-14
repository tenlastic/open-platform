import { ENTER } from '@angular/cdk/keycodes';
import { Component, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  templateUrl: 'script-form.component.html',
  selector: 'app-workflow-script-form',
  styleUrls: ['./script-form.component.scss'],
})
export class WorkflowScriptFormComponent {
  @Input() public formGroup: FormGroup;

  public readonly separatorKeysCodes: number[] = [ENTER];
  public get command() {
    return this.formGroup.get('command') as FormArray;
  }

  public addStringToFormArray($event: MatChipInputEvent, formArray: FormArray) {
    const { input, value } = $event;

    if (!value) {
      return;
    }

    const control = new FormControl(value);
    formArray.push(control);

    if (input) {
      input.value = '';
    }
  }

  public removeStringFromFormArray(formArray: FormArray, index: number) {
    formArray.removeAt(index);
  }
}
