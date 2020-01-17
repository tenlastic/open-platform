import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IOnRegister, RegistrationFormComponent } from '@tenlastic/ng-component-library';
import { UserService } from '@tenlastic/ng-http';

import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'create-account-page.component.html',
  styleUrls: ['./create-account-page.component.scss'],
})
export class CreateAccountPageComponent {
  @ViewChild(RegistrationFormComponent, { static: false })
  public registrationForm: RegistrationFormComponent;

  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;

  constructor(
    private router: Router,
    private titleService: Title,
    private userService: UserService,
  ) {
    this.titleService.setTitle(`${TITLE} | Create Account`);
  }

  public async onRegister(data: IOnRegister) {
    try {
      await this.userService.create(data);
    } catch (e) {
      this.registrationForm.error = 'Email address has already been registered.';
    }

    this.router.navigateByUrl('/authentication/log-in');
  }
}
