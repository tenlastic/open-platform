import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export interface IPasswordResetRequested {
  email: string;
}

@Component({
  selector: 'app-password-reset-request-form',
  styleUrls: ['password-reset-request-form.component.scss'],
  templateUrl: 'password-reset-request-form.component.html',
})
export class PasswordResetRequestFormComponent implements OnInit {
  @Output() public passwordResetRequested = new EventEmitter<IPasswordResetRequested>();

  public error: string;
  public form: FormGroup;
  public message: string;

  public ngOnInit() {
    this.setupForm();
  }

  public submit() {
    if (this.form.invalid) {
      this.form.get('email').markAsTouched();

      return;
    }

    const values = {
      email: this.form.get('email').value,
    };
    this.passwordResetRequested.emit(values);
  }

  private setupForm(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }
}
