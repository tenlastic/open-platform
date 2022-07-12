import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';

import { BuildStatusNodeComponent, FilesFormComponent } from './components';
import { BuildsFormPageComponent, BuildsJsonPageComponent, BuildsListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: BuildsListPageComponent },
  { path: ':buildId', component: BuildsFormPageComponent },
  { path: ':buildId/json', component: BuildsJsonPageComponent },
];

@NgModule({
  declarations: [
    BuildsFormPageComponent,
    BuildsJsonPageComponent,
    BuildsListPageComponent,
    BuildStatusNodeComponent,
    FilesFormComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class BuildModule {}
