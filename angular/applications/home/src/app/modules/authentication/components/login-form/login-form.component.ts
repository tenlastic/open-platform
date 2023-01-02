import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export interface ILogIn {
  password: string;
  username: string;
}

@Component({
  selector: 'app-login-form',
  templateUrl: 'login-form.component.html',
})
export class LoginFormComponent implements OnInit {
  @Output() public logIn = new EventEmitter<ILogIn>();

  public error: string;
  public form: FormGroup;

  public ngOnInit() {
    this.setupForm();
  }

  public submit() {
    if (this.form.invalid) {
      this.form.get('password').markAsTouched();
      this.form.get('username').markAsTouched();

      return;
    }

    const values = {
      password: this.form.get('password').value,
      username: this.form.get('username').value,
    };
    this.logIn.emit(values);
  }

  private setupForm() {
    this.form = new FormGroup({
      password: new FormControl('', Validators.required),
      username: new FormControl('', [Validators.required]),
    });

    this.form.valueChanges.subscribe((data) => {
      this.error = null;
    });
  }
}
