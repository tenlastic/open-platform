import { NgModule } from '@angular/core';
import {
  MatButtonModule,
  MatIconModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
} from '@angular/material';

import { ButtonComponent } from './components/button/button.component';
import { FormMessageComponent } from './components/form-message/form-message.component';
import { HeaderToolbarComponent } from './components/header-toolbar/header-toolbar.component';
import { LoadingMessageComponent } from './components/loading-message/loading-message.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { SystemToolbarComponent } from './components/system-toolbar/system-toolbar.component';
import { TitleComponent } from './components/title/title.component';

const components = [
  ButtonComponent,
  FormMessageComponent,
  HeaderToolbarComponent,
  LoadingMessageComponent,
  SidenavComponent,
  SystemToolbarComponent,
  TitleComponent,
];
const modules = [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatToolbarModule];

@NgModule({
  declarations: [...components],
  exports: [...components, ...modules],
  imports: [...modules],
})
export class ComponentLibraryModule {}
