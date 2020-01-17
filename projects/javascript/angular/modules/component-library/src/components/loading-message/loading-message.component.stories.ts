import { MatProgressSpinnerModule } from '@angular/material';
import { storiesOf } from '@storybook/angular';

import { LoadingMessageComponent } from './loading-message.component';

const imports = [MatProgressSpinnerModule];

storiesOf('Loading Message', module).add('Primary', () => ({
  component: LoadingMessageComponent,
  moduleMetadata: {
    declarations: [LoadingMessageComponent],
    imports: [...imports],
  },
  template: `<ten-loading-message>Loading...</ten-loading-message>`,
}));
