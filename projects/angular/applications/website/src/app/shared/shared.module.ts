import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  LayoutComponent,
  PatchStatusComponent,
  PlayNowButtonComponent
} from './components';

import { MaterialModule } from '@app/material.module';

const components = [
  LayoutComponent,
  PatchStatusComponent,
  PlayNowButtonComponent
];

const modules = [
  CommonModule,
  FormsModule,
  LayoutModule,
  MaterialModule,
  ReactiveFormsModule,
  RouterModule
];

@NgModule({
  declarations: [...components],
  exports: [...modules, ...components],
  imports: [...modules]
})
export class SharedModule {}
