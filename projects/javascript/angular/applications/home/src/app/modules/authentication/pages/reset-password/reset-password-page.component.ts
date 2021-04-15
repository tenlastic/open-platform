import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { PasswordResetService } from '@tenlastic/ng-http';

import { TITLE } from '../../../../shared/constants';
import { IPasswordReset, PasswordResetFormComponent } from '../../components';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: 'reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.scss'],
})
export class ResetPasswordPageComponent implements OnInit {
  @ViewChild(PasswordResetFormComponent)
  public passwordResetForm: PasswordResetFormComponent;

  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;

  private resetHash: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private passwordResetService: PasswordResetService,
    private titleService: Title,
  ) {
    this.titleService.setTitle(`${TITLE} | Reset Password`);
  }

  public ngOnInit() {
    const { snapshot } = this.activatedRoute;
    this.resetHash = snapshot.params.hash;
  }

  public async onPasswordReset(data: IPasswordReset) {
    try {
      await this.passwordResetService.delete(this.resetHash, data.password);
      this.passwordResetForm.message = `Password reset successfully. Please log in with your new password.`;
    } catch (e) {
      this.passwordResetForm.error = 'An error occurred resetting your password.';
    }
  }
}
