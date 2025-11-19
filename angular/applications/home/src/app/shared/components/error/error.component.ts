import { Component, ContentChild, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Component({
  selector: 'app-error',
  standalone: false,
  styleUrls: ['./error.component.scss'],
  templateUrl: './error.component.html',
})
export class ErrorComponent {
  @ContentChild(NgControl) public control?: NgControl;
  @Input() when?: string;

  public get isVisible(): boolean {
    if (!this.control) {
      return false;
    }

    const hasChanged = this.control.dirty || this.control.touched;
    if (!hasChanged) {
      return false;
    }

    const errors = this.control.errors || {};

    if (this.when) {
      return errors[this.when];
    }

    return this.control.invalid;
  }
}
