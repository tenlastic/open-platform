import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../material.module';
import {
  ApiKeyDialogComponent,
  AutocompleteUserFieldComponent,
  BadgeComponent,
  ButtonComponent,
  DataSourceFilterComponent,
  FormMessageComponent,
  GroupInvitationButtonComponent,
  HeaderToolbarComponent,
  InputDialogComponent,
  LayoutComponent,
  LoadingMessageComponent,
  LogsDialogComponent,
  MarkdownComponent,
  MatchComponent,
  MatchPromptComponent,
  MetadataFieldComponent,
  MetadataFieldsComponent,
  PortFieldsComponent,
  ProbeFieldComponent,
  PromptComponent,
  RoleFieldsComponent,
  SidenavComponent,
  SwaggerComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
} from './components';
import { AutofocusDirective, HighlightDirective, NavDirective } from './directives';
import {
  CamelCaseToTitleCasePipe,
  DurationPipe,
  FilesizePipe,
  KeysPipe,
  MarkdownPipe,
  SelectPipe,
  SumPipe,
  TruncatePipe,
  TruthyPipe,
} from './pipes';

const components = [
  ApiKeyDialogComponent,
  AutocompleteUserFieldComponent,
  BadgeComponent,
  ButtonComponent,
  DataSourceFilterComponent,
  FormMessageComponent,
  GroupInvitationButtonComponent,
  HeaderToolbarComponent,
  InputDialogComponent,
  LayoutComponent,
  LoadingMessageComponent,
  LogsDialogComponent,
  MarkdownComponent,
  MatchComponent,
  MatchPromptComponent,
  MetadataFieldComponent,
  MetadataFieldsComponent,
  PortFieldsComponent,
  ProbeFieldComponent,
  PromptComponent,
  RoleFieldsComponent,
  SidenavComponent,
  SwaggerComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
];
const directives = [AutofocusDirective, HighlightDirective, NavDirective];
const modules = [
  CommonModule,
  FormsModule,
  LayoutModule,
  MaterialModule,
  ReactiveFormsModule,
  RouterModule,
];
const pipes = [
  CamelCaseToTitleCasePipe,
  DurationPipe,
  FilesizePipe,
  KeysPipe,
  MarkdownPipe,
  SelectPipe,
  SumPipe,
  TruncatePipe,
  TruthyPipe,
];

@NgModule({
  declarations: [...components, ...directives, ...pipes],
  exports: [...components, ...directives, ...modules, ...pipes],
  imports: [...modules],
})
export class SharedModule {}
