import { Component, ViewChild } from '@angular/core';
import { PasswordResetService } from '@tenlastic/http';

import { IPasswordResetRequested, PasswordResetRequestFormComponent } from '../../components';

@Component({
  standalone: false,
  styleUrls: ['./request-password-reset-page.component.scss'],
  templateUrl: 'request-password-reset-page.component.html',
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
