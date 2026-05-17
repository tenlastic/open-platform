import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

export interface RolesForm {
  [key: string]: FormControl<boolean>;
}

@Component({
  selector: 'app-role-fields',
  standalone: false,
  styleUrls: ['role-fields.component.scss'],
  templateUrl: 'role-fields.component.html',
})
export class RoleFieldsComponent {
  @Input() public form: FormGroup<RolesForm>;
  @Input() public formGroupName = 'roles';
  @Input() public play = false;
}
