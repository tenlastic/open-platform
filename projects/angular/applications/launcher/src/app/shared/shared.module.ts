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
  ToggleSectionComponent,
} from './components';
import { AsAnyPipe, CamelCaseToTitleCasePipe, KeysPipe } from './pipes';

const components = [
  InputPromptComponent,
  LayoutComponent,
  LoadingMessageComponent,
  PromptComponent,
  ToggleSectionComponent,
];
const pipes = [AsAnyPipe, CamelCaseToTitleCasePipe, KeysPipe];

@NgModule({
  declarations: [...components, ...pipes],
  entryComponents: [InputPromptComponent, PromptComponent],
  exports: [
    /* Angular */
    CommonModule,
    FormsModule,
    LayoutModule,
    MaterialModule,
    ReactiveFormsModule,

    ...components,
    ...pipes,
  ],
  imports: [
    CommonModule,
    ComponentLibraryModule,
    FormsModule,
    LayoutModule,
    MaterialModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class SharedModule {}
