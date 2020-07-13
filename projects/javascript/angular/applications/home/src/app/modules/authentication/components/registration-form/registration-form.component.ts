import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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
  public form: FormGroup;

  public ngOnInit() {
    this.setupForm();
  }

  public submit() {
    if (this.form.invalid) {
      this.form.get('email').markAsTouched();
      this.form
        .get('passwords')
        .get('password')
        .markAsTouched();
      this.form
        .get('passwords')
        .get('confirmPassword')
        .markAsTouched();
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

  private confirmPassword(form: FormGroup) {
    if (form.get('password').value !== form.get('confirmPassword').value) {
      form.get('confirmPassword').setErrors({ required: true });
    }

    return form.get('confirmPassword').errors;
  }

  private setupForm(): void {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.email]),
      passwords: new FormGroup(
        {
          confirmPassword: new FormControl('', Validators.required),
          password: new FormControl('', [Validators.required]),
        },
        this.confirmPassword,
      ),
      username: new FormControl('', [Validators.required]),
    });

    this.form.valueChanges.subscribe(data => {
      this.error = null;
    });
  }
}
