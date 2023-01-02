import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import { BuildStatusNodeComponent, FilesFormComponent } from './components';
import { BuildsFormPageComponent, BuildsJsonPageComponent, BuildsListPageComponent } from './pages';

export const ROUTES: Routes = [
  { component: BuildsListPageComponent, path: '', title: 'Builds' },
  {
    component: BuildsFormPageComponent,
    data: { param: 'buildId', title: 'Build' },
    path: ':buildId',
    title: FormResolver,
  },
  {
    component: BuildsJsonPageComponent,
    data: { param: 'buildId', title: 'Build' },
    path: ':buildId/json',
    title: FormResolver,
  },
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
