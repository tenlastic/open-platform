import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';
import { ElectronModule } from '@tenlastic/ng-electron';

import { MaterialModule } from '../material.module';
import {
  InputDialogComponent,
  LayoutComponent,
  LoadingMessageComponent,
  PromptComponent,
  ToggleSectionComponent,
} from './components';
import { AsAnyPipe, CamelCaseToTitleCasePipe, FilesizePipe, KeysPipe } from './pipes';

const components = [
  InputDialogComponent,
  LayoutComponent,
  LoadingMessageComponent,
  PromptComponent,
  ToggleSectionComponent,
];
const modules = [
  CommonModule,
  ComponentLibraryModule,
  ElectronModule,
  FormsModule,
  LayoutModule,
  MaterialModule,
  ReactiveFormsModule,
  RouterModule,
];
const pipes = [AsAnyPipe, CamelCaseToTitleCasePipe, FilesizePipe, KeysPipe];

@NgModule({
  declarations: [...components, ...pipes],
  entryComponents: [InputDialogComponent, PromptComponent],
  exports: [...components, ...modules, ...pipes],
  imports: [...modules],
})
export class SharedModule {}
