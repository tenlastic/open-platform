import { Component, OnInit, ViewChild } from '@angular/core';
import { PasswordResetService } from '@tenlastic/http';

import { ActivatedRoute } from '@angular/router';
import { IPasswordReset, PasswordResetFormComponent } from '../../components';

@Component({
  standalone: false,
  styleUrls: ['./reset-password-page.component.scss'],
  templateUrl: 'reset-password-page.component.html',
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
  ) {}

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
