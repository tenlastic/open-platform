import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';

import { FilesFormComponent } from './components';
import { ReleasesFormPageComponent } from './pages/form/form-page.component';
import { ReleasesListPageComponent } from './pages/list/list-page.component';

export const ROUTES: Routes = [
  { path: '', component: ReleasesListPageComponent },
  { path: ':_id', component: ReleasesFormPageComponent },
];

@NgModule({
  declarations: [FilesFormComponent, ReleasesFormPageComponent, ReleasesListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ReleaseModule {}
