import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { WebSocketDocumentationComponent } from './web-socket-documentation.component';

export const ROUTES: Routes = [
  { component: WebSocketDocumentationComponent, path: '', title: 'Web Socket Documentation' },
];

@NgModule({
  declarations: [WebSocketDocumentationComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class WebSocketDocumentationModule {}
