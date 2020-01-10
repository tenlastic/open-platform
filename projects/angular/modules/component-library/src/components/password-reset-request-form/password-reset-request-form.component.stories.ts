import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule, MatInputModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from '../button/button.component';
import { FormMessageComponent } from '../form-message/form-message.component';
import { PasswordResetRequestFormComponent } from './password-reset-request-form.component';

const imports = [
  BrowserAnimationsModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  ReactiveFormsModule,
];

storiesOf('Password Reset Request Form', module).add('Primary', () => ({
  component: PasswordResetRequestFormComponent,
  moduleMetadata: {
    declarations: [ButtonComponent, FormMessageComponent, PasswordResetRequestFormComponent],
    imports: [...imports],
  },
  template: `<ten-password-reset-request-form></ten-password-reset-request-form>`,
}));
