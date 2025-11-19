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
  DeletionOverlayComponent,
  DialogComponent,
  ErrorComponent,
  FormFieldComponent,
  FormMessageComponent,
  GroupInvitationButtonComponent,
  HeaderToolbarComponent,
  InputDialogComponent,
  LayoutComponent,
  ListTableComponent,
  LoadingMessageComponent,
  LogsComponent,
  LogsDialogComponent,
  MarkdownComponent,
  MatchComponent,
  MatchPromptComponent,
  MetadataFieldComponent,
  MetadataFieldsComponent,
  PortFieldsComponent,
  ProbeFieldComponent,
  PromptComponent,
  PromptOverlayComponent,
  RoleFieldsComponent,
  SideMenuComponent,
  SideMenuOverlayComponent,
  SwaggerComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
} from './components';
import {
  AutofocusDirective,
  HighlightDirective,
  NavDirective,
  ResponsiveDirective,
} from './directives';
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
  DeletionOverlayComponent,
  DialogComponent,
  ErrorComponent,
  FormFieldComponent,
  FormMessageComponent,
  GroupInvitationButtonComponent,
  HeaderToolbarComponent,
  InputDialogComponent,
  LayoutComponent,
  ListTableComponent,
  LoadingMessageComponent,
  LogsComponent,
  LogsDialogComponent,
  MarkdownComponent,
  MatchComponent,
  MatchPromptComponent,
  MetadataFieldComponent,
  MetadataFieldsComponent,
  PortFieldsComponent,
  ProbeFieldComponent,
  PromptComponent,
  PromptOverlayComponent,
  RoleFieldsComponent,
  SideMenuComponent,
  SideMenuOverlayComponent,
  SwaggerComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
];
const directives = [AutofocusDirective, HighlightDirective, NavDirective, ResponsiveDirective];
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
