import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

export interface IPasswordReset {
  password: string;
}

@Component({
  selector: 'app-password-reset-form',
  styleUrls: ['password-reset-form.component.scss'],
  templateUrl: 'password-reset-form.component.html',
})
export class PasswordResetFormComponent implements OnInit {
  @Output() public passwordReset = new EventEmitter<IPasswordReset>();

  public error: string;
  public form: UntypedFormGroup;
  public message: string;

  public ngOnInit() {
    this.setupForm();
  }

  public submit() {
    if (this.form.invalid) {
      this.form.get('password').markAsTouched();
      this.form.get('confirmPassword').markAsTouched();

      return;
    }

    const values = { password: this.form.get('password').value };
    this.passwordReset.emit(values);
  }

  private confirmPassword(form: UntypedFormGroup) {
    if (form.get('password').value !== form.get('confirmPassword').value) {
      form.get('confirmPassword').setErrors({ required: true });
    }

    return form.get('confirmPassword').errors;
  }

  private setupForm(): void {
    this.form = new UntypedFormGroup(
      {
        confirmPassword: new UntypedFormControl('', [Validators.required]),
        password: new UntypedFormControl('', [Validators.required]),
      },
      this.confirmPassword,
    );

    this.form.valueChanges.subscribe(data => {
      this.error = null;
    });
  }
}
