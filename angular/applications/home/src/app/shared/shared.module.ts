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
  GameServerButtonComponent,
  GroupInvitationButtonComponent,
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
  QueueMemberButtonComponent,
  SidenavComponent,
  SocialComponent,
  TextAreaDialogComponent,
  TitleComponent,
  ToggleSectionComponent,
} from './components';
import { AutofocusDirective, HighlightDirective, NavDirective } from './directives';
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
  BadgeComponent,
  ButtonComponent,
  DataSourceFilterComponent,
  FormMessageComponent,
  GameServerButtonComponent,
  GroupInvitationButtonComponent,
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
  QueueMemberButtonComponent,
  SidenavComponent,
  SocialComponent,
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
