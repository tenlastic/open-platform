import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService, UserService } from '@tenlastic/http';

import { IOnRegister, RegistrationFormComponent } from '../../components';

@Component({
  templateUrl: 'create-account-page.component.html',
  styleUrls: ['./create-account-page.component.scss'],
})
export class CreateAccountPageComponent {
  @ViewChild(RegistrationFormComponent)
  public registrationForm: RegistrationFormComponent;

  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private userService: UserService,
  ) {}

  public async onRegister(data: IOnRegister) {
    try {
      await this.userService.create(data);
    } catch (e) {
      const error = e.errors && e.errors[0];
      const emailError = e.errors?.find(
        (e) => e.name === 'UniqueError' && e.paths.includes('email'),
      );
      const usernameError = e.errors?.find(
        (e) => e.name === 'UniqueError' && e.paths.includes('username'),
      );

      if (emailError && usernameError) {
        this.registrationForm.error = 'Email Address and Username are already taken.';
      } else if (emailError) {
        this.registrationForm.error = 'Email Address is already taken.';
      } else if (usernameError) {
        this.registrationForm.error = 'Username is already taken.';
      } else if (error) {
        this.registrationForm.error = error.message;
      } else {
        this.registrationForm.error = JSON.stringify(e);
      }

      return;
    }

    await this.loginService.createWithCredentials(data.username, data.password);
    this.router.navigateByUrl('/');
  }
}
