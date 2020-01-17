import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule, MatInputModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from '../button/button.component';
import { FormMessageComponent } from '../form-message/form-message.component';
import { LoginFormComponent } from './login-form.component';

const imports = [
  BrowserAnimationsModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  ReactiveFormsModule,
];

storiesOf('Login Form', module).add('Primary', () => ({
  component: LoginFormComponent,
  moduleMetadata: {
    declarations: [ButtonComponent, FormMessageComponent, LoginFormComponent],
    imports: [...imports],
  },
  template: `<ten-login-form></ten-login-form>`,
}));
