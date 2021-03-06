import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '../material.module';
import {
  AutocompleteUserFieldComponent,
  BreadcrumbsComponent,
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
  RefreshTokenPromptComponent,
  SidenavComponent,
  SocialComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
} from './components';
import {
  AsAnyPipe,
  CamelCaseToTitleCasePipe,
  FilesizePipe,
  KeysPipe,
  MarkdownPipe,
  SelectPipe,
  SumPipe,
  TruncatePipe,
  TruthyPipe,
} from './pipes';

const components = [
  AutocompleteUserFieldComponent,
  BreadcrumbsComponent,
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
  RefreshTokenPromptComponent,
  SidenavComponent,
  SocialComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
];
const modules = [
  CommonModule,
  FormsModule,
  LayoutModule,
  MaterialModule,
  ReactiveFormsModule,
  RouterModule,
];
const pipes = [
  AsAnyPipe,
  CamelCaseToTitleCasePipe,
  FilesizePipe,
  KeysPipe,
  MarkdownPipe,
  SelectPipe,
  SumPipe,
  TruncatePipe,
  TruthyPipe,
];

@NgModule({
  declarations: [...components, ...pipes],
  entryComponents: [
    InputDialogComponent,
    LogsDialogComponent,
    MatchPromptComponent,
    PromptComponent,
    RefreshTokenPromptComponent,
    TextAreaDialogComponent,
  ],
  exports: [...components, ...modules, ...pipes],
  imports: [...modules],
})
export class SharedModule {}
