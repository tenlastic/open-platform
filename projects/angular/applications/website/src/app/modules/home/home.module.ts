import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '@app/shared/shared.module';

import { HomeComponent } from './home.component';

export const ROUTES: Routes = [
  { path: '', component: HomeComponent }
];

@NgModule({
  entryComponents: [],
  declarations: [
    HomeComponent
  ],
  imports: [
    SharedModule,

    RouterModule.forChild(ROUTES)
  ]
})
export class HomeModule { }
