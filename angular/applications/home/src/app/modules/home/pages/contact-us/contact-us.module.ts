import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SharedModule } from '../../../../shared/shared.module';
import { ContactUsComponent } from './contact-us.component';

export const ROUTES: Routes = [{ path: '', component: ContactUsComponent }];

@NgModule({
  declarations: [ContactUsComponent],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class ContactUsModule {}
