import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';

import { SharedModule } from '../../shared/shared.module';
import { LogoutPageComponent } from './pages/logout-page.component';

export const ROUTES: Routes = [{ path: '', component: LogoutPageComponent }];

@NgModule({
  declarations: [LogoutPageComponent],
  imports: [ComponentLibraryModule, SharedModule, RouterModule.forChild(ROUTES)],
})
export class LogoutModule {}
