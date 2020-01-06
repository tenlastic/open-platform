import { MatButtonModule, MatIconModule } from '@angular/material';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from '../button/button.component';
import { SidenavComponent } from './sidenav.component';

const imports = [MatButtonModule, MatIconModule];

storiesOf('Sidenav', module).add('Primary', () => ({
  component: SidenavComponent,
  moduleMetadata: {
    declarations: [ButtonComponent, SidenavComponent],
    imports: [...imports],
  },
  template: `
      <ten-sidenav>
        <div class="nav">
          <ten-button color="accent" layout="vertical" text="left">
            <mat-icon>add</mat-icon>
            <span>Text</span>
          </ten-button>
        </div>
        <div class="content">
          Content
        </div>
      </ten-sidenav>
    `,
}));
