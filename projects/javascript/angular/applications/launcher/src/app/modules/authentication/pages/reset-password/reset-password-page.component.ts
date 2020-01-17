import { Component, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  IPasswordResetRequested,
  PasswordResetRequestFormComponent,
} from '@tenlastic/ng-component-library';
import { PasswordResetService } from '@tenlastic/ng-http';

import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss'],
})
export class ResetPasswordPageComponent {
  @ViewChild(PasswordResetRequestFormComponent, { static: false })
  public passwordResetRequestForm: PasswordResetRequestFormComponent;

  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;

  constructor(private passwordResetService: PasswordResetService, private titleService: Title) {
    this.titleService.setTitle(`${TITLE} | Reset Password`);
  }

  public async onPasswordResetRequested(data: IPasswordResetRequested) {
    try {
      await this.passwordResetService.create(data.email);
      this.passwordResetRequestForm.message = `An email explaining how to reset your password has been sent to ${data.email}.`;
    } catch (e) {
      this.passwordResetRequestForm.error = 'Email address has not been registered yet.';
    }
  }
}
