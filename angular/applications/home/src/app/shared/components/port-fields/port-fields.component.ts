import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { IGameServer } from '@tenlastic/http';

export interface PortForm {
  port: FormControl<number>;
  protocol: FormControl<IGameServer.Protocol>;
}

@Component({
  selector: 'app-port-fields',
  standalone: false,
  styleUrls: ['port-fields.component.scss'],
  templateUrl: 'port-fields.component.html',
})
export class PortFieldsComponent {
  @Input() public form: FormArray<FormGroup<PortForm>>;

  public Protocol = IGameServer.Protocol;

  constructor(private formBuilder: FormBuilder) {}

  public push() {
    const property = this.getDefaultFormGroup();
    this.form.push(property);
  }

  public removeAt(index: number) {
    this.form.removeAt(index);
  }

  private getDefaultFormGroup() {
    return this.formBuilder.group<PortForm>({
      port: this.formBuilder.control(null, Validators.required),
      protocol: this.formBuilder.control(IGameServer.Protocol.Tcp),
    });
  }
}
