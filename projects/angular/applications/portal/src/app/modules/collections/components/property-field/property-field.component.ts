import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-property-field',
  styleUrls: ['./property-field.component.scss'],
  templateUrl: 'property-field.component.html',
})
export class PropertyFieldComponent implements OnInit {
  @Input() public form: FormGroup;
  @Output() public remove = new EventEmitter();

  public ngOnInit() {
    this.form.controls.type.valueChanges.subscribe(val => {
      switch (val) {
        case 'boolean':
          this.form.controls.default.patchValue(false);
          break;

        case 'number':
          this.form.controls.default.patchValue('');
          break;

        case 'string':
          this.form.controls.default.patchValue('');
          break;
      }
    });
  }
}
