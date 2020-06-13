import { storiesOf } from '@storybook/angular';

import { FormMessageComponent } from './form-message.component';

storiesOf('Form Message', module)
  .add('Error', () => ({
    component: FormMessageComponent,
    moduleMetadata: { declarations: [FormMessageComponent] },
    template: `<app-form-message>This is a form message.</app-form-message>`,
  }))
  .add('Info', () => ({
    component: FormMessageComponent,
    moduleMetadata: { declarations: [FormMessageComponent] },
    template: `<app-form-message level="error">This is a form message.</app-form-message>`,
  }));
