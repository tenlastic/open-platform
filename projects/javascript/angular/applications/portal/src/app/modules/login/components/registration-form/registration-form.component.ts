import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface IOnRegister {
  email: string;
  password: string;
  username: string;
}

@Component({
  templateUrl: 'registration-form.component.html',
  selector: 'app-registration-form',
})
export class RegistrationFormComponent implements OnInit {
  @Output() public register = new EventEmitter<IOnRegister>();

  public error: string;
  public form: FormGroup;

  constructor(private formBuilder: FormBuilder) {}

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
    if (form.get('password').value === form.get('confirmPassword').value) {
      return;
    }

    return form.get('confirmPassword').setErrors({ required: true });
  }

  private setupForm(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      passwords: this.formBuilder.group(
        {
          password: ['', Validators.required],
          confirmPassword: ['', Validators.required],
        },
        { validator: this.confirmPassword },
      ),
      username: ['', [Validators.required]],
    });

    this.form.valueChanges.subscribe(data => {
      this.error = null;
    });
  }
}
