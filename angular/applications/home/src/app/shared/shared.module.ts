import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HttpModule } from '../http.module';
import { MaterialModule } from '../material.module';
import {
  ApiKeyDialogComponent,
  AutocompleteUserFieldComponent,
  ButtonComponent,
  DataSourceFilterComponent,
  FormMessageComponent,
  GroupMessagesComponent,
  HeaderToolbarComponent,
  InputDialogComponent,
  LayoutComponent,
  LoadingMessageComponent,
  LogsDialogComponent,
  MarkdownComponent,
  MatchPromptComponent,
  MessageGroupComponent,
  MessagesComponent,
  MetadataFieldComponent,
  MetadataFieldsComponent,
  PromptComponent,
  SidenavComponent,
  SocialComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
} from './components';
import { HighlightDirective, NavDirective } from './directives';
import {
  AsAnyPipe,
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
  ButtonComponent,
  DataSourceFilterComponent,
  FormMessageComponent,
  GroupMessagesComponent,
  HeaderToolbarComponent,
  InputDialogComponent,
  LayoutComponent,
  LoadingMessageComponent,
  LogsDialogComponent,
  MarkdownComponent,
  MatchPromptComponent,
  MessageGroupComponent,
  MessagesComponent,
  MetadataFieldComponent,
  MetadataFieldsComponent,
  PromptComponent,
  SidenavComponent,
  SocialComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
];
const directives = [HighlightDirective, NavDirective];
const modules = [
  CommonModule,
  FormsModule,
  HttpModule,
  LayoutModule,
  MaterialModule,
  ReactiveFormsModule,
  RouterModule,
];
const pipes = [
  AsAnyPipe,
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
