import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';

import { MaterialModule } from '../material.module';
import {
  InputPromptComponent,
  LayoutComponent,
  LoadingMessageComponent,
  PromptComponent,
  RefreshTokenPromptComponent,
  ToggleSectionComponent,
} from './components';
import { AsAnyPipe, CamelCaseToTitleCasePipe, FilesizePipe, KeysPipe, SumPipe } from './pipes';

const components = [
  InputPromptComponent,
  LayoutComponent,
  LoadingMessageComponent,
  PromptComponent,
  RefreshTokenPromptComponent,
  ToggleSectionComponent,
];
const modules = [
  CommonModule,
  ComponentLibraryModule,
  FormsModule,
  LayoutModule,
  MaterialModule,
  ReactiveFormsModule,
  RouterModule,
];
const pipes = [AsAnyPipe, CamelCaseToTitleCasePipe, FilesizePipe, KeysPipe, SumPipe];

@NgModule({
  declarations: [...components, ...pipes],
  entryComponents: [InputPromptComponent, PromptComponent, RefreshTokenPromptComponent],
  exports: [...components, ...modules, ...pipes],
  imports: [...modules],
})
export class SharedModule {}
