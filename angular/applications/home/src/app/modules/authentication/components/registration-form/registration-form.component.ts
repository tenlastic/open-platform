import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

export interface IOnRegister {
  email: string;
  password: string;
  username: string;
}

@Component({
  selector: 'app-registration-form',
  templateUrl: 'registration-form.component.html',
})
export class RegistrationFormComponent implements OnInit {
  @Output() public register = new EventEmitter<IOnRegister>();

  public error: string;
  public form: UntypedFormGroup;

  public ngOnInit() {
    this.setupForm();
  }

  public submit() {
    if (this.form.invalid) {
      this.form.get('email').markAsTouched();
      this.form.get('passwords').get('password').markAsTouched();
      this.form.get('passwords').get('confirmPassword').markAsTouched();
      this.form.get('username').markAsTouched();

      return;
    }

    const values = {
      email: this.form.get('email').value,
      password: this.form.get('passwords').get('password').value,
      username: this.form.get('username').value,
    };
    this.register.emit(values);
  }

  private confirmPassword(form: UntypedFormGroup) {
    if (form.get('password').value !== form.get('confirmPassword').value) {
      form.get('confirmPassword').setErrors({ required: true });
    }

    return form.get('confirmPassword').errors;
  }

  private setupForm(): void {
    this.form = new UntypedFormGroup({
      email: new UntypedFormControl('', [Validators.email]),
      passwords: new UntypedFormGroup(
        {
          confirmPassword: new UntypedFormControl('', Validators.required),
          password: new UntypedFormControl('', [Validators.required]),
        },
        this.confirmPassword,
      ),
      username: new UntypedFormControl('', [
        Validators.pattern(/^[A-Za-z0-9]{0,20}$/),
        Validators.required,
      ]),
    });

    this.form.valueChanges.subscribe((data) => {
      this.error = null;
    });
  }
}
