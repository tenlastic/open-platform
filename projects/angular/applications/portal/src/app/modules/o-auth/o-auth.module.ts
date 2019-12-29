import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OAuthComponent } from './o-auth.component';

export const ROUTES: Routes = [{ path: '', component: OAuthComponent }];

@NgModule({
  declarations: [OAuthComponent],
  imports: [RouterModule.forChild(ROUTES)],
})
export class OAuthModule {}
