import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { HomeComponent } from './home.component';

export const ROUTES: Routes = [{ component: HomeComponent, path: '', title: 'Home' }];

@NgModule({
  declarations: [HomeComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class HomeModule {}
