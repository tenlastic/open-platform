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

  public get array() {
    return this.form.get('array').value;
  }
  public get type() {
    return this.form.get('type').value;
  }

  public ngOnInit() {
    this.form.get('type').valueChanges.subscribe((val) => {
      switch (val) {
        case 'boolean':
          this.form.get('default').patchValue(false);
          break;

        case 'number':
          this.form.get('default').patchValue('');
          break;

        case 'string':
          this.form.get('default').patchValue('');
          break;
      }
    });
  }
}
