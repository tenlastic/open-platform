import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { FilesFormComponent } from './components';
import { BuildsFormPageComponent } from './pages/form/form-page.component';
import { BuildsListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: BuildsListPageComponent },
  { path: ':_id', component: BuildsFormPageComponent },
];

@NgModule({
  declarations: [FilesFormComponent, BuildsFormPageComponent, BuildsListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class BuildModule {}
