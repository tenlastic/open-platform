import { Component, ContentChild, ContentChildren, QueryList } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';

import { ErrorComponent } from '../error/error.component';

@Component({
  selector: 'app-form-field',
  standalone: false,
  styleUrls: ['./form-field.component.scss'],
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent {
  @ContentChild(NgControl) private control?: NgControl;
  @ContentChildren(ErrorComponent) formErrors?: QueryList<ErrorComponent>;

  public get invalid() {
    const hasChanged = this.control?.dirty || this.control?.touched;
    return hasChanged && this.control?.invalid;
  }

  public get required() {
    return this.control?.control.hasValidator(Validators.required);
  }

  public ngAfterContentInit() {
    if (!this.control) {
      return;
    }

    for (const formError of this.formErrors) {
      formError.control = this.control;
    }
  }
}
