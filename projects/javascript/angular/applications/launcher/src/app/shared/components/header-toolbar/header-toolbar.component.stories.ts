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
  styles: ['app-logo { font-size: 46px; }'],
  template: `
    <app-header-toolbar>
      <img src="/assets/images/logo.png" />
      <app-button color="accent">
        Contact Us
      </app-button>

      <span class="space"></span>

      <app-button color="accent">
        <mat-icon>person</mat-icon>
        <span>Username</span>
        <mat-icon>keyboard_arrow_down</mat-icon>
      </app-button>

      <app-button color="primary">
        <span>Play Now</span>
      </app-button>
    </app-header-toolbar>
  `,
}));
