import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-metadata-field',
  styleUrls: ['./metadata-field.component.scss'],
  templateUrl: 'metadata-field.component.html',
})
export class MetadataFieldComponent implements OnInit {
  @Input() public form: UntypedFormGroup;
  @Output() public remove = new EventEmitter();

  public ngOnInit() {
    this.form.controls.type.valueChanges.subscribe(val => {
      switch (val) {
        case 'boolean':
          this.form.controls.value.patchValue(false);
          break;

        case 'number':
          this.form.controls.value.patchValue('');
          break;

        case 'string':
          this.form.controls.value.patchValue('');
          break;
      }
    });
  }
}
