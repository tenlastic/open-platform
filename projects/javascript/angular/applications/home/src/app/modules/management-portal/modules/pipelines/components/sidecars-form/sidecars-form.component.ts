import { ENTER } from '@angular/cdk/keycodes';
import { Component, Input } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material';

@Component({
  templateUrl: 'sidecars-form.component.html',
  selector: 'app-pipeline-sidecars-form',
  styleUrls: ['./sidecars-form.component.scss'],
})
export class PipelineSidecarsFormComponent {
  @Input() public formArray: FormArray;

  public readonly separatorKeysCodes: number[] = [ENTER];

  public addSidecar() {
    const sidecar = this.getDefaultSidecarFormGroup();
    this.formArray.push(sidecar);
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

  public moveFormArrayElement(index: number, change: number) {
    if (index + change < 0 || index + change >= this.formArray.length) {
      return;
    }

    const element = this.formArray.at(index);

    this.formArray.removeAt(index);
    this.formArray.insert(index + change, element);
  }

  public removeSidecar(index: number) {
    this.formArray.removeAt(index);
  }

  public removeStringFromFormArray(formArray: FormArray, index: number) {
    formArray.removeAt(index);
  }

  private getDefaultSidecarFormGroup() {
    const group = new FormGroup({
      args: new FormArray([]),
      command: new FormArray([]),
      env: new FormArray([]),
      image: new FormControl('', Validators.required),
      name: new FormControl(''),
    });

    // Only allow alphanumeric characters and dashes.
    group.valueChanges.subscribe(value => {
      const name = value.name.replace(/[^A-Za-z0-9\-]/g, '');
      group.get('name').setValue(name, { emitEvent: false });
    });

    return group;
  }
}
