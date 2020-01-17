import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { AccessControlListFieldComponent } from './components';
import { NamespacesFormPageComponent, NamespacesListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: NamespacesListPageComponent },
  { path: ':_id', component: NamespacesFormPageComponent },
];

@NgModule({
  declarations: [
    AccessControlListFieldComponent,

    NamespacesFormPageComponent,
    NamespacesListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class NamespaceModule {}
