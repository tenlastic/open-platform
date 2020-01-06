import { MatButtonModule, MatIconModule } from '@angular/material';
import { storiesOf } from '@storybook/angular';

import { TitleComponent } from './title.component';

const imports = [MatButtonModule, MatIconModule];

storiesOf('Title', module).add('Primary', () => ({
  component: TitleComponent,
  moduleMetadata: {
    declarations: [TitleComponent],
    imports: [...imports],
  },
  template: `
      <ten-title>Title</ten-title>
    `,
}));
