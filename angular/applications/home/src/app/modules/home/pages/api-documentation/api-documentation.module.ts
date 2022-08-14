import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { ApiDocumentationComponent } from './api-documentation.component';

export const ROUTES: Routes = [
  { component: ApiDocumentationComponent, path: '', title: 'API Documentation' },
];

@NgModule({
  declarations: [ApiDocumentationComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ApiDocumentationModule {}
