import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export interface IOnRegister {
  email?: string;
  password?: string;
  username?: string;
}

@Component({
  selector: 'app-registration-form',
  standalone: false,
  templateUrl: 'registration-form.component.html',
})
export class RegistrationFormComponent implements OnInit {
  @Output() public register = new EventEmitter<IOnRegister>();

  public error: string;
  public form: FormGroup;

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

    const values: IOnRegister = {
      password: this.form.get('passwords').get('password').value,
      username: this.form.get('username').value,
    };

    if (this.form.get('email').value) {
      values.email = this.form.get('email').value;
    }

    this.register.emit(values);
  }

  private confirmPassword(form: FormGroup) {
    const confirmPassword = form.get('confirmPassword');
    const password = form.get('password');

    if (confirmPassword.value !== password.value) {
      confirmPassword.setErrors({ match: true });
    } else {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  private setupForm() {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.email]),
      passwords: new FormGroup(
        {
          confirmPassword: new FormControl(''),
          password: new FormControl('', [Validators.required]),
        },
        this.confirmPassword,
      ),
      username: new FormControl('', [
        Validators.pattern(/^[A-Za-z0-9]{0,24}$/),
        Validators.required,
      ]),
    });

    this.form.valueChanges.subscribe((data) => {
      this.error = null;
    });
  }
}
