import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

export interface MetadataForm {
  key: FormControl<string>;
  type: FormControl<string>;
  value: FormControl<unknown>;
}

@Component({
  selector: 'app-metadata-field',
  standalone: false,
  styleUrls: ['./metadata-field.component.scss'],
  templateUrl: 'metadata-field.component.html',
})
export class MetadataFieldComponent implements OnInit {
  @Input() public form: FormGroup<MetadataForm>;
  @Output() public remove = new EventEmitter();

  public get type() {
    return this.form.get('type').value;
  }

  public ngOnInit() {
    this.form.controls.type.valueChanges.subscribe((v) => {
      switch (v) {
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
