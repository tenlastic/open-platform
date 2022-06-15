import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { WebSocketsListPageComponent } from './pages';

export const ROUTES: Routes = [{ path: '', component: WebSocketsListPageComponent }];

@NgModule({
  declarations: [WebSocketsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class WebSocketModule {}
