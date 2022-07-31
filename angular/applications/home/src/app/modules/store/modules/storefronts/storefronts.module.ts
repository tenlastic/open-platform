import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { ListPageComponent } from './pages';

export const ROUTES: Routes = [
  { path: '', component: ListPageComponent },
  {
    path: ':namespaceId',
    loadChildren: () => import('../storefront/storefront.module').then((m) => m.StorefrontModule),
  },
];

@NgModule({
  declarations: [ListPageComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class StorefrontsModule {}
