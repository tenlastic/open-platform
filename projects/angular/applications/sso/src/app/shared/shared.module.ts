import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from '../material.module';

const modules = [CommonModule, FormsModule, LayoutModule, MaterialModule, ReactiveFormsModule];

@NgModule({
  exports: [...modules],
  imports: [...modules],
})
export class SharedModule {}
