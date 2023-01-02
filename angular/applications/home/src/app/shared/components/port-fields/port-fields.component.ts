import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { IGameServer } from '@tenlastic/http';

@Component({
  selector: 'app-port-fields',
  styleUrls: ['port-fields.component.scss'],
  templateUrl: 'port-fields.component.html',
})
export class PortFieldsComponent {
  @Input() public form: FormArray;

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
    return this.formBuilder.group({
      port: [null, Validators.required],
      protocol: IGameServer.Protocol.Tcp,
    });
  }
}
