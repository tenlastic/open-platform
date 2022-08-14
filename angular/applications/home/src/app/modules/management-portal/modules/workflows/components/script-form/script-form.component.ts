import { ENTER } from '@angular/cdk/keycodes';
import { Component, Input } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  templateUrl: 'script-form.component.html',
  selector: 'app-workflow-script-form',
  styleUrls: ['./script-form.component.scss'],
})
export class WorkflowScriptFormComponent {
  @Input() public formGroup: UntypedFormGroup;

  public readonly separatorKeysCodes: number[] = [ENTER];
  public get command() {
    return this.formGroup.get('command') as UntypedFormArray;
  }

  public addStringToFormArray($event: MatChipInputEvent, formArray: UntypedFormArray) {
    const { input, value } = $event;

    if (!value) {
      return;
    }

    const control = new UntypedFormControl(value);
    formArray.push(control);

    if (input) {
      input.value = '';
    }
  }

  public removeStringFromFormArray(formArray: UntypedFormArray, index: number) {
    formArray.removeAt(index);
  }
}
