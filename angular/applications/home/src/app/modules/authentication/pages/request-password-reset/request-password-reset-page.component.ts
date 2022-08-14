import { Component, ViewChild } from '@angular/core';
import { PasswordResetService } from '@tenlastic/http';

import { IPasswordResetRequested, PasswordResetRequestFormComponent } from '../../components';

@Component({
  templateUrl: 'request-password-reset-page.component.html',
  styleUrls: ['./request-password-reset-page.component.scss'],
})
export class RequestPasswordResetPageComponent {
  @ViewChild(PasswordResetRequestFormComponent)
  public passwordResetRequestForm: PasswordResetRequestFormComponent;

  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;

  constructor(private passwordResetService: PasswordResetService) {}

  public async onPasswordResetRequested(data: IPasswordResetRequested) {
    try {
      await this.passwordResetService.create(data.email);
      this.passwordResetRequestForm.message = `An email explaining how to reset your password has been sent to ${data.email}.`;
    } catch (e) {
      this.passwordResetRequestForm.error = 'Email address has not been registered yet.';
    }
  }
}
