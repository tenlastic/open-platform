import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
} from '@angular/material';

import { ButtonComponent } from './components/button/button.component';
import { FormMessageComponent } from './components/form-message/form-message.component';
import { HeaderToolbarComponent } from './components/header-toolbar/header-toolbar.component';
import { LoadingMessageComponent } from './components/loading-message/loading-message.component';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { PasswordResetFormComponent } from './components/password-reset-form/password-reset-form.component';
import { PasswordResetRequestFormComponent } from './components/password-reset-request-form/password-reset-request-form.component';
import { RegistrationFormComponent } from './components/registration-form/registration-form.component';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { SystemToolbarComponent } from './components/system-toolbar/system-toolbar.component';
import { TitleComponent } from './components/title/title.component';

import { MarkdownPipe } from './pipes/markdown/markdown.pipe';
import { TruncatePipe } from './pipes/truncate/truncate.pipe';

const components = [
  ButtonComponent,
  FormMessageComponent,
  HeaderToolbarComponent,
  LoadingMessageComponent,
  LoginFormComponent,
  PasswordResetFormComponent,
  PasswordResetRequestFormComponent,
  RegistrationFormComponent,
  SidenavComponent,
  SystemToolbarComponent,
  TitleComponent,
];
const modules = [
  CommonModule,
  FormsModule,
  MatButtonModule,
  MatIconModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  ReactiveFormsModule,
];
const pipes = [MarkdownPipe, TruncatePipe];

@NgModule({
  declarations: [...components, ...pipes],
  exports: [...components, ...modules, ...pipes],
  imports: [...modules],
})
export class ComponentLibraryModule {}
