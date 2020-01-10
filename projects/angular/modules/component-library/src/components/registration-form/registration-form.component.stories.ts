import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconModule, MatInputModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from '../button/button.component';
import { FormMessageComponent } from '../form-message/form-message.component';
import { RegistrationFormComponent } from './registration-form.component';

const imports = [
  BrowserAnimationsModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  ReactiveFormsModule,
];

storiesOf('Registration Form', module).add('Primary', () => ({
  component: RegistrationFormComponent,
  moduleMetadata: {
    declarations: [ButtonComponent, FormMessageComponent, RegistrationFormComponent],
    imports: [...imports],
  },
  template: `<ten-registration-form></ten-registration-form>`,
}));
