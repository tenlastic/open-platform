import { MatButtonModule, MatIconModule } from '@angular/material';
import { storiesOf } from '@storybook/angular';

import { ButtonComponent } from './button.component';

const imports = [MatButtonModule, MatIconModule];

storiesOf('Button', module)
  .add('Primary', () => ({
    component: ButtonComponent,
    moduleMetadata: {
      declarations: [ButtonComponent],
      imports: [...imports],
    },
    template: `
      <app-button color="primary">
        <mat-icon>add</mat-icon>
        <span>Text</span>
        <mat-icon>remove</mat-icon>
      </app-button>
    `,
  }))
  .add('Primary (Disabled)', () => ({
    component: ButtonComponent,
    moduleMetadata: {
      declarations: [ButtonComponent],
      imports: [...imports],
    },
    template: `
      <app-button color="primary" [disabled]="true" href="https://www.google.com">
        <mat-icon>add</mat-icon>
        <span>Text</span>
        <mat-icon>remove</mat-icon>
      </app-button>
    `,
  }))
  .add('Accent', () => ({
    component: ButtonComponent,
    moduleMetadata: {
      declarations: [ButtonComponent],
      imports: [...imports],
    },
    template: `
      <app-button color="accent">
        <mat-icon>add</mat-icon>
        <span>Text</span>
        <mat-icon>remove</mat-icon>
      </app-button>
    `,
  }));
