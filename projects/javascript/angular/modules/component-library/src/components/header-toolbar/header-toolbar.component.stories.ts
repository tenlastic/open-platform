import { MatButtonModule, MatIconModule, MatToolbarModule } from '@angular/material';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from '../button/button.component';
import { HeaderToolbarComponent } from './header-toolbar.component';

storiesOf('Header Toolbar', module).add('Primary', () => ({
  component: HeaderToolbarComponent,
  moduleMetadata: {
    declarations: [ButtonComponent, HeaderToolbarComponent],
    imports: [MatButtonModule, MatIconModule, MatToolbarModule],
  },
  styles: ['ten-logo { font-size: 46px; }'],
  template: `
    <ten-header-toolbar>
      <img src="/assets/images/logo.png" />
      <ten-button color="accent">
        Contact Us
      </ten-button>

      <span class="space"></span>

      <ten-button color="accent">
        <mat-icon>person</mat-icon>
        <span>Username</span>
        <mat-icon>keyboard_arrow_down</mat-icon>
      </ten-button>

      <ten-button color="primary">
        <span>Play Now</span>
      </ten-button>
    </ten-header-toolbar>
  `,
}));
