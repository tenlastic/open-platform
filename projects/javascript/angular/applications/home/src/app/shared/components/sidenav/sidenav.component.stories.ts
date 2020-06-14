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
      <app-sidenav>
        <div class="nav">
          <app-button color="accent" layout="vertical" text="left">
            <mat-icon>add</mat-icon>
            <span>Text</span>
          </app-button>
        </div>
        <div class="content">
          Content
        </div>
      </app-sidenav>
    `,
}));
