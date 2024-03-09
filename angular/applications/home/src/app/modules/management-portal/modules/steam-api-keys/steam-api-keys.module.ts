import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FormResolver } from '../../../../core/resolvers';
import { SharedModule } from '../../../../shared/shared.module';
import {
  SteamApiKeysFormPageComponent,
  SteamApiKeysJsonPageComponent,
  SteamApiKeysListPageComponent,
} from './pages';

export const ROUTES: Routes = [
  { component: SteamApiKeysListPageComponent, path: '', title: 'Steam API Keys' },
  {
    component: SteamApiKeysFormPageComponent,
    data: { param: 'steamApiKeyId', title: 'Steam API Key' },
    path: ':steamApiKeyId',
    title: FormResolver,
  },
  {
    component: SteamApiKeysJsonPageComponent,
    data: { param: 'steamApiKeyId', title: 'Steam API Key' },
    path: ':steamApiKeyId/json',
    title: FormResolver,
  },
];

@NgModule({
  declarations: [
    SteamApiKeysFormPageComponent,
    SteamApiKeysJsonPageComponent,
    SteamApiKeysListPageComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(ROUTES)],
})
export class SteamApiKeyModule {}
