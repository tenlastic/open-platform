import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { TeamsListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [{ path: '', component: TeamsListPageComponent }];

@NgModule({
  declarations: [TeamsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class TeamModule {}
