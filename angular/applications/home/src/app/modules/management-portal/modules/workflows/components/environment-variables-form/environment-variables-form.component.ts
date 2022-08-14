import { Component, Input } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  templateUrl: 'environment-variables-form.component.html',
  selector: 'app-workflow-environment-variables-form',
  styleUrls: ['./environment-variables-form.component.scss'],
})
export class WorkflowEnvironmentVariablesFormComponent {
  @Input() public formArray: UntypedFormArray;

  public addEnvironmentVariable() {
    const env = this.getDefaultEnvironmentVariableFormGroup();
    this.formArray.push(env);
  }

  public removeEnvironmentVariable(index: number) {
    this.formArray.removeAt(index);
  }

  private getDefaultEnvironmentVariableFormGroup() {
    const group = new UntypedFormGroup({
      name: new UntypedFormControl('', Validators.required),
      value: new UntypedFormControl('', Validators.required),
    });

    // Transform name to uppercase and only allow alphanumeric characters and underscores.
    group.valueChanges.subscribe(value => {
      const name = value.name.toUpperCase().replace(/[^A-Z0-9_]/g, '');
      group.get('name').setValue(name, { emitEvent: false });
    });

    return group;
  }
}
