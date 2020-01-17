import { MatButtonModule, MatIconModule, MatToolbarModule } from '@angular/material';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from '../button/button.component';
import { SystemToolbarComponent } from './system-toolbar.component';

storiesOf('System Toolbar', module).add('Primary', () => ({
  component: SystemToolbarComponent,
  moduleMetadata: {
    declarations: [ButtonComponent, SystemToolbarComponent],
    imports: [MatButtonModule, MatIconModule, MatToolbarModule],
  },
  template: '<ten-system-toolbar></ten-system-toolbar>',
}));
