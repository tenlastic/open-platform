import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-role-fields',
  styleUrls: ['role-fields.component.scss'],
  templateUrl: 'role-fields.component.html',
})
export class RoleFieldsComponent {
  @Input() public form: FormGroup;
  @Input() public formGroupName = 'roles';
}
