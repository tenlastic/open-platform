import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule, MatInputModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from '../button/button.component';
import { FormMessageComponent } from '../form-message/form-message.component';
import { PasswordResetFormComponent } from './password-reset-form.component';

const imports = [
  BrowserAnimationsModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  ReactiveFormsModule,
];

storiesOf('Password Reset Form', module).add('Primary', () => ({
  component: PasswordResetFormComponent,
  moduleMetadata: {
    declarations: [ButtonComponent, FormMessageComponent, PasswordResetFormComponent],
    imports: [...imports],
  },
  template: `<ten-password-reset-form></ten-password-reset-form>`,
}));
