import { LayoutModule } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';
import { ElectronModule } from '@tenlastic/ng-electron';

import { MaterialModule } from '../material.module';
import { LayoutComponent } from './components';

const components = [LayoutComponent];
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

@NgModule({
  declarations: [...components],
  exports: [...components, ...modules],
  imports: [...modules],
})
export class SharedModule {}
