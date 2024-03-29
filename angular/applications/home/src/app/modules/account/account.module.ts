import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { LayoutComponent } from './components';
import { InformationPageComponent } from './pages';

export const ROUTES: Routes = [
  {
    children: [{ component: InformationPageComponent, path: '', pathMatch: 'full' }],
    component: LayoutComponent,
    path: '',
    pathMatch: 'full',
    title: `Account Information`,
  },
];

@NgModule({
  declarations: [LayoutComponent, InformationPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class AccountModule {}
