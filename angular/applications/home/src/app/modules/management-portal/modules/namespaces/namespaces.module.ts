import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { NamespaceUserFieldComponent } from './components';
import {
  NamespacesFormPageComponent,
  NamespacesJsonPageComponent,
  NamespacesListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { path: '', component: NamespacesListPageComponent },
  { path: ':_id', component: NamespacesFormPageComponent },
  { path: ':_id/json', component: NamespacesJsonPageComponent },
];

@NgModule({
  declarations: [
    NamespaceUserFieldComponent,

    NamespacesFormPageComponent,
    NamespacesJsonPageComponent,
    NamespacesListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class NamespaceModule {}
