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
      this.registrationForm.error = JSON.stringify(e);

      return;
    }

    await this.loginService.createWithCredentials(data.username, data.password);
    this.router.navigateByUrl('/');
  }
}
