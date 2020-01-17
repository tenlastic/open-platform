import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface IPasswordReset {
  password: string;
}

@Component({
  templateUrl: 'password-reset-form.component.html',
  selector: 'app-password-reset-form',
  styleUrls: ['password-reset-form.component.scss']
})
export class PasswordResetFormComponent implements OnInit {
  @Output() public passwordReset = new EventEmitter<IPasswordReset>();

  public error: string;
  public form: FormGroup;
  public message: string;

  constructor(private formBuilder: FormBuilder) { }

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

  private confirmPassword(form: FormGroup) {
    if (form.get('password').value === form.get('confirmPassword').value) {
      return;
    }

    return form.get('confirmPassword').setErrors({ required: true });
  }

  private setupForm(): void {
    this.form = this.formBuilder.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    }, { validator: this.confirmPassword });

    this.form.valueChanges.subscribe((data) => {
      this.error = null;
    });
  }
}
