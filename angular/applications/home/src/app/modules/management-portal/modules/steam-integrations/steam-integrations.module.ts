import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  SteamIntegrationsFormPageComponent,
  SteamIntegrationsJsonPageComponent,
  SteamIntegrationsListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: SteamIntegrationsListPageComponent, path: '', title: 'Steam Integrations' },
  {
    component: SteamIntegrationsFormPageComponent,
    data: { param: 'steamIntegrationId', title: 'Steam Integration' },
    path: ':steamIntegrationId',
    title: FormResolver,
  },
  {
    component: SteamIntegrationsJsonPageComponent,
    data: { param: 'steamIntegrationId', title: 'Steam Integration' },
    path: ':steamIntegrationId/json',
    title: FormResolver,
  },
];

@NgModule({
  declarations: [
    SteamIntegrationsFormPageComponent,
    SteamIntegrationsJsonPageComponent,
    SteamIntegrationsListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class SteamIntegrationModule {}
