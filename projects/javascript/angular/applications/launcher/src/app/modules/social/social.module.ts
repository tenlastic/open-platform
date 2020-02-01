import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ComponentLibraryModule } from '@tenlastic/ng-component-library';

import { SharedModule } from '../../shared/shared.module';
import { LayoutComponent } from './components';
import { MessagesPageComponent } from './pages';

export const ROUTES: Routes = [
  {
    children: [
      {
        component: MessagesPageComponent,
        path: '',
        pathMatch: 'full',
      },
      {
        component: MessagesPageComponent,
        path: ':_id',
      },
    ],
    component: LayoutComponent,
    path: '',
  },
];

@NgModule({
  declarations: [LayoutComponent, MessagesPageComponent],
  imports: [ComponentLibraryModule, SharedModule, RouterModule.forChild(ROUTES)],
})
export class SocialModule {}
