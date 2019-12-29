import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material.module';
import {
  InputPromptComponent,
  LoadingMessageComponent,
  PromptComponent,
  ToggleSectionComponent,
} from './components';
import { AsAnyPipe, CamelCaseToTitleCasePipe, KeysPipe } from './pipes';

@NgModule({
  declarations: [
    InputPromptComponent,
    LoadingMessageComponent,
    PromptComponent,
    ToggleSectionComponent,

    AsAnyPipe,
    CamelCaseToTitleCasePipe,
    KeysPipe,
  ],
  entryComponents: [InputPromptComponent, PromptComponent],
  exports: [
    /* Angular */
    CommonModule,
    FormsModule,
    LayoutModule,
    MaterialModule,
    ReactiveFormsModule,

    /* Components */
    InputPromptComponent,
    LoadingMessageComponent,
    PromptComponent,
    ToggleSectionComponent,

    /* Pipes */
    AsAnyPipe,
    CamelCaseToTitleCasePipe,
    KeysPipe,
  ],
  imports: [CommonModule, FormsModule, LayoutModule, MaterialModule, ReactiveFormsModule],
})
export class SharedModule {}
